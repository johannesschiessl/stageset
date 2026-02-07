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
import "./App.css";

export const PlanContext = createContext<PlanContextType>(null!);
export const usePlan = () => useContext(PlanContext);

function App() {
  const { state, status, send } = usePlanWebSocket();
  const [activeTab, setActiveTab] = useState<"stage" | "setlist" | "config">("stage");
  const [liveMode, setLiveMode] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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

  return (
    <PlanContext.Provider value={{ state, status, send }}>
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
            <h1>Stageset</h1>
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
