import { WebSocketServer, WebSocket } from "ws";
import { ethers } from "ethers";
import crypto from "crypto";

// ── EIP-712 Domain & Types ────────────────────────────────────────────────────
// These must match exactly on both server and client

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

// ── Authorised addresses (whitelist) ─────────────────────────────────────────
const ALLOWED_ADDRESSES = new Set([
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Hardhat account #0 (test)
]);

// ── WebSocket server ──────────────────────────────────────────────────────────
const wss = new WebSocketServer({ port: 8766 });

// Track authenticated clients only
const authenticatedClients = new Set<WebSocket>();

// Store pending challenges: ws → { challenge, timestamp }
const pendingChallenges = new Map<WebSocket, { challenge: string; timestamp: number }>();

wss.on("connection", (ws) => {
  console.log("[Server] New connection — waiting for auth...");

  // Step 1: Send challenge to client
  const challenge = crypto.randomBytes(16).toString("hex");
  const timestamp = Math.floor(Date.now() / 1000);
  pendingChallenges.set(ws, { challenge, timestamp });

  ws.send(JSON.stringify({ type: "auth:challenge", payload: { challenge, timestamp } }));

  // Step 2: Handle auth response
  ws.on("message", (raw) => {
    const { type, payload } = JSON.parse(raw.toString());

    if (type === "auth:response") {
      const pending = pendingChallenges.get(ws);
      if (!pending) {
        ws.send(JSON.stringify({ type: "auth:failed", payload: { reason: "No challenge found" } }));
        ws.close();
        return;
      }

      // Check challenge is not expired (30 seconds)
      const age = Math.floor(Date.now() / 1000) - pending.timestamp;
      if (age > 30) {
        ws.send(JSON.stringify({ type: "auth:failed", payload: { reason: "Challenge expired" } }));
        ws.close();
        return;
      }

      // Step 3: Verify EIP-712 signature — recover the signer's address
      try {
        const recoveredAddress = ethers.verifyTypedData(
          DOMAIN,
          TYPES,
          { challenge: pending.challenge, timestamp: pending.timestamp },
          payload.signature,
        );

        // Step 4: Check if address is whitelisted
        if (!ALLOWED_ADDRESSES.has(recoveredAddress)) {
          ws.send(JSON.stringify({ type: "auth:failed", payload: { reason: "Address not authorised" } }));
          ws.close();
          return;
        }

        // Auth passed
        pendingChallenges.delete(ws);
        authenticatedClients.add(ws);
        ws.send(JSON.stringify({ type: "auth:success", payload: { address: recoveredAddress } }));
        console.log(`[Server] Authenticated: ${recoveredAddress}`);

      } catch (err) {
        ws.send(JSON.stringify({ type: "auth:failed", payload: { reason: "Invalid signature" } }));
        ws.close();
      }
    }
  });

  ws.on("close", () => {
    pendingChallenges.delete(ws);
    authenticatedClients.delete(ws);
    console.log("[Server] Client disconnected");
  });
});

// ── Broadcast to authenticated clients only ───────────────────────────────────
function broadcast(type: string, payload: any) {
  const msg = JSON.stringify({ type, payload });
  authenticatedClients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
}

// ── Fake market data ──────────────────────────────────────────────────────────
const prices: Record<string, number> = { BTC: 50000, ETH: 3000 };

setInterval(() => {
  for (const symbol in prices) {
    const change = Math.floor(Math.random() * 3 - 1);
    prices[symbol] += change;
    broadcast("price:update", { symbol, price: prices[symbol], change });
  }
}, 1000);

console.log("[Server] Auth server running on ws://localhost:8766");
