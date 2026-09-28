/**
 * AP Tech Portfolio — framework.js
 * Theme toggle, carousels (slide/scale/blur), nav, filters, form
 */

(function () {
  "use strict";

  const certificates = [
    {
      id: 1,
      title: "Mapua Codex Workshop",
      type: "workshop",
      description: "Java programming fundamentals workshop hosted by Mapua University for Senior High School.",
    },
    {
      id: 2,
      title: "Using AI with integrity",
      type: "seminar",
      description: "Seminar related to the ethical use of AI in everyday life.",
    },
    {
      id: 3,
      title: "Mapua Codex Tournament",
      type: "tournament",
      description: "Participated in a highschool coding competition focused on problem-solving and algorithms using Java.",
    },
  ];

  const scrollProgress = document.getElementById("scroll-progress");
  const siteNav = document.getElementById("siteNav");
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  const filterRow = document.getElementById("filterRow");
  const workGrid = document.getElementById("workGrid");
  const contactForm = document.getElementById("contactForm");
  const yearEl = document.getElementById("year");
  const themeToggle = document.getElementById("themeToggle");
  const html = document.documentElement;

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  /* ---------- Theme (light / dark) ---------- */
  function getStoredTheme() {
    try {
      return localStorage.getItem("ap-theme");
    } catch (e) {
      return null;
    }
  }

  function setTheme(theme) {
    html.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("ap-theme", theme);
    } catch (e) {}
  }

  function initTheme() {
    const stored = getStoredTheme();
    // Dark mode is the default; only switch if user previously chose light
    if (stored === "light") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  }

  initTheme();

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      const next = html.getAttribute("data-theme") === "light" ? "dark" : "light";
      setTheme(next);
    });
  }

  /* ---------- Scroll progress + nav ---------- */
  function updateScroll() {
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;
    const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    if (scrollProgress) scrollProgress.style.width = pct + "%";
    if (siteNav) siteNav.classList.toggle("scrolled", scrollTop > 20);
  }

  window.addEventListener("scroll", updateScroll, { passive: true });
  updateScroll();

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      const open = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    navLinks.querySelectorAll(".nav-link").forEach(function (link) {
      link.addEventListener("click", function () {
        navLinks.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const sections = document.querySelectorAll("section[id]");
  const navLinkEls = document.querySelectorAll(".nav-link");

  function setActiveNav() {
    const offset = 100;
    let current = "";
    sections.forEach(function (section) {
      const top = section.offsetTop - offset;
      if (window.scrollY >= top) {
        current = section.getAttribute("id") || "";
      }
    });
    navLinkEls.forEach(function (link) {
      const href = link.getAttribute("href") || "";
      link.classList.toggle("active", href === "#" + current);
    });
  }

  window.addEventListener("scroll", setActiveNav, { passive: true });
  setActiveNav();

  /* ---------- Carousel helper (slide / scale / blur) ---------- */
  function initCarousel(root) {
    if (!root) return null;

    const track = root.querySelector(".carousel-track");
    const prevBtn = root.querySelector(".carousel-prev");
    const nextBtn = root.querySelector(".carousel-next");
    const dotsWrap = root.querySelector(".carousel-dots");
    if (!track) return null;

    let index = 0;
    let slides = [];

    function refreshSlides() {
      slides = Array.prototype.slice.call(track.querySelectorAll(".carousel-slide"));
      if (index >= slides.length) index = Math.max(0, slides.length - 1);
      update();
    }

    function update() {
      const n = slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.remove("is-active", "is-prev", "is-next");
        if (i === index) {
          slide.classList.add("is-active");
        } else if (i === (index - 1 + n) % n && n > 1) {
          slide.classList.add("is-prev");
        } else if (i === (index + 1) % n && n > 1) {
          slide.classList.add("is-next");
        }
      });

      if (dotsWrap) {
        dotsWrap.innerHTML = "";
        slides.forEach(function (_, i) {
          const dot = document.createElement("button");
          dot.type = "button";
          dot.className = "carousel-dot" + (i === index ? " active" : "");
          dot.setAttribute("aria-label", "Go to slide " + (i + 1));
          dot.addEventListener("click", function () {
            index = i;
            update();
          });
          dotsWrap.appendChild(dot);
        });
      }

      // Height is fixed in CSS — avoids page jump when switching slides
    }

    function go(delta) {
      if (!slides.length) return;
      index = (index + delta + slides.length) % slides.length;
      update();
    }

    if (prevBtn) prevBtn.addEventListener("click", function () { go(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { go(1); });

    // Touch swipe
    let touchX = null;
    track.addEventListener(
      "touchstart",
      function (e) {
        touchX = e.changedTouches[0].screenX;
      },
      { passive: true }
    );
    track.addEventListener(
      "touchend",
      function (e) {
        if (touchX == null) return;
        const dx = e.changedTouches[0].screenX - touchX;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touchX = null;
      },
      { passive: true }
    );

    refreshSlides();
    window.addEventListener("resize", function () {
      update();
    });

    return {
      refresh: refreshSlides,
      goTo: function (i) {
        index = i;
        update();
      },
    };
  }

  const projectsCarousel = initCarousel(document.getElementById("projectsCarousel"));
  let certsCarouselApi = null;

  /* ---------- Certificates (filter + carousel) ---------- */
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function renderCertificates(filter) {
    if (!workGrid) return;
    const list =
      filter === "all"
        ? certificates
        : certificates.filter(function (c) {
            return c.type === filter;
          });

    workGrid.innerHTML = list
      .map(function (c) {
        const typeLabel = c.type.charAt(0).toUpperCase() + c.type.slice(1);
        return (
          '<article class="cert-card carousel-slide" data-type="' +
          c.type +
          '">' +
          '<span class="cert-type">' +
          typeLabel +
          "</span>" +
          "<h3>" +
          escapeHtml(c.title) +
          "</h3>" +
          "<p>" +
          escapeHtml(c.description) +
          "</p>" +
          "</article>"
        );
      })
      .join("");

    if (!certsCarouselApi) {
      certsCarouselApi = initCarousel(document.getElementById("certsCarousel"));
    } else {
      certsCarouselApi.refresh();
    }
  }

  if (filterRow && workGrid) {
    renderCertificates("all");

    filterRow.addEventListener("click", function (e) {
      const btn = e.target.closest(".filter-btn");
      if (!btn) return;
      const filter = btn.getAttribute("data-filter") || "all";
      filterRow.querySelectorAll(".filter-btn").forEach(function (b) {
        b.classList.toggle("active", b === btn);
      });
      renderCertificates(filter);
    });
  }

  /* ---------- Contact form ---------- */
  function showError(fieldId, errId, message) {
    const field = document.getElementById(fieldId);
    const err = document.getElementById(errId);
    if (field) field.classList.add("error");
    if (err) err.textContent = message || "";
  }

  function clearError(fieldId, errId) {
    const field = document.getElementById(fieldId);
    const err = document.getElementById(errId);
    if (field) field.classList.remove("error");
    if (err) err.textContent = "";
  }

  function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  if (contactForm) {
    const nameInput = document.getElementById("nameInput");
    const emailInput = document.getElementById("emailInput");
    const messageInput = document.getElementById("messageInput");
    const formStatus = document.getElementById("formStatus");

    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      let valid = true;

      clearError("nameInput", "nameErr");
      clearError("emailInput", "emailErr");
      clearError("messageInput", "messageErr");
      if (formStatus) {
        formStatus.textContent = "";
        formStatus.className = "form-status";
      }

      const name = (nameInput && nameInput.value.trim()) || "";
      const email = (emailInput && emailInput.value.trim()) || "";
      const message = (messageInput && messageInput.value.trim()) || "";

      if (!name) {
        showError("nameInput", "nameErr", "Please enter your name.");
        valid = false;
      } else if (name.length < 2) {
        showError("nameInput", "nameErr", "Name must be at least 2 characters.");
        valid = false;
      }

      if (!email) {
        showError("emailInput", "emailErr", "Please enter your email.");
        valid = false;
      } else if (!validateEmail(email)) {
        showError("emailInput", "emailErr", "Please enter a valid email address.");
        valid = false;
      }

      if (!message) {
        showError("messageInput", "messageErr", "Please enter a message.");
        valid = false;
      } else if (message.length < 10) {
        showError("messageInput", "messageErr", "Message should be at least 10 characters.");
        valid = false;
      }

      if (!valid) {
        if (formStatus) {
          formStatus.textContent = "Please fix the errors above.";
          formStatus.className = "form-status error";
        }
        return;
      }

      if (formStatus) {
        formStatus.textContent = "Thanks! Your message has been noted.";
        formStatus.className = "form-status success";
      }
      contactForm.reset();
    });

    [nameInput, emailInput, messageInput].forEach(function (input) {
      if (!input) return;
      input.addEventListener("input", function () {
        const id = input.id;
        const errId = id.replace("Input", "Err");
        clearError(id, errId);
      });
    });
  }
})();
