import WebSocket from "ws";
import { ethers } from "ethers";

// ── EIP-712 Domain & Types (must match server exactly) ────────────────────────
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

// ── Connect ───────────────────────────────────────────────────────────────────
const ws = new WebSocket("ws://localhost:8766");

ws.on("open", () => {
  console.log("[Client] Connected — waiting for challenge...");
});

ws.on("message", async (raw) => {
  const { type, payload } = JSON.parse(raw.toString());

  // Step 1: Receive challenge from server
  if (type === "auth:challenge") {
    console.log(`[Client] Got challenge: ${payload.challenge}`);

    // Step 2: Sign the challenge using EIP-712
    const signature = await wallet.signTypedData(DOMAIN, TYPES, {
      challenge: payload.challenge,
      timestamp: payload.timestamp,
    });

    console.log(`[Client] Signed. Sending auth response...`);

    // Step 3: Send signature back to server
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
  }

  if (type === "auth:failed") {
    console.error(`[Client] Auth failed: ${payload.reason}`);
    ws.close();
  }

  // Step 4: Receive market data after auth
  if (type === "price:update") {
    const arrow = payload.change >= 0 ? "▲" : "▼";
    console.log(
      `[Price] ${payload.symbol} $${payload.price} ${arrow} ${payload.change}`,
    );
  }
});

ws.on("close", () => {
  // setTimeout(() => ws.reconnect(), 5000);
  console.log("[Client] Disconnected");
});
ws.on("error", (err) => console.error("[Client] Error:", err.message));
