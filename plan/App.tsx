import React, { createContext, useContext, useState } from "react";
import { createRoot } from "react-dom/client";
import type { PlanContextType } from "./types";
import { usePlanWebSocket } from "./hooks/useWebSocket";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { TabBar } from "./components/TabBar";
import { StagePlan } from "./components/StagePlan";
import { Setlist } from "./components/Setlist";
import { LiveMode } from "./components/LiveMode";
import "./App.css";

export const PlanContext = createContext<PlanContextType>(null!);
export const usePlan = () => useContext(PlanContext);

function App() {
  const { state, status, send } = usePlanWebSocket();
  const [activeTab, setActiveTab] = useState<"stage" | "setlist">("stage");
  const [liveMode, setLiveMode] = useState(false);

  if (liveMode) {
    return (
      <PlanContext.Provider value={{ state, status, send }}>
        <LiveMode onExit={() => setLiveMode(false)} />
      </PlanContext.Provider>
    );
  }

  return (
    <PlanContext.Provider value={{ state, status, send }}>
      <ConnectionStatus status={status} />
      <div className="plan-header">
        <h1><a href="/">Stageset</a> / Plan</h1>
        <TabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLiveMode={() => setLiveMode(true)}
        />
      </div>
      <div className="tab-content">
        {activeTab === "stage" ? <StagePlan /> : <Setlist />}
      </div>
    </PlanContext.Provider>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
