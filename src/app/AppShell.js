import { projects, filmstripItems } from "./projects.js";
import { createCaseSection } from "../components/CaseSection.js";
import { createFilmstripNav } from "../components/FilmstripNav.js";

function createHeader() {
  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <a class="wordmark" href="#hero" aria-label="FRAME ZERO — наверх">
      <span class="wordmark__mark" aria-hidden="true"></span>
      <span>FRAME ZERO</span>
    </a>
    <div class="site-header__meta">
      <span>Евгений Тимошкин</span>
      <span class="site-header__divider" aria-hidden="true"></span>
      <span>режиссёр монтажа</span>
    </div>
  `;
  return header;
}

function createHero() {
  const hero = document.createElement("section");
  hero.id = "hero";
  hero.className = "hero scene";
  hero.dataset.scene = "hero";
  hero.innerHTML = `
    <div class="hero__orbit hero__orbit--one" aria-hidden="true"></div>
    <div class="hero__orbit hero__orbit--two" aria-hidden="true"></div>
    <div class="hero__content">
      <p class="eyebrow hero__eyebrow">Интерактивное портфолио · 2026</p>
      <h1><span>FRAME</span><span>ZERO</span></h1>
      <p class="hero__statement">Обычный кадр <em>заканчивается</em> здесь.</p>
      <p class="hero__intro">Монтаж, VFX, цвет и звук — работы Евгения Тимошкина в формате короткого интерактивного фильма.</p>
      <div class="hero__actions">
        <a class="button button--primary" href="#portal">Смотреть проекты <span aria-hidden="true">↓</span></a>
        <span class="hero__note">Прокрутка управляет историей</span>
      </div>
    </div>
    <div class="hero__edition" aria-hidden="true">
      <span>EDIT</span><span>COLOR</span><span>FUSION</span><span>FAIRLIGHT</span>
    </div>
  `;
  return hero;
}

function createManifesto() {
  const section = document.createElement("section");
  section.className = "manifesto scene";
  section.dataset.scene = "hero";
  section.innerHTML = `
    <p class="eyebrow">Из материала — в ощущение</p>
    <p class="manifesto__line">Видео, которое</p>
    <p class="manifesto__line manifesto__line--accent">объясняет<span>,</span></p>
    <p class="manifesto__line manifesto__line--offset">удерживает<span>,</span></p>
    <p class="manifesto__line">вызывает эмоцию<span>.</span></p>
  `;
  return section;
}

function createFormats() {
  const section = document.createElement("section");
  section.id = "formats";
  section.className = "formats scene";
  section.dataset.scene = "formats";
  section.innerHTML = `
    <div>
      <p class="eyebrow">Блогерам · экспертам · брендам</p>
      <h2>Одна идея.<br><span>Любой формат.</span></h2>
    </div>
    <div class="format-reel" aria-label="Подборка форматов">
      <article class="format-card format-card--vertical"><span>9:16</span><strong>Shorts<br>Reels<br>VK Клипы</strong></article>
      <article class="format-card format-card--wide"><span>16:9</span><strong>YouTube<br>Storytelling</strong></article>
      <article class="format-card format-card--square"><span>VFX</span><strong>Motion<br>Experiments</strong></article>
    </div>
  `;
  return section;
}

function createAuthor() {
  const section = document.createElement("section");
  section.id = "author";
  section.className = "author scene";
  section.dataset.scene = "author";
  section.innerHTML = `
    <div class="author__signature">
      <video muted loop playsinline preload="none" aria-label="Анимация логотипа Tim Cut" data-project-video>
        <source src="./media/clips/tim-cut-logo.m4v" type="video/mp4">
      </video>
      <span class="author__signature-label">Logo animation · Tim Cut</span>
    </div>
    <div class="author__copy">
      <p class="eyebrow">Автор представленных работ</p>
      <h2>Евгений<br>Тимошкин</h2>
      <p class="author__role">Режиссёр монтажа · Tim Cut</p>
      <ul class="author__skills" aria-label="Специализации">
        <li>Edit</li><li>Color</li><li>Fusion</li><li>Fairlight</li>
      </ul>
    </div>
  `;
  return section;
}

function createFinal() {
  const section = document.createElement("section");
  section.id = "final";
  section.className = "final scene";
  section.dataset.scene = "final";
  section.innerHTML = `
    <p class="eyebrow">Финальный кадр</p>
    <h2>Обычный кадр<br>заканчивается здесь.</h2>
    <p class="final__statement">Следующая история начинается с идеи.</p>
    <div class="final__actions">
      <a class="button button--primary" href="#hero">Пережить ещё раз <span aria-hidden="true">↑</span></a>
      <button class="button button--ghost" type="button" data-open-directions aria-expanded="false">Выбрать направление</button>
    </div>
    <div class="direction-panel" hidden>
      <a href="#buzz">Для бренда</a>
      <a href="#formats">Для эксперта</a>
      <a href="#story">Для истории</a>
    </div>
    <p class="final__legal">Учебная концепция. Форма заказа и передача данных не используются.</p>
  `;
  return section;
}

export function createAppShell() {
  const fragment = document.createDocumentFragment();
  fragment.append(createHeader());

  const main = document.createElement("main");
  main.id = "main-content";
  main.append(createHero(), createManifesto());
  projects.forEach((project, index) => main.append(createCaseSection(project, index)));
  main.append(createFormats(), createAuthor(), createFinal());

  fragment.append(main, createFilmstripNav(filmstripItems));
  return fragment;
}
