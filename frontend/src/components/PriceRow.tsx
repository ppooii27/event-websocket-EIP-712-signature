import React from "react";

interface Props {
  symbol: string;
  price: number;
  change: number;
}

// React.memo: only re-renders if symbol/price/change actually changed
const PriceRow = React.memo(({ symbol, price, change }: Props) => {
  return (
    <tr style={{ borderBottom: "1px solid #eee" }}>
      <td style={{ padding: "8px 16px 8px 0" }}>{symbol}</td>
      <td data-testid={`price-${symbol}`} style={{ padding: "8px 16px", fontWeight: "bold" }}>
        {price}
      </td>
      <td style={{ padding: "8px 0", color: change > 0 ? "green" : change < 0 ? "red" : "black" }}>
        {change > 0 ? "+" : ""}{change}
      </td>
    </tr>
  );
});

export default PriceRow;
