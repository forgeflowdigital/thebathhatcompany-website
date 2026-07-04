/* The Bath Hat Company — interactions
   Scroll reveal fires both entering AND leaving the viewport (no `once`). */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Force autoplay on mobile (no play-button fallback) ----------------
     Some mobile browsers silently fail the declarative autoplay attribute and
     show a native play button instead. Explicitly muting + calling .play() and
     retrying on the first touch/scroll removes that fallback UI entirely. */
  var bgVideos = Array.prototype.slice.call(document.querySelectorAll("video[autoplay]"));
  if (bgVideos.length) {
    var tryPlay = function () {
      bgVideos.forEach(function (v) {
        v.muted = true;
        v.defaultMuted = true;
        v.setAttribute("muted", "");
        var p = v.play();
        if (p && typeof p.catch === "function") p.catch(function () { /* retried on interaction below */ });
      });
    };
    tryPlay();
    document.addEventListener("DOMContentLoaded", tryPlay);
    window.addEventListener("pageshow", tryPlay);
    ["touchstart", "pointerdown", "click", "scroll", "keydown"].forEach(function (evt) {
      document.addEventListener(evt, tryPlay, { once: true, passive: true });
    });
    bgVideos.forEach(function (v) {
      v.addEventListener("loadedmetadata", tryPlay);
      v.addEventListener("canplay", tryPlay);
      v.addEventListener("pause", function () {
        if (!document.hidden) v.play().catch(function () {});
      });
    });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) tryPlay();
    });
  }

  /* ---------------- Header ---------------- */
  var header = document.querySelector(".site-header");
  var lastY = window.scrollY, ticking = false;
  function onScroll() {
    var y = window.scrollY;
    if (header) {
      header.classList.toggle("is-scrolled", y > 40);
      if (y > lastY && y > 240) header.classList.add("nav-hidden");
      else header.classList.remove("nav-hidden");
    }
    var pb = document.getElementById("scroll-progress");
    if (pb) {
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      pb.style.width = (docH > 0 ? (y / docH) * 100 : 0) + "%";
    }
    lastY = y; ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------------- Mobile nav ---------------- */
  var navToggle = document.querySelector(".nav-toggle");
  if (navToggle) {
    navToggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("menu-open");
      navToggle.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.querySelectorAll(".nav-links a").forEach(function (a) {
      a.addEventListener("click", function () {
        document.body.classList.remove("menu-open");
        navToggle.classList.remove("is-open");
      });
    });
  }

  /* ---------------- Scroll reveal (both directions) ---------------- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  revealEls.forEach(function (el, i) {
    if (!el.style.getPropertyValue("--stagger")) el.style.setProperty("--stagger", el.dataset.staggerIndex || (i % 6));
  });
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle("is-visible", e.isIntersecting); });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------------- Parallax ---------------- */
  var parallaxEls = document.querySelectorAll("[data-parallax]");
  if (parallaxEls.length && !reduceMotion) {
    var rafId = null;
    function up() {
      var vh = window.innerHeight;
      parallaxEls.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        var speed = parseFloat(el.dataset.parallax) || 0.15;
        var center = rect.top + rect.height / 2 - vh / 2;
        var offset = Math.max(-30, Math.min(30, -center * speed * 0.08));
        el.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0)";
      });
      rafId = null;
    }
    window.addEventListener("scroll", function () { if (!rafId) rafId = window.requestAnimationFrame(up); }, { passive: true });
    up();
  }

  /* ---------------- Cursor glow ---------------- */
  document.querySelectorAll(".glow-surface").forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      var rect = el.getBoundingClientRect();
      el.style.setProperty("--mx", (e.clientX - rect.left) + "px");
      el.style.setProperty("--my", (e.clientY - rect.top) + "px");
    });
  });

  /* ---------------- Counters ---------------- */
  var counters = document.querySelectorAll("[data-counter]");
  if (counters.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || entry.target.dataset.counted) return;
        entry.target.dataset.counted = "true";
        var target = parseFloat(entry.target.dataset.counter);
        var suffix = entry.target.dataset.suffix || "";
        if (reduceMotion) { entry.target.textContent = target + suffix; return; }
        var dur = 1400, start = null;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min(1, (ts - start) / dur);
          entry.target.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
          if (p < 1) window.requestAnimationFrame(step);
        }
        window.requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---------------- Auto crossfade slideshows ---------------- */
  document.querySelectorAll(".slideshow").forEach(function (ss) {
    var imgs = ss.querySelectorAll("img");
    if (imgs.length < 2) { if (imgs[0]) imgs[0].classList.add("is-active"); return; }
    var dotsWrap = ss.querySelector(".dots");
    var dots = dotsWrap ? dotsWrap.querySelectorAll("i") : [];
    var idx = 0;
    imgs[0].classList.add("is-active");
    if (dots[0]) dots[0].classList.add("on");
    var delay = parseInt(ss.dataset.interval, 10) || 3400;
    if (reduceMotion) return;
    setInterval(function () {
      imgs[idx].classList.remove("is-active");
      if (dots[idx]) dots[idx].classList.remove("on");
      idx = (idx + 1) % imgs.length;
      imgs[idx].classList.add("is-active");
      if (dots[idx]) dots[idx].classList.add("on");
    }, delay);
  });

  /* ---------------- Lightbox ---------------- */
  var lightbox = document.getElementById("lightbox");
  if (lightbox) {
    var lbImg = lightbox.querySelector("img");
    var lbCaption = lightbox.querySelector(".lightbox-caption");
    var items = Array.prototype.slice.call(document.querySelectorAll(".masonry-item, .g-tile"));
    var current = 0;
    function open(i) {
      current = i; var el = items[i];
      lbImg.src = el.querySelector("img").src; lbImg.alt = el.querySelector("img").alt;
      if (lbCaption) lbCaption.textContent = el.dataset.caption || el.querySelector("img").alt;
      lightbox.classList.add("is-open"); document.body.style.overflow = "hidden";
    }
    function close() { lightbox.classList.remove("is-open"); document.body.style.overflow = ""; }
    function nav(d) { current = (current + d + items.length) % items.length; open(current); }
    items.forEach(function (el, i) {
      el.addEventListener("click", function () { open(i); });
      el.setAttribute("tabindex", "0"); el.setAttribute("role", "button");
      el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(i); } });
    });
    var cb = lightbox.querySelector(".lightbox-close"), pb2 = lightbox.querySelector(".lightbox-prev"), nb = lightbox.querySelector(".lightbox-next");
    if (cb) cb.addEventListener("click", close);
    if (pb2) pb2.addEventListener("click", function () { nav(-1); });
    if (nb) nb.addEventListener("click", function () { nav(1); });
    lightbox.querySelector(".lightbox-backdrop").addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") nav(1);
      if (e.key === "ArrowLeft") nav(-1);
    });
  }

  /* ---------------- Contact form (demo submit) ---------------- */
  var contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var success = document.querySelector(".form-success");
      contactForm.reset(); contactForm.style.display = "none";
      if (success) success.classList.add("is-visible");
    });
  }

  /* ---------------- Active nav link ---------------- */
  var path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(function (a) {
    var href = (a.getAttribute("href") || "").split("#")[0];
    if (href === path || (path === "" && href === "index.html")) a.classList.add("active");
  });

  /* ---------------- Year ---------------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
