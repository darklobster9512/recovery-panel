import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { getHostBranding } from "@/hooks/usePageTitle";

// Start resolving the host branding as early as possible (login page waits for it).
getHostBranding();

createRoot(document.getElementById("root")!).render(<App />);
