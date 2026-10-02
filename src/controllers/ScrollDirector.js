import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export class ScrollDirector {
  constructor() {
    this.motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!this.motionQuery.matches) this.init();
  }

  init() {
    this.setupDepthTransition();
    gsap.fromTo(
      ".hero h1 > span",
      { yPercent: 22, opacity: 0.72 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 1.35,
        stagger: 0.13,
        ease: "power4.out",
      },
    );

    gsap.fromTo(
      ".hero__statement, .hero__intro, .hero__actions",
      { y: 18, opacity: 0.7 },
      { y: 0, opacity: 1, duration: 0.9, stagger: 0.1, delay: 0.45, ease: "power3.out" },
    );

    gsap.to(".hero__zero", {
      y: -9,
      x: 5,
      rotateZ: -1.2,
      duration: 3.2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    gsap.fromTo(
      ".hero__zero-ring",
      { rotateY: -18, rotateX: 8 },
      {
        rotateY: 18,
        rotateX: -8,
        duration: 4.6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      },
    );

    document.querySelectorAll(".case-section").forEach((section, index) => {
      const content = section.querySelector(".case-section__content");
      const media = section.querySelector(".media-frame");
      const title = section.querySelector("h2");
      const reverse = section.classList.contains("case-section--reverse");

      gsap.fromTo(
        content,
        { y: 34, opacity: 0.64 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: section, start: "top 82%", once: true },
        },
      );

      gsap.fromTo(
        media,
        {
          y: 80,
          z: -220,
          rotateX: 8,
          rotateY: reverse ? -10 : 10,
          scale: 0.86,
          opacity: 0.38,
          filter: "blur(3px)",
        },
        {
          y: -24,
          z: 0,
          rotateX: 0,
          rotateY: 0,
          scale: 1,
          opacity: 1,
          filter: "blur(0px)",
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 94%",
            end: "center 48%",
            scrub: 0.85,
          },
        },
      );

      gsap.fromTo(
        title,
        { yPercent: 18, clipPath: "inset(0 0 28% 0)" },
        {
          yPercent: 0,
          clipPath: "inset(0 0 0% 0)",
          duration: 0.9,
          ease: "power4.out",
          scrollTrigger: { trigger: section, start: "top 68%", once: true },
        },
      );

      ScrollTrigger.create({
        trigger: section,
        start: "top 86%",
        onEnter: () => this.playCut(index + 1),
        onEnterBack: () => this.playCut(index + 1),
      });
    });

    gsap.fromTo(
      ".manifesto__line--offset",
      {
        xPercent: -3,
        z: -220,
        rotateX: 42,
        rotateY: -8,
        scale: 0.84,
        opacity: 0.44,
        filter: "blur(2px)",
        color: "rgba(243, 245, 251, 0.02)",
        textShadow: "0 0 0 rgba(111, 228, 255, 0)",
      },
      {
        xPercent: 2,
        z: 54,
        rotateX: 0,
        rotateY: 0,
        scale: 1.015,
        opacity: 1,
        filter: "blur(0px)",
        color: "rgba(243, 245, 251, 0.92)",
        textShadow: "0 0 0.7rem rgba(111, 228, 255, 0.34), 0 0 2.4rem rgba(120, 104, 255, 0.22)",
        ease: "none",
        scrollTrigger: {
          trigger: ".manifesto",
          start: "top 86%",
          end: "center 42%",
          scrub: 0.8,
        },
      },
    );

    ScrollTrigger.refresh();
  }

  setupDepthTransition() {
    const panels = gsap.utils.toArray(".depth-panel");
    if (!panels.length) return;

    const starts = [
      { xPercent: 110, yPercent: -82, z: -900, rotateY: -48, rotateZ: 10 },
      { xPercent: -125, yPercent: -18, z: -1150, rotateY: 52, rotateZ: -9 },
      { xPercent: 72, yPercent: 68, z: -1350, rotateY: -34, rotateZ: 14 },
      { xPercent: -78, yPercent: 92, z: -1550, rotateY: 39, rotateZ: -13 },
    ];

    panels.forEach((panel, index) => gsap.set(panel, starts[index]));

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: ".manifesto",
        start: "top 96%",
        endTrigger: "#portal",
        end: "top 62%",
        scrub: 0.75,
      },
    });

    panels.forEach((panel, index) => {
      timeline.to(
        panel,
        {
          xPercent: index % 2 === 0 ? -38 : 30,
          yPercent: index < 2 ? -30 + index * 38 : 8 + index * 12,
          z: 54 + index * 28,
          rotateY: index % 2 === 0 ? 16 : -14,
          rotateZ: index % 2 === 0 ? -4 : 5,
          opacity: 0.29 - index * 0.025,
          ease: "none",
          duration: 0.72,
        },
        index * 0.055,
      );
      timeline.to(panel, { z: 620, opacity: 0, ease: "power2.in", duration: 0.28 }, 0.72 + index * 0.035);
    });
  }

  playCut(sceneNumber) {
    const sweep = document.querySelector(".cut-sweep");
    const pulse = document.querySelector(".scene-pulse");
    const number = pulse?.querySelector("strong");
    if (!sweep || !pulse || !number) return;

    number.textContent = String(sceneNumber).padStart(2, "0");
    this.cutTimeline?.kill();
    this.cutTimeline = gsap.timeline();
    this.cutTimeline
      .fromTo(sweep, { xPercent: -720, opacity: 0 }, { xPercent: -60, opacity: 0.9, duration: 0.28, ease: "power3.in" })
      .to(sweep, { xPercent: 620, opacity: 0, duration: 0.58, ease: "power3.out" })
      .fromTo(pulse, { opacity: 0, scale: 1.38 }, { opacity: 0.92, scale: 1, duration: 0.28, ease: "power3.out" }, 0.04)
      .to(pulse, { opacity: 0, scale: 0.88, duration: 0.62, ease: "power2.in" }, 0.4);
  }

  dispose() {
    this.cutTimeline?.kill();
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }
}
