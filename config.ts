export interface Notification {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

export const notifications: Notification[] = [
  {
    id: "all-mics-off",
    label: "Alle Mikrofone aus",
    emoji: "🤫",
    color: "#FFD700",
  },
  {
    id: "mics-closer",
    label: "Mikrofone näher",
    emoji: "🔊",
    color: "#4CAF50",
  },
];
