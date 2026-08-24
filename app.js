/**
 * INKSPIRE - Application Controller
 */

document.addEventListener("DOMContentLoaded", () => {
  initConfiguration();
  setupUIEventListeners();
  simulateLoadingProgress();
});

/* Bind metadata from config.js */
function initConfiguration() {
  if (typeof MAGAZINE_CONFIG === "undefined") return;

  const cfgMap = {
    "cfg-loader-school": MAGAZINE_CONFIG.schoolName,
    "cfg-loader-title": MAGAZINE_CONFIG.title,
    "cfg-landing-school": MAGAZINE_CONFIG.schoolName,
    "cfg-landing-title": MAGAZINE_CONFIG.title,
    "cfg-landing-subtitle": MAGAZINE_CONFIG.subTitle,
    "cfg-landing-volume": MAGAZINE_CONFIG.volume,
    "cfg-landing-date": MAGAZINE_CONFIG.issueDate,
    "cfg-landing-tagline": MAGAZINE_CONFIG.tagline,
    "cfg-cover-vol": MAGAZINE_CONFIG.volume,
    "cfg-topbar-school": MAGAZINE_CONFIG.schoolName,
    "cfg-topbar-title": MAGAZINE_CONFIG.title,
  };

  Object.entries(cfgMap).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });
}

/* Simulate polished initial loading progress */
function simulateLoadingProgress() {
  const progressBar = document.getElementById("progress-bar");
  const loader = document.getElementById("loader");
  let progress = 0;

  const interval = setInterval(() => {
    progress += Math.random() * 25;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      setTimeout(() => {
        loader.style.opacity = "0";
        setTimeout(() => loader.classList.add("hidden"), 600);
      }, 300);
    }
    if (progressBar) progressBar.style.width = `${progress}%`;
  }, 150);
}

/* UI Action Hooks & Event Binding */
function setupUIEventListeners() {
  const landingPage = document.getElementById("landing-page");
  const readerInterface = document.getElementById("reader-interface");
  const tocModal = document.getElementById("toc-modal");
  const searchModal = document.getElementById("search-modal");

  // Open Magazine Handler
  document.getElementById("btn-open-magazine")?.addEventListener("click", () => {
    landingPage.classList.add("hidden");
    readerInterface.classList.remove("hidden");
    // Trigger window resize so PageFlip recalculates bounds cleanly
    window.dispatchEvent(new Event("resize"));
  });

  // Back to Hero View
  document.getElementById("btn-back-home")?.addEventListener("click", () => {
    readerInterface.classList.add("hidden");
    landingPage.classList.remove("hidden");
  });

  // Modal Toggles
  document.getElementById("btn-browse-contents")?.addEventListener("click", () => {
    landingPage.classList.add("hidden");
    readerInterface.classList.remove("hidden");
    tocModal.classList.remove("hidden");
  });

  document.getElementById("btn-toggle-toc")?.addEventListener("click", () => {
    tocModal.classList.toggle("hidden");
  });

  document.getElementById("btn-close-toc")?.addEventListener("click", () => {
    tocModal.classList.add("hidden");
  });

  document.getElementById("btn-toggle-search")?.addEventListener("click", () => {
    searchModal.classList.toggle("hidden");
  });

  document.getElementById("btn-close-search")?.addEventListener("click", () => {
    searchModal.classList.add("hidden");
  });

  // Native Fullscreen API integration
  document.getElementById("btn-fullscreen")?.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.log(err));
    } else {
      document.exitFullscreen();
    }
  });
}

/**
 * PDF.js & PageFlip.js Integration Helpers
 * Call these functions inside your existing PageFlip page-change callbacks.
 */
function updatePageCounter(currentPage, totalPages) {
  const currentEl = document.getElementById("current-page-num");
  const totalEl = document.getElementById("total-pages-num");
  
  if (currentEl) currentEl.textContent = currentPage;
  if (totalEl) totalEl.textContent = totalPages;
}