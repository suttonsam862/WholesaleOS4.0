import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Uppy CSS required for file upload modals
import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.min.css";

createRoot(document.getElementById("root")!).render(<App />);
