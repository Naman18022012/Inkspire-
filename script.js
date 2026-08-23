/**
 * INKSPIRE - Digital Magazine Reader Engine
 * Architecture: PDF.js (Parsing/Rendering) + St.PageFlip (3D Flipbook)
 */

// Configure PDF.js Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Application State
const STATE = {
  pdfUrl: 'newsletter.pdf', // Primary target file in repository
  fallbackPdfUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf',
  pdfDoc: null,
  pageFlip: null,
  totalPages: 0,
  currentPage: 1,
  zoomLevel: 1.0,
  textIndex: [], // Extracted page text for full-text search
  isLoaded: false
};

// DOM Elements Reference
const DOM = {
  loader: document.getElementById('app-loader'),
  loaderBar: document.getElementById('loader-bar'),
  loaderStatus: document.getElementById('loader-status'),
  landingPage: document.getElementById('landing-page'),
  readerPage: document.getElementById('reader-page'),
  btnOpenReader: document.getElementById('btn-open-reader'),
  btnLandingToc: document.getElementById('btn-landing-toc'),
  btnBackHome: document.getElementById('btn-back-home'),
  landingCoverTarget: document.getElementById('landing-cover-target'),
  landingCoverCard: document.getElementById('landing-cover-card'),
  flipbookContainer: document.getElementById('flipbook'),
  flipbookWrapper: document.getElementById('flipbook-wrapper'),
  dockPageInput: document.getElementById('dock-page-input'),
  dockTotalPages: document.getElementById('dock-total-pages'),
  dockPrevBtn: document.getElementById('dock-prev-btn'),
  dockNextBtn: document.getElementById('dock-next-btn'),
  stagePrevBtn: document.getElementById('stage-prev-btn'),
  stageNextBtn: document.getElementById('stage-next-btn'),
  drawerToc: document.getElementById('drawer-toc'),
  drawerSearch: document.getElementById('drawer-search'),
  thumbnailGrid: document.getElementById('thumbnail-grid'),
  searchInput: document.getElementById('search-input'),
  searchResultsContainer: document.getElementById('search-results-container'),
  zoomIndicator: document.getElementById('zoom-level-indicator')
};

// Initialize Application on DOM Ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initApplication();
  } catch (err) {
    console.error("Initialization failed:", err);
    updateProgress(100, "Loading demo publication...");
    await loadPdfDocument(STATE.fallbackPdfUrl);
  }
});

// 1. MAIN PIPELINE
async function initApplication() {
  updateProgress(15, "Connecting to publication source...");

  // Try loading primary PDF; fallback gracefully if missing locally
  try {
    await loadPdfDocument(STATE.pdfUrl);
  } catch (e) {
    console.warn("Primary file 'newsletter.pdf' not found. Loading fallback sample...");
    await loadPdfDocument(STATE.fallbackPdfUrl);
  }

  setupEventListeners();
  hideLoader();
}

// 2. PDF LOADING & RENDERING
async function loadPdfDocument(url) {
  updateProgress(30, "Downloading magazine pages...");
  
  const loadingTask = pdfjsLib.getDocument(url);
  loadingTask.onProgress = (p) => {
    if (p.total > 0) {
      const pct = Math.round((p.loaded / p.total) * 40) + 30;
      updateProgress(pct, "Fetching PDF structure...");
    }
  };

  STATE.pdfDoc = await loadingTask.promise;
  STATE.totalPages = STATE.pdfDoc.numPages;
  DOM.dockTotalPages.textContent = `of ${STATE.totalPages}`;
  DOM.dockPageInput.max = STATE.totalPages;

  // Render Cover Preview on Landing Page
  await renderCoverPreview();

  // Render High-Res Pages for Flipbook
  await buildFlipbookDOM();
}

async function renderCoverPreview() {
  const page = await STATE.pdfDoc.getPage(1);
  const viewport = page.getViewport({ scale: 0.8 });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: context, viewport }).promise;
  DOM.landingCoverTarget.innerHTML = '';
  DOM.landingCoverTarget.appendChild(canvas);
}

async function buildFlipbookDOM() {
  updateProgress(75, "Rendering crisp page typography...");
  DOM.flipbookContainer.innerHTML = '';

  const firstPage = await STATE.pdfDoc.getPage(1);
  const unscaledViewport = firstPage.getViewport({ scale: 1.0 });
  const aspectRatio = unscaledViewport.width / unscaledViewport.height;

  // Calculate optimum fit height for desktop viewport
  const availableHeight = Math.min(window.innerHeight - 80, 920);
  const targetPageHeight = Math.max(availableHeight, 520);
  const targetPageWidth = Math.round(targetPageHeight * aspectRatio);

  const dpr = window.devicePixelRatio || 1.5;

  for (let pageNum = 1; pageNum <= STATE.totalPages; pageNum++) {
    const pageObj = await STATE.pdfDoc.getPage(pageNum);
    const viewport = pageObj.getViewport({ 
      scale: (targetPageHeight / pageObj.getViewport({ scale: 1 }).height) * dpr 
    });

    const pageDiv = document.createElement('div');
    pageDiv.className = 'page';

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await pageObj.render({ canvasContext: context, viewport }).promise;
    pageDiv.appendChild(canvas);
    DOM.flipbookContainer.appendChild(pageDiv);

    // Index text for full-text search engine asynchronously
    extractPageText(pageObj, pageNum);
  }

  updateProgress(95, "Initializing 3D page-flip engine...");

  // Instantiate St.PageFlip
  STATE.pageFlip = new window.St.PageFlip(DOM.flipbookContainer, {
    width: targetPageWidth,
    height: targetPageHeight,
    size: 'stretch',
    minWidth: 300,
    maxWidth: 1000,
    minHeight: 400,
    maxHeight: 1200,
    drawShadow: true,
    showCover: true,
    usePortrait: window.innerWidth < 768,
    maxShadowOpacity: 0.5
  });

  STATE.pageFlip.loadFromHTML(document.querySelectorAll('#flipbook .page'));

  // Sync state on page turning events
  STATE.pageFlip.on('flip', (e) => {
    STATE.currentPage = e.data + 1;
    DOM.dockPageInput.value = STATE.currentPage;
  });

  // Render Thumbnails in Background
  generateThumbnails();
}

// 3. TEXT INDEXING & SEARCH SYSTEM
async function extractPageText(pageObj, pageNum) {
  const textContent = await pageObj.getTextContent();
  const textString = textContent.items.map(i => i.str).join(' ');
  STATE.textIndex.push({ pageNum, text: textString });
}

function executeSearch(query) {
  if (!query.trim()) {
    DOM.searchResultsContainer.innerHTML = '<div class="search-placeholder">Type a query above to search through extracted PDF text.</div>';
    return;
  }

  const results = STATE.textIndex.filter(item => item.text.toLowerCase().includes(query.toLowerCase()));

  if (results.length === 0) {
    DOM.searchResultsContainer.innerHTML = '<div class="search-placeholder">No occurrences found for this term.</div>';
    return;
  }

  DOM.searchResultsContainer.innerHTML = results.map(res => {
    const idx = res.text.toLowerCase().indexOf(query.toLowerCase());
    const start = Math.max(0, idx - 30);
    const end = Math.min(res.text.length, idx + 50);
    const snippet = res.text.substring(start, end).replace(
      new RegExp(query, 'gi'), 
      match => `<strong style="color:var(--color-accent-gold);">${match}</strong>`
    );

    return `
      <div class="search-result-card" onclick="jumpToPage(${res.pageNum})">
        <span class="result-page-tag">PAGE ${res.pageNum}</span>
        <p class="result-snippet">"...${snippet}..."</p>
      </div>
    `;
  }).join('');
}

// 4. THUMBNAILS GENERATOR
async function generateThumbnails() {
  DOM.thumbnailGrid.innerHTML = '';
  for (let pageNum = 1; pageNum <= STATE.totalPages; pageNum++) {
    const pageObj = await STATE.pdfDoc.getPage(pageNum);
    const viewport = pageObj.getViewport({ scale: 0.2 });

    const thumbCard = document.createElement('div');
    thumbCard.className = 'thumb-item';
    thumbCard.onclick = () => jumpToPage(pageNum);

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await pageObj.render({ canvasContext: context, viewport }).promise;

    const label = document.createElement('span');
    label.textContent = `Page ${pageNum}`;

    thumbCard.appendChild(canvas);
    thumbCard.appendChild(label);
    DOM.thumbnailGrid.appendChild(thumbCard);
  }
}

// 5. NAVIGATION & USER INTERACTION
function jumpToPage(pageNum) {
  if (!STATE.pageFlip) return;
  const targetIndex = Math.max(0, Math.min(pageNum - 1, STATE.totalPages - 1));
  STATE.pageFlip.turnToPage(targetIndex);
  closeDrawers();
}

function setupEventListeners() {
  // Navigation Transitions
  DOM.btnOpenReader.addEventListener('click', showReader);
  DOM.landingCoverCard.addEventListener('click', showReader);
  DOM.btnBackHome.addEventListener('click', showLanding);
  
  DOM.btnLandingToc.addEventListener('click', () => {
    showReader();
    openDrawer(DOM.drawerToc);
  });

  // Controls & Flip Actions
  DOM.dockPrevBtn.addEventListener('click', () => STATE.pageFlip && STATE.pageFlip.flipPrev());
  DOM.dockNextBtn.addEventListener('click', () => STATE.pageFlip && STATE.pageFlip.flipNext());
  DOM.stagePrevBtn.addEventListener('click', () => STATE.pageFlip && STATE.pageFlip.flipPrev());
  DOM.stageNextBtn.addEventListener('click', () => STATE.pageFlip && STATE.pageFlip.flipNext());

  DOM.dockPageInput.addEventListener('change', (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) jumpToPage(val);
  });

  // Drawer Controls
  document.getElementById('btn-toggle-toc').addEventListener('click', () => toggleDrawer(DOM.drawerToc));
  document.getElementById('close-toc-btn').addEventListener('click', closeDrawers);

  document.getElementById('btn-toggle-search').addEventListener('click', () => toggleDrawer(DOM.drawerSearch));
  document.getElementById('close-search-btn').addEventListener('click', closeDrawers);

  DOM.searchInput.addEventListener('input', (e) => executeSearch(e.target.value));

  // Zoom Handling
  document.getElementById('btn-zoom-in').addEventListener('click', () => setZoom(STATE.zoomLevel + 0.15));
  document.getElementById('btn-zoom-out').addEventListener('click', () => setZoom(STATE.zoomLevel - 0.15));
  document.getElementById('btn-zoom-reset').addEventListener('click', () => setZoom(1.0));

  // Fullscreen Handling
  document.getElementById('btn-fullscreen').addEventListener('click', toggleFullscreen);

  // Global Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    if (DOM.readerPage.classList.contains('hidden')) return;
    
    if (e.key === 'ArrowLeft') STATE.pageFlip && STATE.pageFlip.flipPrev();
    if (e.key === 'ArrowRight') STATE.pageFlip && STATE.pageFlip.flipNext();
    if (e.key === 'Escape') closeDrawers();
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      toggleDrawer(DOM.drawerSearch);
    }
  });
}

function setZoom(level) {
  STATE.zoomLevel = Math.min(Math.max(0.8, level), 1.6);
  DOM.flipbookWrapper.style.transform = `scale(${STATE.zoomLevel})`;
  DOM.zoomIndicator.textContent = `${Math.round(STATE.zoomLevel * 100)}%`;
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

function showReader() {
  DOM.landingPage.classList.add('hidden');
  DOM.readerPage.classList.remove('hidden');
  if (STATE.pageFlip) STATE.pageFlip.update();
}

function showLanding() {
  DOM.readerPage.classList.add('hidden');
  DOM.landingPage.classList.remove('hidden');
}

function toggleDrawer(drawerEl) {
  const isActive = drawerEl.classList.contains('active');
  closeDrawers();
  if (!isActive) drawerEl.classList.add('active');
}

function closeDrawers() {
  DOM.drawerToc.classList.remove('active');
  DOM.drawerSearch.classList.remove('active');
}

function updateProgress(percent, statusText) {
  if (DOM.loaderBar) DOM.loaderBar.style.width = percent + '%';
  if (DOM.loaderStatus) DOM.loaderStatus.textContent = statusText;
}

function hideLoader() {
  setTimeout(() => {
    DOM.loader.style.opacity = '0';
    DOM.loader.style.visibility = 'hidden';
  }, 300);
}