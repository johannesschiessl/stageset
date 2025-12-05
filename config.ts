export interface Notification {
    id: string;
    label: string;
    emoji: string;
    color: string;
}

export const notifications: Notification[] = [
    { id: "applause", label: "Applause", emoji: "👏", color: "#FFD700" },
    { id: "break", label: "Break Time", emoji: "☕", color: "#4CAF50" },
    { id: "quiet", label: "Quiet Please", emoji: "🤫", color: "#FF5722" },
    { id: "start", label: "Start", emoji: "▶️", color: "#2196F3" },
    { id: "stop", label: "Stop", emoji: "⏹️", color: "#f44336" },
    { id: "thumbsup", label: "Thumbs Up", emoji: "👍", color: "#8BC34A" },
    { id: "question", label: "Question", emoji: "❓", color: "#9C27B0" },
    { id: "attention", label: "Attention", emoji: "⚠️", color: "#FF9800" },
];

