import React from "react";
import type { NotificationPreset } from "../types";
import { NotificationPopover } from "./NotificationPopover";

interface Props {
  activeTab: "stage" | "setlist" | "config";
  onTabChange: (tab: "stage" | "setlist" | "config") => void;
  onLiveMode: () => void;
  onNotificationsToggle: () => void;
  notificationsOpen: boolean;
  notificationPresets: NotificationPreset[];
  onSendNotification: (presetId: number) => void;
  onCloseNotifications: () => void;
}

export function TabBar({
  activeTab,
  onTabChange,
  onLiveMode,
  onNotificationsToggle,
  notificationsOpen,
  notificationPresets,
  onSendNotification,
  onCloseNotifications,
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
        className={`tab-btn ${activeTab === "config" ? "active" : ""}`}
        onClick={() => onTabChange("config")}
      >
        Config
      </button>
      <div className="toolbar-popover-wrap">
        <button
          className={`tab-btn notify-btn ${notificationsOpen ? "active" : ""}`}
          onClick={onNotificationsToggle}
        >
          Notify
        </button>
        <NotificationPopover
          open={notificationsOpen}
          presets={notificationPresets}
          onClose={onCloseNotifications}
          onSend={onSendNotification}
        />
      </div>
      <button className="tab-btn live-btn" onClick={onLiveMode}>
        LIVE
      </button>
    </div>
  );
}
