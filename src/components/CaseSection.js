import { createMediaFrame } from "./MediaFrame.js";

function formatDisplayTitle(title) {
  return title.replaceAll(
    "Й",
    '<span class="case-letter-y" aria-hidden="true">И<svg class="case-letter-y__breve" viewBox="0 0 10 7" focusable="false"><path d="M1 1.2 C2.5 6.2 7.5 6.2 9 1.2" /></svg></span>',
  );
}

export function createCaseSection(project, index) {
  const section = document.createElement("section");
  section.id = project.id;
  section.className = `case-section scene scene--${project.accent}`;
  section.dataset.scene = project.id;

  const content = document.createElement("div");
  content.className = "case-section__content";
  content.innerHTML = `
    <div class="scene-index" aria-hidden="true">${project.number}</div>
    <p class="eyebrow">${project.eyebrow}</p>
    <h2 aria-label="${project.title}">${formatDisplayTitle(project.title)}</h2>
    <p class="case-section__lead">${project.lead}</p>
    <dl class="case-facts">
      <div>
        <dt>Задача</dt>
        <dd>${project.task}</dd>
      </div>
      <div>
        <dt>Результат</dt>
        <dd>${project.result}</dd>
      </div>
    </dl>
    <details class="tech-details">
      <summary>Как это сделано <span aria-hidden="true">↗</span></summary>
      <p>${project.tech}</p>
    </details>
  `;

  const media = createMediaFrame(project);
  if (index % 2 === 1) section.classList.add("case-section--reverse");
  section.append(content, media);

  return section;
}
