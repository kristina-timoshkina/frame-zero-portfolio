export function createFormatPortal() {
  const portal = document.createElement("div");
  portal.className = "format-portal";
  portal.hidden = true;
  portal.setAttribute("data-format-portal", "");
  portal.setAttribute("role", "dialog");
  portal.setAttribute("aria-modal", "true");
  portal.setAttribute("aria-hidden", "true");
  portal.setAttribute("aria-labelledby", "format-portal-title");
  portal.innerHTML = `
    <div class="format-portal__backdrop" data-format-close></div>
    <section class="format-portal__surface">
      <button class="format-portal__close" type="button" data-format-close aria-label="Закрыть просмотр формата">
        <span>Закрыть</span><b aria-hidden="true">×</b>
      </button>
      <div class="format-portal__copy">
        <p class="eyebrow" data-format-eyebrow></p>
        <h2 id="format-portal-title" data-format-title></h2>
        <p class="format-portal__lead" data-format-lead></p>
        <ul class="format-portal__tags" data-format-tags aria-label="Что входит в формат"></ul>
      </div>
      <div class="format-portal__media" data-format-media>
        <span class="format-portal__credit">Работа Евгения Тимошкина</span>
        <video controls loop playsinline preload="metadata" data-format-video></video>
        <span class="format-portal__hint" data-format-audio-hint>Можно включить звук в плеере</span>
      </div>
    </section>
  `;
  return portal;
}
