export function createCinematicLayer() {
  const layer = document.createElement("div");
  layer.className = "cinematic-layer";
  layer.setAttribute("aria-hidden", "true");
  layer.innerHTML = `
    <div class="depth-rig">
      <div class="depth-panel depth-panel--one"><span>FRAME / 01</span></div>
      <div class="depth-panel depth-panel--two"><span>DEPTH / 02</span></div>
      <div class="depth-panel depth-panel--three"><span>MOTION / 03</span></div>
      <div class="depth-panel depth-panel--four"><span>CUT / 04</span></div>
    </div>
    <div class="cut-sweep"></div>
    <div class="scene-pulse"><span>СЦЕНА</span><strong>00</strong></div>
  `;
  return layer;
}
