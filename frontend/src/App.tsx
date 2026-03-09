import React from "react";
import usePriceStream from "./hooks/usePriceStream";

function App() {
  const { prices, changes } = usePriceStream();

  return (
    <div>
      {Object.entries(prices).map(([symbol, price]) => (
        <div
          key={symbol}
          style={{
            color:
              changes[symbol] > 0
                ? "green"
                : changes[symbol] < 0
                  ? "red"
                  : "black",
          }}
        >
          {symbol}: <span data-testid={`price-${symbol}`}>{price}</span>
        </div>
      ))}
    </div>
  );
}

export default App;
