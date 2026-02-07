import React from "react";

interface Props {
  activeTab: "stage" | "setlist";
  onTabChange: (tab: "stage" | "setlist") => void;
}

export function TabBar({ activeTab, onTabChange }: Props) {
  return (
    <div className="tab-bar">
      <button
        className={`tab-btn ${activeTab === "stage" ? "active" : ""}`}
        onClick={() => onTabChange("stage")}
      >
        Stage Plan
      </button>
      <button
        className={`tab-btn ${activeTab === "setlist" ? "active" : ""}`}
        onClick={() => onTabChange("setlist")}
      >
        Setlist
      </button>
    </div>
  );
}
