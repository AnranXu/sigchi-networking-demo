import React from "react";
import { createRoot } from "react-dom/client";
import NetworkUI from "../components/network-ui";
import "../app/globals.css";

createRoot(document.getElementById("app")!).render(<NetworkUI />);
