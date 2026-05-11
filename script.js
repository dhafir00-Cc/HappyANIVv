const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isSmallScreen = window.matchMedia("(max-width: 560px)").matches;

const elements = {
  body: document.body,
  audio: document.getElementById("anniversaryMusic"),
  startButton: document.getElementById("startButton"),
  audioMessage: document.getElementById("audioMessage"),
  gate: document.getElementById("musicGate"),
  main: document.getElementById("mainContent"),
  musicToggle: document.getElementById("musicToggle"),
  toast: document.getElementById("toast"),
  introParticles: document.getElementById("introParticles"),
  pageParticles: document.getElementById("pageParticles"),
  flightLayer: document.getElementById("flightLayer"),
  timeline: document.getElementById("timeline"),
  timelineProgress: document.getElementById("timelineProgress"),
  secretTrigger: document.getElementById("secretTrigger"),
  secretModal: document.getElementById("secretModal"),
  closeSecret: document.getElementById("closeSecret"),
  photoModal: document.getElementById("photoModal"),
  photoModalImage: document.getElementById("photoModalImage"),
  photoModalCaption: document.getElementById("photoModalCaption"),
  closePhotoModal: document.getElementById("closePhotoModal"),
  finalParticles: document.querySelector(".final-particles")
};

const state = {
  started: false,
  flightTimer: null,
  secretTaps: 0,
  secretTimer: null,
  toastTimer: null,
  celebrationShown: false
};

function createParticle(container, options = {}) {
  if (!container || prefersReducedMotion) return;

  const particle = document.createElement("span");
  const isHeart = Math.random() > (options.sparkRatio ?? 0.72);
  const size = randomNumber(options.minSize ?? 4, options.maxSize ?? 12);
  const duration = randomNumber(options.minDuration ?? 10, options.maxDuration ?? 24);
  const x = randomNumber(0, 100);
  const y = randomNumber(72, 112);
  const drift = randomNumber(-48, 48);

  particle.className = `particle ${isHeart ? "heart" : "spark"}`;
  particle.style.setProperty("--x", `${x}%`);
  particle.style.setProperty("--y", `${y}%`);
  particle.style.setProperty("--size", `${size}px`);
  particle.style.setProperty("--duration", `${duration}s`);
  particle.style.setProperty("--delay", `${randomNumber(-duration, 0)}s`);
  particle.style.setProperty("--drift", `${drift}px`);
  particle.style.setProperty("--opacity", randomNumber(0.22, 0.75).toFixed(2));

  container.appendChild(particle);
}

function seedParticles(container, count, options) {
  const safeCount = prefersReducedMotion ? 0 : count;
  for (let index = 0; index < safeCount; index += 1) {
    createParticle(container, options);
  }
}

function randomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  window.clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 4200);
}

async function startExperience() {
  if (state.started) return;
  state.started = true;
  elements.startButton.disabled = true;

  try {
    await elements.audio.play();
    setMusicState(true);
  } catch (error) {
    elements.audioMessage.textContent = "Lagu belum bisa diputar, tapi kamu tetap bisa lanjut.";
    showToast("Lagu belum bisa diputar, tapi kamu tetap bisa lanjut.");
    setMusicState(false);
  }

  runIntroTransition();
}

function runIntroTransition() {
  elements.gate.classList.add("is-opening");

  window.setTimeout(() => {
    elements.body.classList.remove("is-locked");
    elements.main.removeAttribute("aria-hidden");
    elements.main.classList.add("is-visible");
    elements.musicToggle.hidden = false;
    startLoveFlights();
  }, prefersReducedMotion ? 80 : 1180);

  window.setTimeout(() => {
    elements.gate.classList.add("is-leaving");
  }, prefersReducedMotion ? 120 : 2050);

  window.setTimeout(() => {
    elements.gate.setAttribute("aria-hidden", "true");
  }, prefersReducedMotion ? 180 : 2950);
}

function setMusicState(isPlaying) {
  elements.musicToggle.classList.toggle("is-paused", !isPlaying);
  elements.musicToggle.setAttribute("aria-label", isPlaying ? "Pause musik" : "Putar musik");
}

async function toggleMusic() {
  if (elements.audio.paused) {
    try {
      await elements.audio.play();
      setMusicState(true);
    } catch (error) {
      showToast("Lagu belum bisa diputar, coba cek file music.mp3 di folder yang sama.");
      setMusicState(false);
    }
  } else {
    elements.audio.pause();
    setMusicState(false);
  }
}

function setupScrollReveal() {
  const revealTargets = document.querySelectorAll(".reveal, .timeline, .likes-grid, .gallery-grid, .lyrics-card");

  if (!("IntersectionObserver" in window)) {
    revealTargets.forEach((target) => target.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");

      if (entry.target.classList.contains("final-section")) {
        softCelebrate();
      }

      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.18,
    rootMargin: "0px 0px -8% 0px"
  });

  revealTargets.forEach((target) => observer.observe(target));
}

function setupSmoothScroll() {
  document.querySelectorAll("[data-scroll-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.querySelector(button.dataset.scrollTarget);
      target?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
    });
  });
}

function setupTimeline() {
  const timelineItems = document.querySelectorAll(".timeline-item");

  timelineItems.forEach((item) => {
    const toggle = () => {
      timelineItems.forEach((otherItem) => {
        if (otherItem !== item) otherItem.classList.remove("is-expanded");
      });
      item.classList.toggle("is-expanded");
      item.classList.add("is-tapped");
      window.setTimeout(() => item.classList.remove("is-tapped"), 360);
    };

    item.addEventListener("click", toggle);
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    });
  });

  updateTimelineProgress();
  window.addEventListener("scroll", updateTimelineProgress, { passive: true });
}

function updateTimelineProgress() {
  if (!elements.timeline || !elements.timelineProgress) return;

  const rect = elements.timeline.getBoundingClientRect();
  const viewport = window.innerHeight || document.documentElement.clientHeight;
  const start = viewport * 0.78;
  const end = viewport * 0.22 - rect.height;
  const rawProgress = (start - rect.top) / (start - end);
  const progress = Math.max(0, Math.min(1, rawProgress));

  elements.timeline.style.setProperty("--progress", `${progress * 100}%`);
}

function setupRipple() {
  document.querySelectorAll(".ripple-source, button").forEach((target) => {
    target.addEventListener("pointerdown", (event) => {
      const rect = target.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      target.appendChild(ripple);
      target.classList.add("is-tapped");

      window.setTimeout(() => {
        ripple.remove();
        target.classList.remove("is-tapped");
      }, 720);
    });
  });
}

function setupTiltCards() {
  if (prefersReducedMotion || !window.matchMedia("(hover: hover)").matches) return;

  document.querySelectorAll(".tilt-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${-y * 4}deg) rotateY(${x * 5}deg) translateY(-4px)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}

function setupParallax() {
  if (prefersReducedMotion) return;

  const hero = document.querySelector(".hero");
  const heroContent = document.querySelector(".hero-content");
  const decor = document.querySelector(".hero-decor");

  const update = () => {
    if (!hero || !heroContent || !decor) return;
    const rect = hero.getBoundingClientRect();
    const progress = Math.max(-1, Math.min(1, rect.top / window.innerHeight));
    heroContent.style.transform = `translateY(${progress * -10}px)`;
    decor.style.transform = `translateY(${progress * 18}px)`;
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
}

function startLoveFlights() {
  if (prefersReducedMotion || state.flightTimer) return;

  window.setTimeout(spawnLoveFlight, 5200);
  state.flightTimer = window.setInterval(spawnLoveFlight, 14500);
}

function spawnLoveFlight() {
  if (!elements.flightLayer || document.hidden) return;

  const messages = [
    "untuk Intan",
    "masih pilih kamu",
    "3 tahun 7 bulan",
    "cerita kita",
    "tetap di sini"
  ];

  const flight = document.createElement("span");
  flight.className = "love-flight";
  flight.style.setProperty("--flight-y", `${randomNumber(12, 62)}vh`);
  flight.style.setProperty("--flight-duration", `${randomNumber(10, 15)}s`);
  flight.style.setProperty("--flight-tilt", `${randomNumber(-7, 7)}deg`);
  flight.innerHTML = `
    <span class="love-trail" aria-hidden="true">&#9825;</span>
    <span class="paper-plane" aria-hidden="true"></span>
    <span class="love-note">${messages[Math.floor(Math.random() * messages.length)]}</span>
  `;

  elements.flightLayer.appendChild(flight);
  flight.addEventListener("animationend", () => flight.remove(), { once: true });
}

function setupSecretEgg() {
  elements.secretTrigger.addEventListener("click", () => {
    state.secretTaps += 1;
    window.clearTimeout(state.secretTimer);
    state.secretTimer = window.setTimeout(() => {
      state.secretTaps = 0;
    }, 1100);

    if (state.secretTaps >= 3) {
      state.secretTaps = 0;
      openSecret();
    }
  });

  elements.closeSecret.addEventListener("click", closeSecret);
  elements.secretModal.addEventListener("click", (event) => {
    if (event.target === elements.secretModal) closeSecret();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && elements.secretModal.classList.contains("is-visible")) {
      closeSecret();
    }
  });
}

function openSecret() {
  elements.secretModal.classList.add("is-visible");
  elements.secretModal.removeAttribute("aria-hidden");
  elements.closeSecret.focus({ preventScroll: true });
}

function closeSecret() {
  elements.secretModal.classList.remove("is-visible");
  elements.secretModal.setAttribute("aria-hidden", "true");
  elements.secretTrigger.focus({ preventScroll: true });
}

function setupPhotoModal() {
  const photoButtons = document.querySelectorAll(".photo-frame");

  photoButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const image = button.querySelector("img");
      openPhotoModal(button.dataset.full, button.dataset.caption, image?.alt ?? "Kenangan Dhafir dan Intan");
    });
  });

  elements.closePhotoModal.addEventListener("click", closePhotoModal);
  elements.photoModal.addEventListener("click", (event) => {
    if (event.target === elements.photoModal) closePhotoModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && elements.photoModal.classList.contains("is-visible")) {
      closePhotoModal();
    }
  });
}

function openPhotoModal(src, caption, alt) {
  elements.photoModalImage.src = src;
  elements.photoModalImage.alt = alt;
  elements.photoModalCaption.textContent = caption;
  elements.photoModal.classList.add("is-visible");
  elements.photoModal.removeAttribute("aria-hidden");
  elements.closePhotoModal.focus({ preventScroll: true });
}

function closePhotoModal() {
  elements.photoModal.classList.remove("is-visible");
  elements.photoModal.setAttribute("aria-hidden", "true");

  window.setTimeout(() => {
    if (!elements.photoModal.classList.contains("is-visible")) {
      elements.photoModalImage.removeAttribute("src");
      elements.photoModalCaption.textContent = "";
    }
  }, 280);
}

function softCelebrate() {
  if (state.celebrationShown || prefersReducedMotion || !elements.finalParticles) return;
  state.celebrationShown = true;

  for (let index = 0; index < 22; index += 1) {
    const dot = document.createElement("span");
    dot.className = "celebration-dot";
    dot.style.setProperty("--x", `${randomNumber(10, 90)}%`);
    dot.style.setProperty("--size", `${randomNumber(4, 9)}px`);
    dot.style.setProperty("--duration", `${randomNumber(1.8, 3.4)}s`);
    dot.style.animationDelay = `${randomNumber(0, 1.1)}s`;
    elements.finalParticles.appendChild(dot);
    window.setTimeout(() => dot.remove(), 4300);
  }
}

function syncAudioEvents() {
  elements.audio.addEventListener("play", () => setMusicState(true));
  elements.audio.addEventListener("pause", () => setMusicState(false));
  elements.audio.addEventListener("error", () => {
    if (state.started) {
      showToast("Lagu belum bisa diputar, tapi kamu tetap bisa lanjut.");
    }
    setMusicState(false);
  });
}

function init() {
  seedParticles(elements.introParticles, isSmallScreen ? 24 : 34, {
    minSize: 4,
    maxSize: 14,
    minDuration: 10,
    maxDuration: 20,
    sparkRatio: 0.78
  });

  seedParticles(elements.pageParticles, isSmallScreen ? 16 : 24, {
    minSize: 3,
    maxSize: 10,
    minDuration: 14,
    maxDuration: 30,
    sparkRatio: 0.84
  });

  setupScrollReveal();
  setupSmoothScroll();
  setupTimeline();
  setupRipple();
  setupTiltCards();
  setupParallax();
  setupSecretEgg();
  setupPhotoModal();
  syncAudioEvents();

  elements.startButton.addEventListener("click", startExperience);
  elements.musicToggle.addEventListener("click", toggleMusic);
}

init();
