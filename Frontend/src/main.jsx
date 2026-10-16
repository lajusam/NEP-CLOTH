import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import App from "./App.jsx";
import "./styles/globals.css";

const heroPreloads = {
  "/": ["/optimized/herosectionimg/hero-clean-768.webp", "/optimized/herosectionimg/hero-clean-480.webp 480w, /optimized/herosectionimg/hero-clean-768.webp 768w, /optimized/herosectionimg/hero-clean-1280.webp 1280w"],
  "/men": ["/optimized/images/male-section-768.webp", "/optimized/images/male-section-480.webp 480w, /optimized/images/male-section-768.webp 768w"],
  "/women": ["/optimized/images/women-section-768.webp", "/optimized/images/women-section-480.webp 480w, /optimized/images/women-section-768.webp 768w, /optimized/images/women-section-1280.webp 1280w"],
};
const hero = heroPreloads[window.location.pathname];
if (hero) {
  const preload = document.createElement("link");
  preload.rel = "preload";
  preload.as = "image";
  preload.href = hero[0];
  preload.setAttribute("imagesrcset", hero[1]);
  preload.setAttribute("imagesizes", "100vw");
  preload.fetchPriority = "high";
  document.head.append(preload);
}

// Register GSAP plugins globally once
gsap.registerPlugin(ScrollTrigger);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
