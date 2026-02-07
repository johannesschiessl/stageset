import React from "react";
import type { ConnectionStatus as Status } from "../types";

export function ConnectionStatus({ status }: { status: Status }) {
  return <div className={`connection-bar ${status}`} />;
}
