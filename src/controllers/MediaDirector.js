export class MediaDirector {
  constructor() {
    this.frames = [...document.querySelectorAll(".media-frame, .author__signature")];
    this.videos = [...document.querySelectorAll("[data-project-video]")];
    this.soundButtons = [...document.querySelectorAll("[data-sound-toggle]")];
    this.visibleFrames = new Map();
    this.activeFrame = null;
    this.mediaActivity = false;
    this.suspended = false;
    this.saveData = navigator.connection?.saveData === true;
    this.bindEvents();
    this.observeFrames();
  }

  bindEvents() {
    this.onVisibility = () => {
      if (document.hidden) {
        this.pauseAll();
        return;
      }

      this.activateBestFrame();
    };

    this.onFormatOpen = () => {
      this.suspended = true;
      this.pauseAll();
      this.setMediaActivity(true);
    };

    this.onFormatClose = () => {
      this.suspended = false;
      this.activateBestFrame();
    };

    document.addEventListener("visibilitychange", this.onVisibility);
    document.addEventListener("framezero:formatopen", this.onFormatOpen);
    document.addEventListener("framezero:formatclose", this.onFormatClose);

    this.frames.forEach((frame) => {
      const stage = frame.querySelector("[data-media-stage]");
      const videos = [...frame.querySelectorAll("[data-project-video]")];
      const button = frame.querySelector("[data-sound-toggle]");

      stage?.addEventListener("click", () => {
        this.setActiveFrame(frame, { autoplay: false });
        const shouldPlay = frame.dataset.userPaused === "true" || videos.some((video) => video.paused);

        if (shouldPlay) {
          frame.dataset.userPaused = "false";
          frame.classList.remove("is-paused");
          videos.forEach((video) => this.play(video));
        } else {
          frame.dataset.userPaused = "true";
          videos.forEach((video) => video.pause());
          frame.classList.add("is-paused");
        }
      });

      stage?.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        stage.click();
      });

      button?.addEventListener("click", (event) => {
        event.stopPropagation();
        const primary = videos[0];
        if (!primary) return;

        const shouldEnable = primary.muted;
        this.setActiveFrame(frame, { autoplay: false });
        frame.dataset.userPaused = "false";
        frame.classList.remove("is-paused");
        videos.forEach((video) => this.hydrate(video));

        this.videos.forEach((video) => this.mute(video));
        this.soundButtons.forEach((otherButton) => this.setSoundButton(otherButton, false));
        videos.slice(1).forEach((video) => this.play(video));

        if (!shouldEnable) {
          this.play(primary);
          return;
        }

        primary.volume = 1;
        primary.defaultMuted = false;
        primary.muted = false;
        primary.removeAttribute("muted");
        this.setSoundButton(button, true);

        const promise = primary.play();
        promise?.catch(() => {
          this.mute(primary);
          this.setSoundButton(button, false);
          this.play(primary);
        });
      });
    });
  }

  observeFrames() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const frame = entry.target;
          if (entry.isIntersecting) {
            this.visibleFrames.set(frame, entry.intersectionRatio);
            frame.dataset.mediaVisible = "true";
          } else {
            this.visibleFrames.delete(frame);
            frame.dataset.mediaVisible = "false";
            this.pauseFrame(frame);
            if (frame === this.activeFrame) this.activeFrame = null;
          }
        });

        this.activateBestFrame();
      },
      { rootMargin: "8% 0px", threshold: [0.2, 0.45, 0.7] },
    );

    this.frames.forEach((frame) => this.observer.observe(frame));
  }

  activateBestFrame() {
    if (document.hidden || this.suspended || this.saveData) return;

    const viewportCenter = window.innerHeight / 2;
    const candidates = [...this.visibleFrames.entries()]
      .filter(([frame]) => frame.isConnected)
      .map(([frame, ratio]) => {
        const rect = frame.getBoundingClientRect();
        const frameCenter = rect.top + rect.height / 2;
        const distancePenalty = Math.min(Math.abs(frameCenter - viewportCenter) / window.innerHeight, 1) * 0.25;
        return { frame, score: ratio - distancePenalty };
      })
      .sort((a, b) => b.score - a.score);

    this.setActiveFrame(candidates[0]?.frame || null);
  }

  setActiveFrame(frame, { autoplay = true } = {}) {
    if (frame === this.activeFrame) {
      this.setMediaActivity(Boolean(frame?.classList.contains("media-frame")));
      if (frame && autoplay && frame.dataset.userPaused !== "true") this.playFrame(frame);
      return;
    }

    this.frames.forEach((otherFrame) => {
      if (otherFrame === frame) return;
      this.pauseFrame(otherFrame);
      otherFrame.dataset.mediaActive = "false";
    });

    this.activeFrame = frame;
    this.setMediaActivity(Boolean(frame?.classList.contains("media-frame")));
    if (!frame) return;

    frame.dataset.mediaActive = "true";
    if (autoplay && frame.dataset.userPaused !== "true") this.playFrame(frame);
  }

  playFrame(frame) {
    frame.classList.remove("is-paused");
    frame.querySelectorAll("[data-project-video]").forEach((video) => this.play(video));
  }

  pauseFrame(frame) {
    frame.querySelectorAll("[data-project-video]").forEach((video) => {
      video.pause();
      this.mute(video);
    });
    const soundButton = frame.querySelector("[data-sound-toggle]");
    if (soundButton) this.setSoundButton(soundButton, false);
    frame.classList.add("is-paused");
  }

  pauseAll() {
    this.frames.forEach((frame) => this.pauseFrame(frame));
  }

  setMediaActivity(active) {
    if (active === this.mediaActivity) return;
    this.mediaActivity = active;
    document.documentElement.dataset.mediaActive = String(active);
    window.dispatchEvent(new CustomEvent("framezero:mediaactivity", { detail: { active } }));
  }

  play(video) {
    this.hydrate(video);
    const promise = video.play();
    promise?.catch(() => {
      const frame = video.closest(".media-frame, .author__signature");
      if (frame === this.activeFrame) frame?.classList.add("is-paused");
    });
    return promise;
  }

  hydrate(video) {
    if (video.dataset.hydrated === "true") return;
    video.dataset.hydrated = "true";

    const directSource = video.dataset.src;
    if (directSource) video.src = directSource;
    video.querySelectorAll("source[data-src]").forEach((source) => {
      source.src = source.dataset.src;
    });

    const frame = video.closest(".media-frame, .author__signature");
    video.addEventListener("loadeddata", () => frame?.classList.add("is-media-ready"), { once: true });
    video.addEventListener("error", () => frame?.classList.add("has-media-error"), { once: true });
    video.load();
  }

  mute(video) {
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("muted", "");
  }

  setSoundButton(button, enabled) {
    button.setAttribute("aria-pressed", String(enabled));
    button.querySelector("[data-sound-label]").textContent = enabled ? "Звук включён" : "Звук";
    const title = button.dataset.soundTitle || "ролике";
    button.setAttribute("aria-label", `Звук — ${enabled ? "выключить" : "включить"} в работе «${title}»`);
  }

  dispose() {
    this.observer?.disconnect();
    document.removeEventListener("visibilitychange", this.onVisibility);
    document.removeEventListener("framezero:formatopen", this.onFormatOpen);
    document.removeEventListener("framezero:formatclose", this.onFormatClose);
    this.setMediaActivity(false);
    this.videos.forEach((video) => video.pause());
  }
}
