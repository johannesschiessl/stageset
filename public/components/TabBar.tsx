import React from "react";

interface Props {
  activeTab: "stage" | "setlist";
  onTabChange: (tab: "stage" | "setlist") => void;
  onLiveMode: () => void;
  onNotificationsToggle: () => void;
  notificationsOpen: boolean;
}

export function TabBar({
  activeTab,
  onTabChange,
  onLiveMode,
  onNotificationsToggle,
  notificationsOpen,
}: Props) {
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
      <button
        className={`tab-btn notify-btn ${notificationsOpen ? "active" : ""}`}
        onClick={onNotificationsToggle}
      >
        Notify
      </button>
      <button className="tab-btn live-btn" onClick={onLiveMode}>
        LIVE
      </button>
    </div>
  );
}
