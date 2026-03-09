import { register, Counter, Gauge } from "prom-client";
import { WebSocketServer, WebSocket } from "ws";
import EventEmitter from "./eventEmitter";
import { ethers } from "ethers";
import crypto from "crypto";
import http from "http";

const DOMAIN = {
  name: "RealtimeFeed",
  version: "1",
  chainId: 1,
};

const TYPES = {
  Auth: [
    { name: "challenge", type: "string" },
    { name: "timestamp", type: "uint256" },
  ],
};

const ALLOWED_ADDRESSES = new Set([
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
]);

// Prometheus Metrics
const connectedClients = new Gauge({
  name: "ws_connected_clients",
  help: "Number of connected WebSocket clients",
});

const authSuccess = new Counter({
  name: "ws_auth_success_total",
  help: "Total successful authentications",
});

const metricsServer = http.createServer(async (req, res) => {
  if (req.url === "/metrics") {
    res.setHeader("Content-Type", register.contentType);
    res.end(await register.metrics());
  }
});

metricsServer.listen(9090);

// Define Event types
interface MarkEvents {
  "price:update": {
    symbol: string;
    price: number;
    change: number;
  };
  "trade:executed": {
    symbol: string;
    price: number;
    qty: number;
    time: string;
  };
}

// WS Server
const wss = new WebSocketServer({ port: 8765 });

// Authented Client List
const clients = new Set<WebSocket>();

const pendingChallenges: Map<
  WebSocket,
  { challenge: string; timestamp: number }
> = new Map();

// Listen for new client connection
wss.on("connection", (ws: any) => {
  connectedClients.inc();
  console.log("server: new client connected - waiting for auth...");

  // send challenge to client
  const challenge = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now();
  pendingChallenges.set(ws, { challenge, timestamp });
  const msg = JSON.stringify({
    type: "auth:challenge",
    payload: { challenge, timestamp },
  });
  ws.send(msg);

  ws.on("message", (raw: any) => {
    const { type, payload } = JSON.parse(raw.toString());
    if (type === "auth:response") {
      const pending = pendingChallenges.get(ws);

      if (!pending) {
        ws.send(
          JSON.stringify({
            type: "auth:failed",
            payload: { reason: "No challenge found" },
          }),
        );
        ws.close();
        return;
      }

      // check challenge is not expired (30s)
      const age = Math.floor(Date.now() / 1000) - pending.timestamp;
      if (age > 30) {
        ws.send(
          JSON.stringify({
            type: "auth:failed",
            payload: { reason: "Challenge expired" },
          }),
        );
        ws.close();
        return;
      }

      // verify EIP-712 singature - recover the singer address
      try {
        const recoveredAddress = ethers.verifyTypedData(
          DOMAIN,
          TYPES,
          {
            challenge: pending.challenge,
            timestamp: pending.timestamp,
          },
          payload.signature,
        );

        if (!ALLOWED_ADDRESSES.has(recoveredAddress)) {
          ws.send(
            JSON.stringify({
              type: "auth:failed",
              payload: { reason: "Address not authorised" },
            }),
          );
          ws.close();
          return;
        }

        // auth passed
        pendingChallenges.delete(ws);
        ws.isAlive = true;
        clients.add(ws);
        authSuccess.inc();

        ws.send(
          JSON.stringify({
            type: "auth:success",
            payload: { address: recoveredAddress },
          }),
        );
        console.log(
          "Server: client authenticated - address:",
          recoveredAddress,
        );
      } catch (err) {
        ws.send(
          JSON.stringify({
            type: "auth:failed",
            payload: { reason: "invalid singature" },
          }),
        );

        ws.close();
        return;
      }
    }
  });

  ws.on("pong", () => {
    console.log("[Server] Received pong from client");
    ws.isAlive = true;
  });

  // close the connection handler
  ws.on("close", () => {
    clients.delete(ws);
    connectedClients.dec();
  });
});

setInterval(() => {
  clients.forEach((ws: any) => {
    if (!ws.isAlive) {
      ws.terminate();
      clients.delete(ws);
    } else {
      console.log("[Server] Sending ping to client");
      ws.isAlive = false;
      ws.ping();
    }
  });
}, 5000);

// Listen on EventEmitter & Broadcast to clients
const bus = new EventEmitter<MarkEvents>();

function broadcast(type: string, payload: any) {
  const msg = JSON.stringify({ type, payload });
  clients.forEach((ws) => {
    // check if the connection is still OPEN before sending
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  });
}

bus.on("price:update", (payload) => {
  broadcast("price:update", payload);
});
bus.on("trade:executed", (payload) => {
  broadcast("trade:executed", payload);
});

// Simulate fake data
const prices: Record<string, number> = {
  BTC: 50000,
  ETH: 3000,
};

// Push fake prive every second
setInterval(() => {
  for (const symbol in prices) {
    // define price change randomly between -1 and +1
    const change = Math.floor(Math.random() * 3 - 1);
    prices[symbol] += change;

    bus.emit("price:update", { symbol, price: prices[symbol], change });
  }
}, 1000);

// Push fake trade every 3 seconds

setInterval(() => {
  // defind the symbol randomly between BTC and ETH
  const symbol = Math.random() > 0.5 ? "BTC" : "ETH";

  // define qty randomly between 1 and 10
  const qty = Math.floor(Math.random() * 10 + 1);

  bus.emit("trade:executed", {
    symbol,
    price: prices[symbol],
    qty,
    time: new Date().toISOString(),
  });
}, 3000);

console.log("[Server] websocket server running on localhost:8765");
