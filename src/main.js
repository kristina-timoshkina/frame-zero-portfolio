import "@fontsource-variable/oswald";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/motion.css";
import { createAppShell } from "./app/AppShell.js";
import { InteractionDirector } from "./controllers/InteractionDirector.js";

const app = document.querySelector("#app");
app.append(createAppShell());
const interactionDirector = new InteractionDirector();

const montageEntry = document.querySelector(".hero__montage-entry");
montageEntry?.addEventListener("click", (event) => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) {
    window.location.assign(montageEntry.href);
    return;
  }

  const ring = montageEntry.querySelector(".hero__zero-ring");
  const bounds = ring.getBoundingClientRect();
  document.documentElement.style.setProperty("--montage-x", `${bounds.left + bounds.width / 2}px`);
  document.documentElement.style.setProperty("--montage-y", `${bounds.top + bounds.height / 2}px`);
  document.documentElement.classList.add("montage-entering");

  window.setTimeout(() => window.location.assign(montageEntry.href), 720);
});

window.addEventListener("pageshow", () => {
  document.documentElement.classList.remove("montage-entering");
});

window.requestAnimationFrame(() => {
  document.documentElement.classList.add("app-ready");
  window.setTimeout(() => document.querySelector("#boot-poster")?.remove(), 160);
});

if (window.location.hash) {
  window.requestAnimationFrame(() => {
    const target = document.querySelector(window.location.hash);
    if (!target) return;
    const previousBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";
    target.scrollIntoView({ block: "start", behavior: "instant" });
    window.requestAnimationFrame(() => {
      document.documentElement.style.scrollBehavior = previousBehavior;
    });
  });
}

let sceneCanvas = null;
let scrollDirector = null;
let mediaDirector = null;

const loadInterfaceDirectors = async () => {
  const [{ ScrollDirector }, { MediaDirector }] = await Promise.all([
    import("./controllers/ScrollDirector.js"),
    import("./controllers/MediaDirector.js"),
  ]);
  scrollDirector = new ScrollDirector();
  mediaDirector = new MediaDirector();
};

const loadSceneCanvas = async () => {
  const { SceneCanvas } = await import("./three/SceneCanvas.js");
  sceneCanvas = new SceneCanvas(document.querySelector("#scene-canvas"));
};

window.requestAnimationFrame(loadInterfaceDirectors);

if ("requestIdleCallback" in window) {
  window.requestIdleCallback(loadSceneCanvas, { timeout: 420 });
} else {
  window.setTimeout(loadSceneCanvas, 80);
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
    if (activeIndex >= 0) {
      filmstripTrack?.style.setProperty("--film-index", activeIndex);
      sceneLinks.forEach((link) => {
        if (link.dataset.sceneLink === id) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    }
  },
  { rootMargin: "-28% 0px -52%", threshold: [0.05, 0.25, 0.55] },
);

scenes.forEach((scene) => observer.observe(scene));

window.addEventListener("beforeunload", () => {
  sceneCanvas?.dispose();
  scrollDirector?.dispose();
  mediaDirector?.dispose();
  interactionDirector.dispose();
});
