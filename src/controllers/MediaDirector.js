export class MediaDirector {
  constructor() {
    this.frames = [...document.querySelectorAll(".media-frame, .author__signature")];
    this.videos = [...document.querySelectorAll("[data-project-video]")];
    this.soundButtons = [...document.querySelectorAll("[data-sound-toggle]")];
    this.saveData = navigator.connection?.saveData === true;
    this.bindEvents();
    this.observeFrames();
  }

  bindEvents() {
    this.onVisibility = () => {
      if (document.hidden) {
        this.videos.forEach((video) => video.pause());
        return;
      }

      this.frames
        .filter((frame) => frame.dataset.mediaVisible === "true" && !frame.classList.contains("is-paused"))
        .forEach((frame) => frame.querySelectorAll("[data-project-video]").forEach((video) => this.play(video)));
    };

    document.addEventListener("visibilitychange", this.onVisibility);

    this.frames.forEach((frame) => {
      const stage = frame.querySelector("[data-media-stage]");
      const videos = [...frame.querySelectorAll("[data-project-video]")];
      const button = frame.querySelector("[data-sound-toggle]");

      stage?.addEventListener("click", () => {
        const shouldPlay = videos.some((video) => video.paused);
        if (shouldPlay) videos.forEach((video) => this.play(video));
        else videos.forEach((video) => video.pause());
        frame.classList.toggle("is-paused", !shouldPlay);
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

        this.videos.forEach((video) => {
          video.muted = true;
        });
        this.soundButtons.forEach((otherButton) => this.setSoundButton(otherButton, false));

        primary.muted = !shouldEnable;
        this.setSoundButton(button, shouldEnable);
        if (shouldEnable) this.play(primary);
      });
    });
  }

  observeFrames() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const frame = entry.target;
          const videos = [...frame.querySelectorAll("[data-project-video]")];
          if (entry.isIntersecting && !this.saveData) {
            frame.dataset.mediaVisible = "true";
            videos.forEach((video) => this.play(video));
            frame.classList.remove("is-paused");
          } else {
            frame.dataset.mediaVisible = "false";
            videos.forEach((video) => video.pause());
            videos.forEach((video) => {
              video.muted = true;
            });
            const soundButton = frame.querySelector("[data-sound-toggle]");
            if (soundButton) this.setSoundButton(soundButton, false);
            frame.classList.add("is-paused");
          }
        });
      },
      { rootMargin: "12% 0px", threshold: 0.24 },
    );

    this.frames.forEach((frame) => this.observer.observe(frame));
  }

  play(video) {
    const promise = video.play();
    promise?.catch(() => {
      video.closest(".media-frame")?.classList.add("is-paused");
    });
  }

  setSoundButton(button, enabled) {
    button.setAttribute("aria-pressed", String(enabled));
    button.querySelector("[data-sound-label]").textContent = enabled ? "Звук включён" : "Звук";
  }

  dispose() {
    this.observer?.disconnect();
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.videos.forEach((video) => video.pause());
  }
}
