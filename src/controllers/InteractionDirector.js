const formats = {
  shorts: {
    eyebrow: "9:16 · Shorts · Reels · VK Клипы",
    title: "Вертикальный формат",
    lead: "Короткое видео должно зацепить сразу: сильный первый кадр, ясный темп, субтитры и точные визуальные акценты.",
    tags: ["Динамичный монтаж", "Субтитры", "Графика", "Саунд-дизайн"],
    src: "./media/clips/shorts-showcase.m4v",
    poster: "./media/posters/shorts-showcase.jpg",
    accent: "cyan",
    hasAudio: false,
  },
  youtube: {
    eyebrow: "16:9 · YouTube · Storytelling",
    title: "История, которую досматривают",
    lead: "Монтаж развивается вместе с голосом: сцены раскрывают смысл, меняют настроение и ведут зрителя до финальной точки.",
    tags: ["Монтаж под озвучку", "Драматургия", "Визуальная история", "Музыка и звук"],
    src: "./media/clips/youtube-story.m4v",
    poster: "./media/posters/youtube-story.jpg",
    accent: "violet",
  },
  vfx: {
    eyebrow: "VFX · Fusion · Experiments",
    title: "Кадр открывает другой мир",
    lead: "Трекинг, частицы, свет и композитинг встраиваются в реальное пространство, чтобы эффект ощущался частью сцены.",
    tags: ["Fusion", "Трекинг", "Частицы", "Композитинг"],
    src: "./media/clips/vfx-building.m4v",
    poster: "./media/posters/vfx-building.jpg",
    accent: "coral",
    hasAudio: false,
  },
};

export class InteractionDirector {
  constructor() {
    this.portal = document.querySelector("[data-format-portal]");
    this.surface = this.portal?.querySelector(".format-portal__surface");
    this.video = this.portal?.querySelector("[data-format-video]");
    this.media = this.portal?.querySelector("[data-format-media]");
    this.audioHint = this.portal?.querySelector("[data-format-audio-hint]");
    this.backgroundElements = [...document.querySelectorAll(".site-header, main, .filmstrip")];
    this.motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.lastTrigger = null;
    this.onClick = this.onClick.bind(this);
    this.onKeydown = this.onKeydown.bind(this);
    document.addEventListener("click", this.onClick);
    document.addEventListener("keydown", this.onKeydown);
  }

  onClick(event) {
    const formatTrigger = event.target.closest("[data-format-open]");
    const closeTrigger = event.target.closest("[data-format-close]");
    const interactive = event.target.closest("a, button, summary, [role='button']");

    if (interactive) this.burst(event, interactive);

    if (closeTrigger) {
      this.closeFormat();
      return;
    }

    if (formatTrigger) {
      this.openFormat(formatTrigger, event);
      return;
    }

    const anchor = event.target.closest("a[href^='#']");
    if (!anchor || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.querySelector(anchor.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    const navigate = () => {
      history.pushState(null, "", anchor.getAttribute("href"));
      target.scrollIntoView({ behavior: this.motionQuery.matches ? "auto" : "smooth", block: "start" });
    };
    if (this.motionQuery.matches) navigate();
    else window.setTimeout(navigate, 170);
  }

  openFormat(trigger, event) {
    const data = formats[trigger.dataset.formatOpen];
    if (!data || !this.portal) return;
    this.lastTrigger = trigger;
    const rect = trigger.getBoundingClientRect();
    const x = event.clientX || rect.left + rect.width / 2;
    const y = event.clientY || rect.top + rect.height / 2;

    this.portal.querySelector("[data-format-eyebrow]").textContent = data.eyebrow;
    this.portal.querySelector("[data-format-title]").textContent = data.title;
    this.portal.querySelector("[data-format-lead]").textContent = data.lead;
    this.portal.querySelector("[data-format-tags]").innerHTML = data.tags.map((tag) => `<li>${tag}</li>`).join("");
    this.surface.dataset.accent = data.accent;
    this.surface.style.setProperty("--portal-x", `${x}px`);
    this.surface.style.setProperty("--portal-y", `${y}px`);
    this.video.src = data.src;
    this.video.poster = data.poster;
    this.video.muted = true;
    this.video.controls = data.hasAudio !== false;
    this.media?.classList.toggle("is-silent", data.hasAudio === false);
    if (this.audioHint) this.audioHint.hidden = data.hasAudio === false;
    this.video.load();

    this.portal.hidden = false;
    this.portal.setAttribute("aria-hidden", "false");
    this.backgroundElements.forEach((element) => { element.inert = true; });
    document.body.classList.add("is-format-open");
    trigger.classList.add("is-opening");
    window.dispatchEvent(new CustomEvent("framezero:burst", { detail: { strength: 1 } }));

    requestAnimationFrame(() => {
      this.portal.classList.add("is-open");
      this.video.play().catch(() => {});
      this.portal.querySelector(".format-portal__close")?.focus();
    });
    window.setTimeout(() => trigger.classList.remove("is-opening"), 700);
  }

  closeFormat() {
    if (!this.portal || this.portal.hidden) return;
    this.portal.classList.remove("is-open");
    this.portal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-format-open");
    this.video?.pause();
    window.setTimeout(() => {
      this.portal.hidden = true;
      this.video?.removeAttribute("src");
      this.video?.removeAttribute("poster");
      this.video?.load();
      this.backgroundElements.forEach((element) => { element.inert = false; });
      this.lastTrigger?.focus();
    }, this.motionQuery.matches ? 0 : 620);
  }

  burst(event, target) {
    if (this.motionQuery.matches) return;
    const rect = target.getBoundingClientRect();
    const x = event.clientX || rect.left + rect.width / 2;
    const y = event.clientY || rect.top + rect.height / 2;
    const burst = document.createElement("span");
    burst.className = "click-burst";
    burst.style.setProperty("--burst-x", `${x}px`);
    burst.style.setProperty("--burst-y", `${y}px`);
    burst.innerHTML = `<i class="click-burst__ring"></i>${Array.from({ length: 14 }, (_, index) => `<i class="click-burst__spark" style="--angle:${index * (360 / 14)}deg;--distance:${42 + (index % 4) * 13}px;--delay:${(index % 3) * 18}ms"></i>`).join("")}`;
    document.body.append(burst);
    window.dispatchEvent(new CustomEvent("framezero:burst", { detail: { strength: 0.5 } }));
    window.setTimeout(() => burst.remove(), 900);
  }

  onKeydown(event) {
    if (event.key === "Escape") {
      this.closeFormat();
      return;
    }

    if (event.key !== "Tab" || !this.portal || this.portal.hidden) return;
    const focusable = [...this.portal.querySelectorAll("button, video[controls], [href], [tabindex]:not([tabindex='-1'])")]
      .filter((element) => !element.disabled && element.getClientRects().length > 0);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  dispose() {
    document.removeEventListener("click", this.onClick);
    document.removeEventListener("keydown", this.onKeydown);
  }
}
