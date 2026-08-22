/**
 * INKSPIRE - Core Flipbook Engine & PDF Integration
 * Dependencies: PDF.js (v3.11+), PageFlip.js (StPageFlip v2.x), config.js
 */

// Configure PDF.js Worker
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

let pdfDoc = null;
let pageFlip = null;
let currentZoom = 1;
const ZOOM_STEP = 0.2;
const MAX_ZOOM = 2.0;
const MIN_ZOOM = 0.8;

document.addEventListener("DOMContentLoaded", () => {
  initConfiguration();
  setupUIEventListeners();
  loadPublication();
});

/* Bind config metadata to DOM */
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

/* Load PDF & Render Canvas Pages into PageFlip Engine */
async function loadPublication() {
  const progressBar = document.getElementById("progress-bar");
  const loader = document.getElementById("loader");
  const pdfUrl = MAGAZINE_CONFIG?.pdfUrl || "pdf/inkspire.pdf";

  try {
    // 1. Fetch PDF Document
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    loadingTask.onProgress = (progressData) => {
      if (progressData.total > 0) {
        const percent = Math.round((progressData.loaded / progressData.total) * 100);
        if (progressBar) progressBar.style.width = `${percent}%`;
      }
    };

    pdfDoc = await loadingTask.promise;
    const totalPages = pdfDoc.numPages;
    const bookContainer = document.getElementById("book");
    bookContainer.innerHTML = "";

    // 2. Initialize PageFlip Instance
    pageFlip = new St.PageFlip(bookContainer, {
      width: 550,           // Base page width
      height: 733,          // Base page height (4:3 aspect ratio)
      size: "stretch",
      minWidth: 320,
      maxWidth: 900,
      minHeight: 420,
      maxHeight: 1200,
      maxShadowOpacity: 0.4,
      showCover: true,
      mobileScrollSupport: false,
      useMouseEvents: true,
      flippingTime: 900,
    });

    // 3. Render Canvas for Each Page
    const pageElements = [];
    const tocGrid = document.getElementById("toc-grid");
    if (tocGrid) tocGrid.innerHTML = "";

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const pageWrapper = document.createElement("div");
      pageWrapper.className = "page";
      
      const canvas = document.createElement("canvas");
      pageWrapper.appendChild(canvas);
      bookContainer.appendChild(pageWrapper);
      pageElements.push(pageWrapper);

      // Render high-DPI page
      await renderPdfPage(pageNum, canvas);

      // Build Table of Contents Thumbnail Grid
      createTocThumbnail(pageNum, canvas.toDataURL("image/jpeg", 0.7));
    }

    // 4. Mount Rendered HTML Pages into Flipbook Engine
    pageFlip.loadFromHTML(document.querySelectorAll("#book .page"));

    // Sync Page Indicators
    updatePageCounter(1, totalPages);

    // PageFlip Event Hooks
    pageFlip.on("flip", (e) => {
      const currentPage = e.data + 1;
      updatePageCounter(currentPage, totalPages);
    });

    // 5. Dismiss Loading Screen with Fade Effect
    if (progressBar) progressBar.style.width = "100%";
    setTimeout(() => {
      loader.style.opacity = "0";
      setTimeout(() => loader.classList.add("hidden"), 600);
    }, 400);

  } catch (error) {
    console.error("Error initializing magazine reader:", error);
    const loaderText = document.querySelector(".loader-text");
    if (loaderText) loaderText.textContent = "Unable to load magazine PDF.";
  }
}

/* Render PDF Page onto Canvas with DPI Scaling */
async function renderPdfPage(pageNum, canvas) {
  const page = await pdfDoc.getPage(pageNum);
  const pixelRatio = window.devicePixelRatio || 1.5;
  const viewport = page.getViewport({ scale: 1.5 * pixelRatio });

  const context = canvas.getContext("2d");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.width = "100%";
  canvas.style.height = "100%";

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  await page.render(renderContext).promise;
}

/* Build TOC Dynamic Cards */
function createTocThumbnail(pageNum, imageSrc) {
  const tocGrid = document.getElementById("toc-grid");
  if (!tocGrid) return;

  const card = document.createElement("div");
  card.className = "toc-card";
  card.innerHTML = `
    <img class="toc-thumbnail" src="${imageSrc}" alt="Page ${pageNum}" />
    <span class="toc-page-label">Page ${pageNum}</span>
  `;

  card.addEventListener("click", () => {
    pageFlip.flip(pageNum - 1); // PageFlip uses 0-based indexing
    document.getElementById("toc-modal")?.classList.add("hidden");
  });

  tocGrid.appendChild(card);
}

/* Sync Top Bar Counter */
function updatePageCounter(currentPage, totalPages) {
  const currentEl = document.getElementById("current-page-num");
  const totalEl = document.getElementById("total-pages-num");

  if (currentEl) currentEl.textContent = currentPage;
  if (totalEl) totalEl.textContent = totalPages;
}

/* UI Controls & Event Handling */
function setupUIEventListeners() {
  const landingPage = document.getElementById("landing-page");
  const readerInterface = document.getElementById("reader-interface");
  const tocModal = document.getElementById("toc-modal");
  const searchModal = document.getElementById("search-modal");
  const stage = document.getElementById("flipbook-stage");

  // Navigation Arrows
  document.getElementById("btn-prev-page")?.addEventListener("click", () => pageFlip?.flipPrev());
  document.getElementById("btn-next-page")?.addEventListener("click", () => pageFlip?.flipNext());

  // Landing Page Buttons
  document.getElementById("btn-open-magazine")?.addEventListener("click", () => {
    landingPage.classList.add("hidden");
    readerInterface.classList.remove("hidden");
    window.dispatchEvent(new Event("resize"));
  });

  document.getElementById("btn-browse-contents")?.addEventListener("click", () => {
    landingPage.classList.add("hidden");
    readerInterface.classList.remove("hidden");
    tocModal.classList.remove("hidden");
    window.dispatchEvent(new Event("resize"));
  });

  document.getElementById("btn-back-home")?.addEventListener("click", () => {
    readerInterface.classList.add("hidden");
    landingPage.classList.remove("hidden");
  });

  // Modal Controls
  document.getElementById("btn-toggle-toc")?.addEventListener("click", () => tocModal.classList.toggle("hidden"));
  document.getElementById("btn-close-toc")?.addEventListener("click", () => tocModal.classList.add("hidden"));
  document.getElementById("btn-toggle-search")?.addEventListener("click", () => searchModal.classList.toggle("hidden"));
  document.getElementById("btn-close-search")?.addEventListener("click", () => searchModal.classList.add("hidden"));

  // Zoom Controls
  document.getElementById("btn-zoom-in")?.addEventListener("click", () => {
    if (currentZoom < MAX_ZOOM) {
      currentZoom += ZOOM_STEP;
      if (stage) stage.style.transform = `scale(${currentZoom})`;
    }
  });

  document.getElementById("btn-zoom-out")?.addEventListener("click", () => {
    if (currentZoom > MIN_ZOOM) {
      currentZoom -= ZOOM_STEP;
      if (stage) stage.style.transform = `scale(${currentZoom})`;
    }
  });

  // Native Fullscreen Toggle
  document.getElementById("btn-fullscreen")?.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.error(err));
    } else {
      document.exitFullscreen();
    }
  });

  // Keyboard Shortcuts Navigation
  document.addEventListener("keydown", (e) => {
    if (readerInterface.classList.contains("hidden")) return;
    if (e.key === "ArrowRight") pageFlip?.flipNext();
    if (e.key === "ArrowLeft") pageFlip?.flipPrev();
    if (e.key === "Escape") {
      tocModal.classList.add("hidden");
      searchModal.classList.add("hidden");
    }
  });

  // Search Input Query Handler
  const searchInput = document.getElementById("search-input");
  searchInput?.addEventListener("input", (e) => {
    performTextSearch(e.target.value.trim());
  });
}

/* PDF.js Text Search Functionality */
async function performTextSearch(query) {
  const resultsContainer = document.getElementById("search-results-list");
  if (!resultsContainer) return;

  if (!query || query.length < 2) {
    resultsContainer.innerHTML = '<div class="search-empty-state">Enter keywords above to query the document.</div>';
    return;
  }

  resultsContainer.innerHTML = '<div class="search-empty-state">Searching publication...</div>';
  let matchesFound = 0;
  resultsContainer.innerHTML = "";

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(" ");

    if (pageText.toLowerCase().includes(query.toLowerCase())) {
      matchesFound++;
      const resultCard = document.createElement("div");
      resultCard.className = "toc-card";
      resultCard.style.textAlign = "left";
      resultCard.style.marginBottom = "0.75rem";

      // Highlight term match
      const snippetIndex = pageText.toLowerCase().indexOf(query.toLowerCase());
      const snippet = pageText.substring(Math.max(0, snippetIndex - 30), Math.min(pageText.length, snippetIndex + 80));

      resultCard.innerHTML = `
        <div class="toc-page-label">Page ${pageNum}</div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">
          ...${snippet}...
        </p>
      `;

      resultCard.addEventListener("click", () => {
        pageFlip.flip(pageNum - 1);
        document.getElementById("search-modal")?.classList.add("hidden");
      });

      resultsContainer.appendChild(resultCard);
    }
  }

  if (matchesFound === 0) {
    resultsContainer.innerHTML = `<div class="search-empty-state">No matching results found for "${query}".</div>`;
  }
}