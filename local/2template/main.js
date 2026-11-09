/* ==========================================================================
   Esraa Ahmed — main.js
   Project & brand data mirrors the folders found under assets/projects
   and assets/logos. One card per folder, nothing invented.
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------
     Assets — detected from the projects folder (one entry per folder)
     ------------------------------------------------------------------ */

  var PROJECTS = [
    {
      id: "english-course",
      title: "English Instructor Brand",
      industry: "Education",
      tag: "Content Strategy & Plan",
      desc: "A complete content strategy deck and an eighteen-slide content plan for an English-learning brand, covering audience insight, positioning and a scheduled plan.",
      badges: ["Strategy", "Content Plan"],
      cover: "assets/projects/4-Content%20strategy%20and%20plan%20for%20English%20instructor%20/Content%20plan/1.png",
      ratio: "landscape",
      page: "projects/project-english-course.html"
    },
    {
      id: "cafe",
      title: "Niha Yum Restaurant",
      industry: "Food & Beverage",
      tag: "Content Plan",
      desc: "A forty-two-page content plan presentation for a restaurant brand — the full social content system, prepared as a single presentation.",
      badges: ["Content Plan", "PDF"],
      cover: "assets/images/previews/cafe-presentation.jpg",
      ratio: "landscape",
      page: "projects/project-cafe.html"
    },
    {
      id: "dental-clinic",
      title: "Dar Al-Asnan Dental Clinic",
      industry: "Healthcare",
      tag: "Social Media Content",
      desc: "Three social post designs and an insight capture for a dental clinic, built around clear, trustworthy health communication.",
      badges: ["Posts", "Insights"],
      cover: "assets/projects/%D9%85%D8%B1%D9%83%D8%B2%20%D8%AF%D8%A7%D8%B1%20%D8%A7%D9%84%D8%A7%D8%B3%D9%86%D8%A7%D9%86%20/Insight%20%D8%AF%D8%A7%D8%B1%20%D8%A7%D9%84%D8%A7%D8%B3%D9%86%D8%A7%D9%86%20/Insight%20%D8%AF%D8%A7%D8%B1%20%D8%A7%D9%84%D8%A7%D8%B3%D9%86%D8%A7%D9%86%D9%8B.jpg",
      ratio: "portrait",
      page: "projects/project-dental-clinic.html"
    },
    {
      id: "physiotherapy",
      title: "Refit Physiotherapy & Nutrition",
      industry: "Health & Wellness",
      tag: "Content Plan & Design",
      desc: "A ten-page content plan, four social post designs and an insight capture for a physiotherapy and nutrition center.",
      badges: ["Content Plan", "Posts", "Insights"],
      cover: "assets/projects/3-Refit%20%D9%85%D8%B1%D9%83%D8%B2%20%D8%B9%D9%84%D8%A7%D8%AC%20%D8%B7%D8%A8%D9%8A%D8%B9%D9%8A%20%D9%88%D8%AA%D8%BA%D8%B0%D9%8A%D8%A9%20/Insight%20Refit_.jpg",
      ratio: "portrait",
      page: "projects/project-physiotherapy.html"
    },
    {
      id: "air-conditioning",
      title: "Al-Fath Air Conditioning",
      industry: "Home Services",
      tag: "Content Plan & Design",
      desc: "An eleven-page monthly content plan, three social post designs and an insight capture for an air-conditioning brand.",
      badges: ["Content Plan", "Posts", "Insights"],
      cover: "assets/projects/1-%D8%A7%D9%84%D9%81%D8%AA%D8%AD%20%D9%84%D9%84%D8%AA%D9%83%D9%8A%D9%81%D8%A7%D8%AA/Insight%20.%D8%A7%D9%84%D9%81%D8%AA%D8%AD",
      ratio: "portrait",
      page: "projects/project-air-conditioning.html"
    },
    {
      id: "furniture",
      title: "Al-Emperator Home Textiles",
      industry: "Home & Living",
      tag: "Social Media Content",
      desc: "Three social post designs and an insight capture for a home-textiles brand, with a refined visual language for product storytelling.",
      badges: ["Posts", "Insights"],
      cover: "assets/projects/%D8%A7%D9%84%D8%A7%D9%85%D8%A8%D8%B1%D8%A7%D8%B7%D9%88%D8%B1%20%D9%84%D9%84%D9%85%D9%81%D8%B1%D9%88%D8%B4%D8%A7%D8%AA%20/Insight/db324ba8-c4a2-4d34-9d6c-e962906fa393.jpg",
      ratio: "portrait",
      page: "projects/project-furniture.html"
    }
  ];

  /* ------------------------------------------------------------------
     Brand logos — every file inside assets/logos
     ------------------------------------------------------------------ */

  var LOGOS = [
    "assets/logos/WhatsApp%20Image%202026-08-03%20at%208.17.49%20PM.jpeg",
    "assets/logos/WhatsApp%20Image%202026-08-03%20at%208.17.49%20PM%20%281%29.jpeg",
    "assets/logos/WhatsApp%20Image%202026-08-03%20at%208.17.50%20PM.jpeg",
    "assets/logos/WhatsApp%20Image%202026-08-03%20at%208.17.50%20PM%20%281%29.jpeg",
    "assets/logos/WhatsApp%20Image%202026-08-03%20at%208.17.50%20PM%20%282%29.jpeg",
    "assets/logos/WhatsApp%20Image%202026-08-03%20at%208.17.50%20PM%20%283%29.jpeg",
    "assets/logos/WhatsApp%20Image%202026-08-03%20at%208.17.51%20PM.jpeg",
    "assets/logos/WhatsApp%20Image%202026-08-03%20at%208.17.51%20PM%20%281%29.jpeg",
    "assets/logos/WhatsApp%20Image%202026-08-03%20at%208.17.51%20PM%20%282%29.jpeg"
  ];

  /* ------------------------------------------------------------------
     Build the brand grid
     ------------------------------------------------------------------ */

  function buildBrands(container) {
    if (!container) return;
    container.innerHTML = LOGOS.map(function (src, i) {
      return (
        '<div class="logo-card">' +
        '<img src="' + src + '" alt="Client logo ' + (i + 1) + '" loading="lazy" decoding="async">' +
        "</div>"
      );
    }).join("");
  }

  /* ------------------------------------------------------------------
     Build the projects grid — one card per folder
     ------------------------------------------------------------------ */

  var arrowRight = '<i data-lucide="arrow-right"></i>';

  function buildProjects(container) {
    if (!container) return;
    container.innerHTML = PROJECTS.map(function (p) {
      var badges = p.badges.map(function (b) {
        return '<li class="project-card__badge">' + b + "</li>";
      }).join("");
      return (
        '<article class="project-card reveal">' +
        '<a class="project-card__media" href="' + p.page + '" aria-label="' + p.title + '">' +
        '<img src="' + p.cover + '" alt="' + p.title + '" loading="lazy" decoding="async">' +
        "</a>" +
        '<div class="project-card__body">' +
        '<p class="project-card__meta"><span class="project-card__industry">' + p.industry + '</span><span class="project-card__dot" aria-hidden="true"></span>' + p.tag + "</p>" +
        '<h3 class="project-card__title">' + p.title + "</h3>" +
        '<p class="project-card__desc">' + p.desc + "</p>" +
        '<ul class="project-card__badges">' + badges + "</ul>" +
        '<a class="project-card__btn" href="' + p.page + '">' +
        '<span>View Case Study</span>' +
        '<span class="project-card__btn-arrow">' + arrowRight + "</span>" +
        "</a>" +
        "</div>" +
        "</article>"
      );
    }).join("");
    observeReveals(container);
  }

  /* ------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------ */

  function setupNav() {
    var toggle = document.querySelector(".nav__toggle");
    var nav = document.querySelector(".nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ------------------------------------------------------------------
     Scroll state for header + active section links
     ------------------------------------------------------------------ */

  function setupScrollState() {
    var header = document.querySelector(".header");
    if (!header) return;

    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    var sections = document.querySelectorAll("section[id]");
    var links = Array.prototype.slice.call(
      document.querySelectorAll(".nav__link[href^='#']")
    );
    if (!sections.length || !links.length) return;

    var spy = function () {
      var pos = window.scrollY + 120;
      var current = null;
      sections.forEach(function (s) {
        if (s.offsetTop <= pos) current = s.id;
      });
      links.forEach(function (l) {
        l.classList.toggle("is-active", l.getAttribute("href") === "#" + current);
      });
    };
    window.addEventListener("scroll", spy, { passive: true });
    spy();
  }

  /* ------------------------------------------------------------------
     Reveal on scroll
     ------------------------------------------------------------------ */

  var revealObserver = null;

  function observeReveals(scope) {
    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(
        scope ? scope.querySelectorAll(".reveal") : document.querySelectorAll(".reveal"),
        function (el) { el.classList.add("is-visible"); }
      );
      return;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    }

    Array.prototype.forEach.call(
      scope ? scope.querySelectorAll(".reveal:not(.is-visible)") : document.querySelectorAll(".reveal:not(.is-visible)"),
      function (el) { revealObserver.observe(el); }
    );
  }

  /* ------------------------------------------------------------------
     Back to top
     ------------------------------------------------------------------ */

  function setupBackToTop() {
    var topBtn = document.querySelector(".footer__top-btn");
    if (!topBtn) return;
    topBtn.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ------------------------------------------------------------------
     Lucide icons — initialize after dynamic markup is built
     ------------------------------------------------------------------ */

  function initLucide() {
    if (window.lucide && typeof lucide.createIcons === "function") {
      lucide.createIcons();
    }
  }

  /* ------------------------------------------------------------------
     Footer year
     ------------------------------------------------------------------ */

  function setupYear() {
    var el = document.querySelector("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ------------------------------------------------------------------
     Init
     ------------------------------------------------------------------ */

  document.addEventListener("DOMContentLoaded", function () {
    buildBrands(document.querySelector("[data-brands]"));
    buildProjects(document.querySelector("[data-projects]"));
    setupNav();
    setupScrollState();
    setupBackToTop();
    setupYear();
    observeReveals();
    initLucide();
  });
})();
