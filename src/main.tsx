import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import App from "./App";
import { MissingConfig } from "./MissingConfig";
import "./index.css";

const convexUrl = import.meta.env.VITE_CONVEX_URL;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {convexUrl ? (
      <ConvexProvider client={new ConvexReactClient(convexUrl)}>
        <App />
      </ConvexProvider>
    ) : (
      <MissingConfig />
    )}
  </StrictMode>,
);
