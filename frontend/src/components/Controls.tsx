import React from "react";

interface Props {
  symbols: string[];
  paused: boolean;
  filter: string;
  search: string;
  onTogglePause: () => void;
  onFilterChange: (f: string) => void;
  onSearchChange: (s: string) => void;
}

// React.memo: only re-renders if props changed
const Controls = React.memo(({ symbols, paused, filter, search, onTogglePause, onFilterChange, onSearchChange }: Props) => {
  return (
    <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button onClick={onTogglePause}>
        {paused ? "▶ Resume" : "⏸ Pause"}
      </button>

      {["All", ...symbols].map((s) => (
        <button
          key={s}
          onClick={() => onFilterChange(s)}
          style={{ fontWeight: filter === s ? "bold" : "normal" }}
        >
          {s}
        </button>
      ))}

      <input
        placeholder="🔍 Search symbol..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{ marginLeft: "auto" }}
      />
    </div>
  );
});

export default Controls;
