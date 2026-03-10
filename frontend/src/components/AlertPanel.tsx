import React from "react";

interface Props {
  symbols: string[];
  prices: Record<string, number>;
}

const AlertPanel = React.memo(({ symbols, prices }: Props) => {
  const [alertSymbol, setAlertSymbol] = React.useState("BTC");
  const [alertPrice, setAlertPrice] = React.useState("");

  const triggered = alertPrice !== "" && prices[alertSymbol] > Number(alertPrice);

  return (
    <div style={{ marginBottom: 16, padding: 12, border: "1px solid #ccc", borderRadius: 6 }}>
      <strong>Price Alert</strong>
      <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
        <select value={alertSymbol} onChange={(e) => setAlertSymbol(e.target.value)}>
          {symbols.map((s) => <option key={s}>{s}</option>)}
        </select>
        <span>{">"}</span>
        <input
          type="number"
          placeholder="Target price"
          value={alertPrice}
          onChange={(e) => setAlertPrice(e.target.value)}
          style={{ width: 120 }}
        />
        {triggered && (
          <span style={{ color: "red", fontWeight: "bold" }}>
            🔔 {alertSymbol} exceeded {alertPrice}!
          </span>
        )}
      </div>
    </div>
  );
});

export default AlertPanel;
