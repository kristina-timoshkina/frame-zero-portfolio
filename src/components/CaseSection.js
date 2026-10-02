import { createMediaFrame } from "./MediaFrame.js";

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
    <h2>${project.title}</h2>
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

