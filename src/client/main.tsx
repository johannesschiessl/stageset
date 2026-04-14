import { createRoot } from "react-dom/client";
import "./styles.css";

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Stageset</h1>;
}

root.render(<Frontend />);
