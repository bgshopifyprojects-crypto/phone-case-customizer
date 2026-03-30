import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Prevent Pull-to-Refresh on Chrome Android and Safari iOS.
// { passive: false } is required so preventDefault() is honoured.
window.addEventListener(
  "touchstart",
  (e) => {
    if (window.scrollY === 0) {
      e.preventDefault();
    }
  },
  { passive: false },
);

createRoot(document.getElementById("phone-case-root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
