import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("phone-case-root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
