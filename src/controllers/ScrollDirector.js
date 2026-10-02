import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export class ScrollDirector {
  constructor() {
    this.motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!this.motionQuery.matches) this.init();
  }

  init() {
    gsap.fromTo(
      ".hero h1 span",
      { yPercent: 42, opacity: 0 },
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
      { y: 28, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, stagger: 0.1, delay: 0.45, ease: "power3.out" },
    );

    document.querySelectorAll(".case-section").forEach((section) => {
      const content = section.querySelector(".case-section__content");
      const media = section.querySelector(".media-frame");

      gsap.fromTo(
        content,
        { y: 70, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: section, start: "top 72%", once: true },
        },
      );

      gsap.fromTo(
        media,
        { y: 110, rotateX: 8, opacity: 0.18 },
        {
          y: -30,
          rotateX: 0,
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.1,
          },
        },
      );
    });

    gsap.to(".manifesto__line--offset", {
      xPercent: 10,
      ease: "none",
      scrollTrigger: {
        trigger: ".manifesto",
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
      },
    });

    ScrollTrigger.refresh();
  }

  dispose() {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }
}

