function createVideo({ src, label }, className = "") {
  return `
    <video class="project-video ${className}" muted loop playsinline preload="none" aria-label="${label}" data-project-video>
      <source src="${src}" type="video/mp4">
    </video>
  `;
}

function createStage(project) {
  if (project.media.kind === "mosaic") {
    return `
      <div class="media-frame__stage media-frame__stage--mosaic" data-media-stage role="button" tabindex="0" aria-label="Воспроизвести или остановить фрагменты VFX-работ">
        ${project.media.items.map((item, index) => createVideo(item, `project-video--tile project-video--tile-${index + 1}`)).join("")}
        <span class="media-frame__timecode">VFX / 03</span>
      </div>
    `;
  }

  const layout = project.media.layout === "portrait" ? " media-frame__stage--portrait" : "";
  return `
    <div class="media-frame__stage${layout}" data-media-stage role="button" tabindex="0" aria-label="Воспроизвести или остановить фрагмент проекта «${project.title}»">
      ${createVideo(project.media)}
      <span class="media-frame__timecode">00:${project.number}:00</span>
      <span class="media-frame__play-state" aria-hidden="true">PLAY</span>
    </div>
  `;
}

export function createMediaFrame(project) {
  const frame = document.createElement("div");
  frame.className = `media-frame media-frame--${project.accent}`;
  frame.dataset.project = project.id;

  frame.innerHTML = `
    <div class="media-frame__topline">
      <span>Работа Евгения Тимошкина</span>
      <span>${project.format}</span>
    </div>
    ${createStage(project)}
    <div class="media-frame__credit">
      <span>${project.contribution}</span>
      <button class="media-frame__sound" type="button" data-sound-toggle aria-pressed="false" aria-label="Включить звук в работе «${project.title}»">
        <span class="media-frame__sound-icon" aria-hidden="true">◖</span>
        <span data-sound-label>Звук</span>
      </button>
    </div>
  `;

  return frame;
}
