import React from "react";

interface Props {
  activeTab: "stage" | "setlist";
  onTabChange: (tab: "stage" | "setlist") => void;
  onLiveMode: () => void;
}

export function TabBar({ activeTab, onTabChange, onLiveMode }: Props) {
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
      <button className="tab-btn live-btn" onClick={onLiveMode}>
        LIVE
      </button>
    </div>
  );
}
