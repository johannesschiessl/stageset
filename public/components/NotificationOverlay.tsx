import React, { useEffect, useMemo, useRef, useState } from "react";
import type { NotificationEvent } from "../types";

interface Props {
  event: NotificationEvent | null;
}

function getContrastColor(hex: string): string {
  const value = hex.replace("#", "");
  if (value.length !== 6) return "#FFFFFF";
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#111111" : "#FFFFFF";
}

export function NotificationOverlay({ event }: Props) {
  const [activeEvent, setActiveEvent] = useState<NotificationEvent | null>(null);
  const [phase, setPhase] = useState<"hidden" | "visible" | "hiding">("hidden");
  const hideTimerRef = useRef<number | null>(null);
  const cleanupTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
      if (cleanupTimerRef.current !== null) window.clearTimeout(cleanupTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!event) return;

    setActiveEvent(event);
    setPhase("visible");

    if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
    if (cleanupTimerRef.current !== null) window.clearTimeout(cleanupTimerRef.current);

    hideTimerRef.current = window.setTimeout(() => {
      setPhase("hiding");
      cleanupTimerRef.current = window.setTimeout(() => {
        setPhase("hidden");
        setActiveEvent(null);
      }, 260);
    }, 2600);
  }, [event]);

  const textColor = useMemo(() => {
    if (!activeEvent) return "#FFFFFF";
    return getContrastColor(activeEvent.notification.color);
  }, [activeEvent]);

  if (!activeEvent || phase === "hidden") return null;

  return (
    <div
      className={`notification-showcase ${phase}`}
      style={{
        backgroundColor: activeEvent.notification.color,
        color: textColor,
      }}
    >
      <div className="notification-showcase-emoji" aria-hidden="true">
        {activeEvent.notification.emoji}
      </div>
      <div className="notification-showcase-label">{activeEvent.notification.label}</div>
    </div>
  );
}
