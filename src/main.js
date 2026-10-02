import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/motion.css";
import { createAppShell } from "./app/AppShell.js";

const app = document.querySelector("#app");
app.append(createAppShell());

let sceneCanvas = null;
let scrollDirector = null;
let mediaDirector = null;

const loadMotionLayer = async () => {
  const [{ SceneCanvas }, { ScrollDirector }, { MediaDirector }] = await Promise.all([
    import("./three/SceneCanvas.js"),
    import("./controllers/ScrollDirector.js"),
    import("./controllers/MediaDirector.js"),
  ]);
  sceneCanvas = new SceneCanvas(document.querySelector("#scene-canvas"));
  scrollDirector = new ScrollDirector();
  mediaDirector = new MediaDirector();
};

if ("requestIdleCallback" in window) {
  window.requestIdleCallback(loadMotionLayer, { timeout: 700 });
} else {
  window.setTimeout(loadMotionLayer, 120);
}

const directionButton = document.querySelector("[data-open-directions]");
const directionPanel = document.querySelector(".direction-panel");

directionButton?.addEventListener("click", () => {
  const shouldOpen = directionPanel.hidden;
  directionPanel.hidden = !shouldOpen;
  directionButton.setAttribute("aria-expanded", String(shouldOpen));
  if (shouldOpen) directionPanel.querySelector("a")?.focus();
});

const scenes = [...document.querySelectorAll("[data-scene]")];
const sceneLinks = [...document.querySelectorAll("[data-scene-link]")];

const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;
    const id = visible.target.dataset.scene;
    document.documentElement.dataset.activeScene = id;
    window.dispatchEvent(new CustomEvent("framezero:scenechange", { detail: { scene: id } }));
    const activeIndex = sceneLinks.findIndex((link) => link.dataset.sceneLink === id);
    const filmstripTrack = document.querySelector(".filmstrip__track");
    if (activeIndex >= 0) filmstripTrack?.style.setProperty("--film-index", activeIndex);
    sceneLinks.forEach((link) => {
      if (link.dataset.sceneLink === id) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  },
  { rootMargin: "-28% 0px -52%", threshold: [0.05, 0.25, 0.55] },
);

scenes.forEach((scene) => observer.observe(scene));

window.addEventListener("beforeunload", () => {
  sceneCanvas?.dispose();
  scrollDirector?.dispose();
  mediaDirector?.dispose();
});
