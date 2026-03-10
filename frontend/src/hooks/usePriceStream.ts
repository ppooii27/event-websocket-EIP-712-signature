import React from "react";
import { ethers } from "ethers";

const WS_URL = "ws://localhost:8765";

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

// ── Test wallet (Hardhat account #0 — never use real private key in code) ─────
const wallet = new ethers.Wallet(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
);

console.log(`[Client] Wallet address: ${wallet.address}`);

function usePriceStream() {
  const [prices, setPrices] = React.useState<Record<string, number>>({});
  const [changes, setChanges] = React.useState<Record<string, number>>({});
  const [paused, setPaused] = React.useState(false);
  const [status, setStatus] = React.useState<"connecting" | "authenticating" | "ready">("connecting");

  const wsRef = React.useRef<WebSocket | null>(null);
  const pausedRef = React.useRef(false); // ref for use inside ws.onmessage closure

  function togglePause() {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
  }

  React.useEffect(() => {
    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("connection establised");
        setStatus("authenticating");
      };

      ws.onmessage = async (raw: any) => {
        const { type, payload } = JSON.parse(raw.data);

        if (type === "auth:challenge") {
          console.log(`[Client] Got challenge: ${payload.challenge}`);

          const signature = await wallet.signTypedData(DOMAIN, TYPES, {
            challenge: payload.challenge,
            timestamp: payload.timestamp,
          });

          console.log(`[Client] Signed. Sending auth response...`);

          ws.send(
            JSON.stringify({
              type: "auth:response",
              payload: { signature, address: wallet.address },
            }),
          );
        }

        if (type === "auth:success") {
          console.log(`[Client] Auth passed! Address: ${payload.address}`);
          console.log("[Client] Now receiving market data...\n");
          setStatus("ready");
        }

        if (type === "auth:failed") {
          console.error(`[Client] Auth failed: ${payload.reason}`);
          ws.close();
        }

        if (type == "price:update") {
          if (pausedRef.current) return; // ignore updates when paused
          const { symbol, price, change } = payload;
          setPrices((prev) => ({ ...prev, [symbol]: price }));
          setChanges((prev) => ({ ...prev, [symbol]: change }));
        }
      };

      ws.onerror = (err) => {
        console.error("websocket error:", err);
      };

      ws.onclose = () => {
        console.log(
          "connnection closed, attemping to reconnect in 5 seconds ...",
        );

        // setTimeout(() => connect(), 5000);
      };
    }

    connect();

    return () => {
      wsRef.current?.close();
      if (wsRef.current) wsRef.current.onopen = null;
    };
  }, []);

  return { prices, changes, paused, togglePause, status };
}

export default usePriceStream;
