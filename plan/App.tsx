import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { PlanContextType } from "./types";
import { usePlanWebSocket } from "./hooks/useWebSocket";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { TabBar } from "./components/TabBar";
import { StagePlan } from "./components/StagePlan";
import { Setlist } from "./components/Setlist";
import { LiveMode } from "./components/LiveMode";
import { ConfigTab } from "./components/ConfigTab";
import { NotificationOverlay } from "./components/NotificationOverlay";
import { ShowSelector } from "./components/ShowSelector";
import { ShowSwitcher } from "./components/ShowSwitcher";
import "./App.css";

export const PlanContext = createContext<PlanContextType>(null!);
export const usePlan = () => useContext(PlanContext);

function App() {
  const { state, status, send } = usePlanWebSocket();
  const [activeTab, setActiveTab] = useState<"stage" | "setlist" | "config">("stage");
  const [liveMode, setLiveMode] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [currentShow, setCurrentShow] = useState<string | null>(null);
  const [shows, setShows] = useState<string[]>([]);
  const [showsLoading, setShowsLoading] = useState(true);

  // Fetch shows on mount
  useEffect(() => {
    fetch("/api/shows")
      .then((res) => res.json())
      .then((data) => {
        setShows(data.shows);
        setCurrentShow(data.currentShow);
        setShowsLoading(false);
      })
      .catch(() => setShowsLoading(false));
  }, []);

  // Listen for show:changed messages via the WebSocket dispatch
  // We tap into the ws.onmessage by watching the state for changes
  // triggered by show:changed. We use a custom event approach.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setCurrentShow(detail.show);
      // Refresh shows list
      fetch("/api/shows")
        .then((res) => res.json())
        .then((data) => setShows(data.shows))
        .catch(() => {});
    };
    window.addEventListener("show:changed", handler);
    return () => window.removeEventListener("show:changed", handler);
  }, []);

  const handleSelectShow = useCallback(async (name: string) => {
    try {
      const res = await fetch("/api/shows/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setCurrentShow(name);
      }
    } catch {}
  }, []);

  const handleCreateShow = useCallback(async (name: string) => {
    try {
      const res = await fetch("/api/shows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setCurrentShow(name);
        setShows((prev) => [...prev, name].sort());
        // Select the show (which also loads its state)
        await fetch("/api/shows/select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
      }
    } catch {}
  }, []);

  const handleDeleteShow = useCallback(async (name: string) => {
    try {
      const res = await fetch(`/api/shows/${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setShows((prev) => prev.filter((s) => s !== name));
      }
    } catch {}
  }, []);

  const openNotifications = useCallback(() => {
    setNotificationsOpen(true);
  }, []);

  const closeNotifications = useCallback(() => {
    setNotificationsOpen(false);
  }, []);

  const toggleNotifications = useCallback(() => {
    setNotificationsOpen((open) => !open);
  }, []);

  const sendNotification = useCallback(
    (presetId: number) => {
      send({ type: "notification:trigger", id: presetId });
      setNotificationsOpen(false);
    },
    [send],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "n") {
        event.preventDefault();
        openNotifications();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openNotifications]);

  useEffect(() => {
    setNotificationsOpen(false);
  }, [liveMode, activeTab]);

  // No show selected — show the selector
  if (!currentShow) {
    return (
      <ShowSelector
        shows={shows}
        onSelect={handleSelectShow}
        onCreate={handleCreateShow}
        onDelete={handleDeleteShow}
        loading={showsLoading}
      />
    );
  }

  return (
    <PlanContext.Provider value={{ state, status, send, currentShow }}>
      {liveMode ? (
        <LiveMode
          onExit={() => setLiveMode(false)}
          onToggleNotifications={toggleNotifications}
          onCloseNotifications={closeNotifications}
          onSendNotification={sendNotification}
          notificationPresets={state.notificationPresets}
          notificationsOpen={notificationsOpen}
        />
      ) : (
        <>
          <ConnectionStatus status={status} />
          <div className="plan-header">
            <ShowSwitcher
              currentShow={currentShow}
              shows={shows}
              onSwitch={handleSelectShow}
              onCreate={handleCreateShow}
            />
            <TabBar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onLiveMode={() => setLiveMode(true)}
              onNotificationsToggle={toggleNotifications}
              notificationsOpen={notificationsOpen}
              notificationPresets={state.notificationPresets}
              onSendNotification={sendNotification}
              onCloseNotifications={closeNotifications}
            />
          </div>
          <div className="tab-content">
            {activeTab === "stage" && <StagePlan />}
            {activeTab === "setlist" && <Setlist />}
            {activeTab === "config" && <ConfigTab />}
          </div>
        </>
      )}

      <NotificationOverlay event={state.notificationEvent} />
    </PlanContext.Provider>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
