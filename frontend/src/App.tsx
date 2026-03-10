import React from "react";
import usePriceStream from "./hooks/usePriceStream";
import PriceRow from "./components/PriceRow";
import AlertPanel from "./components/AlertPanel";
import Controls from "./components/Controls";

function App() {
  const { prices, changes, paused, togglePause } = usePriceStream();

  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState("All");
  const [sortBy, setSortBy] = React.useState<"symbol" | "price" | "change">("symbol");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");

  const symbols = Object.keys(prices);

  const displayed = Object.entries(prices)
    .filter(([symbol]) => filter === "All" || symbol === filter)
    .filter(([symbol]) => symbol.toLowerCase().includes(search.toLowerCase()))
    .sort(([aSymbol, aPrice], [bSymbol, bPrice]) => {
      let val = 0;
      if (sortBy === "symbol") val = aSymbol.localeCompare(bSymbol);
      else if (sortBy === "price") val = aPrice - bPrice;
      else if (sortBy === "change") val = (changes[aSymbol] ?? 0) - (changes[bSymbol] ?? 0);
      return sortDir === "asc" ? val : -val;
    });

  function toggleSort(col: "symbol" | "price" | "change") {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("asc"); }
  }

  function sortArrow(col: "symbol" | "price" | "change") {
    if (sortBy !== col) return " ↕";
    return sortDir === "asc" ? " ↑" : " ↓";
  }

  // useCallback: prevent Controls re-rendering due to new function reference every render
  const handleTogglePause = React.useCallback(() => togglePause(), [togglePause]);
  const handleFilterChange = React.useCallback((f: string) => setFilter(f), []);
  const handleSearchChange = React.useCallback((s: string) => setSearch(s), []);

  return (
    <div style={{ padding: 24, fontFamily: "monospace" }}>
      <h2>Real-time Price Dashboard</h2>

      <AlertPanel symbols={symbols} prices={prices} />

      <Controls
        symbols={symbols}
        paused={paused}
        filter={filter}
        search={search}
        onTogglePause={handleTogglePause}
        onFilterChange={handleFilterChange}
        onSearchChange={handleSearchChange}
      />

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #333", textAlign: "left" }}>
            <th style={{ cursor: "pointer", padding: "8px 16px 8px 0" }} onClick={() => toggleSort("symbol")}>
              Symbol{sortArrow("symbol")}
            </th>
            <th style={{ cursor: "pointer", padding: "8px 16px" }} onClick={() => toggleSort("price")}>
              Price{sortArrow("price")}
            </th>
            <th style={{ cursor: "pointer", padding: "8px 0" }} onClick={() => toggleSort("change")}>
              Change{sortArrow("change")}
            </th>
          </tr>
        </thead>
        <tbody>
          {displayed.map(([symbol, price]) => (
            <PriceRow
              key={symbol}
              symbol={symbol}
              price={price}
              change={changes[symbol] ?? 0}
            />
          ))}
        </tbody>
      </table>

      {paused && <p style={{ color: "orange", marginTop: 12 }}>⏸ Updates paused</p>}
    </div>
  );
}

export default App;
