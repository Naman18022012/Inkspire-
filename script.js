/**
 * HEAT WAVES DIGITAL MAGAZINE
 * High-performance PDF Rendering & Flipbook Controller
 */

// Global App Configuration & State
const CONFIG = {
  pdfUrl: 'newsletter.pdf', // Path to your school newsletter PDF
  scale: 1.8,               // HD crisp canvas rendering factor
  flipbookWidth: 550,       // Single page width (px)
  flipbookHeight: 733       // Single page height (px)
};

const STATE = {
  pdfDoc: null,
  pageFlip: null,
  totalPages: 0,
  currentPage: 1,
  currentZoom: 1.0,
  pageTextIndex: []
};

// Initialize PDF.js Worker
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// DOM Elements
const DOM = {
  loadingScreen: document.getElementById('loading-screen'),
  loadingStatus: document.getElementById('loading-status'),
  progressBar: document.getElementById('progress-bar'),
  
  heroSection: document.getElementById('hero-section'),
  readerStage: document.getElementById('reader-stage'),
  btnOpenIssue: document.getElementById('btn-open-issue'),
  btnHeroToc: document.getElementById('btn-hero-toc'),
  btnBackHero: document.getElementById('btn-back-hero'),
  
  heroCoverCanvas: document.getElementById('hero-cover-canvas'),
  coverFallback: document.getElementById('cover-fallback'),
  metaTotalPages: document.getElementById('meta-total-pages'),
  
  flipbookWrapper: document.getElementById('flipbook-wrapper'),
  flipbookContainer: document.getElementById('flipbook'),
  
  pageInput: document.getElementById('page-input'),
  pageTotal: document.getElementById('page-total'),
  btnPrev: document.getElementById('btn-prev'),
  btnNext: document.getElementById('btn-next'),
  
  btnZoomIn: document.getElementById('btn-zoom-in'),
  btnZoomOut: document.getElementById('btn-zoom-out'),
  btnZoomReset: document.getElementById('btn-zoom-reset'),
  zoomLevelText: document.getElementById('zoom-level-text'),
  btnFullscreen: document.getElementById('btn-fullscreen'),
  
  btnSearch: document.getElementById('btn-search'),
  searchModal: document.getElementById('search-modal'),
  searchInput: document.getElementById('search-input'),
  searchResultsList: document.getElementById('search-results-list'),
  btnCloseSearch: document.getElementById('btn-close-search'),
  searchBackdrop: document.getElementById('search-backdrop'),
  
  btnToc: document.getElementById('btn-toc'),
  tocModal: document.getElementById('toc-modal'),
  thumbnailGrid: document.getElementById('thumbnail-grid'),
  btnCloseToc: document.getElementById('btn-close-toc'),
  tocBackdrop: document.getElementById('toc-backdrop')
};

// Main Initialization Entry
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Lucide Icons
  if (window.lucide) lucide.createIcons();

  setupEventListeners();
  await loadPdfDocument();
});

/**
 * Loads the PDF document using PDF.js
 */
async function loadPdfDocument() {
  updateProgress(10, 'Fetching publication PDF...');

  try {
    const loadingTask = pdfjsLib.getDocument(CONFIG.pdfUrl);
    
    loadingTask.onProgress = (progress) => {
      if (progress.total > 0) {
        const percent = Math.round((progress.loaded / progress.total) * 40) + 10;
        updateProgress(percent, 'Downloading issue...');
      }
    };

    STATE.pdfDoc = await loadingTask.promise;
    STATE.totalPages = STATE.pdfDoc.numPages;
    
    DOM.pageTotal.textContent = STATE.totalPages;
    DOM.metaTotalPages.textContent = `${STATE.totalPages} Pages`;

    updateProgress(50, 'Rendering high-resolution pages...');
    
    // Render Hero Cover
    await renderHeroCover();

    // Render All Flipbook Pages
    await renderAllPages();

    // Initialize StPageFlip Engine
    initPageFlipEngine();

    // Build Search Index in Background
    buildSearchIndex();

    updateProgress(100, 'Ready');
    setTimeout(() => {
      DOM.loadingScreen.classList.remove('active');
    }, 400);

  } catch (error) {
    console.warn('PDF failed to load or file not found. Initializing fallback mode.', error);
    updateProgress(100, 'Loaded');
    DOM.loadingScreen.classList.remove('active');
  }
}

/**
 * Renders page 1 to the Hero spotlight card
 */
async function renderHeroCover() {
  if (!STATE.pdfDoc) return;
  try {
    const page = await STATE.pdfDoc.getPage(1);
    const viewport = page.getViewport({ scale: 1.0 });
    const canvas = DOM.heroCoverCanvas;
    const ctx = canvas.getContext('2d');

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    if (DOM.coverFallback) DOM.coverFallback.style.display = 'none';
  } catch (err) {
    console.error('Error rendering cover canvas:', err);
  }
}

/**
 * Creates page wrappers and renders canvases for PageFlip.js
 */
async function renderAllPages() {
  if (!STATE.pdfDoc) return;

  DOM.flipbookContainer.innerHTML = '';

  for (let pageNum = 1; pageNum <= STATE.totalPages; pageNum++) {
    const page = await STATE.pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: CONFIG.scale });

    // Page Container
    const pageDiv = document.createElement('div');
    pageDiv.className = 'page';

    // Canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: ctx, viewport: viewport }).promise;

    pageDiv.appendChild(canvas);
    DOM.flipbookContainer.appendChild(pageDiv);

    const percent = 50 + Math.round((pageNum / STATE.totalPages) * 40);
    updateProgress(percent, `Rendering page ${pageNum} of ${STATE.totalPages}...`);
  }
}

/**
 * Initializes StPageFlip engine
 */
function initPageFlipEngine() {
  if (typeof St === 'undefined' || !St.PageFlip) return;

  const isMobile = window.innerWidth <= 768;

  STATE.pageFlip = new St.PageFlip(DOM.flipbookContainer, {
    width: CONFIG.flipbookWidth,
    height: CONFIG.flipbookHeight,
    size: 'stretch',
    minWidth: 300,
    maxWidth: 800,
    minHeight: 400,
    maxHeight: 1000,
    drawShadow: true,
    showCover: true,
    usePortrait: isMobile,
    maxShadowOpacity: 0.4,
    mobileScrollSupport: false
  });

  const pageElements = DOM.flipbookContainer.querySelectorAll('.page');
  if (pageElements.length > 0) {
    STATE.pageFlip.loadFromHTML(pageElements);
  }

  // Pageflip Events
  STATE.pageFlip.on('flip', (e) => {
    STATE.currentPage = e.data + 1;
    DOM.pageInput.value = STATE.currentPage;
  });
}

/**
 * Switches view from Hero Landing to Reader Stage
 */
function openMagazine() {
  DOM.heroSection.classList.remove('visible');
  DOM.readerStage.classList.add('visible');

  // Trigger resize refresh for PageFlip canvas
  setTimeout(() => {
    if (STATE.pageFlip) STATE.pageFlip.update();
  }, 300);
}

/**
 * Switches view back to Hero Landing
 */
function showHero() {
  DOM.readerStage.classList.remove('visible');
  DOM.heroSection.classList.add('visible');
}

/**
 * Zoom Controls
 */
function setZoom(level) {
  STATE.currentZoom = Math.min(Math.max(level, 0.7), 1.8);
  DOM.flipbookWrapper.style.transform = `scale(${STATE.currentZoom})`;
  DOM.zoomLevelText.textContent = `${Math.round(STATE.currentZoom * 100)}%`;
}

/**
 * Background Search Indexing
 */
async function buildSearchIndex() {
  if (!STATE.pdfDoc) return;
  STATE.pageTextIndex = [];

  for (let i = 1; i <= STATE.totalPages; i++) {
    const page = await STATE.pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const textStr = textContent.items.map(item => item.str).join(' ');
    STATE.pageTextIndex.push({ pageNum: i, text: textStr });
  }
}

/**
 * Execute Search Query
 */
function executeSearch(query) {
  const q = query.trim().toLowerCase();
  DOM.searchResultsList.innerHTML = '';

  if (!q) {
    DOM.searchResultsList.innerHTML = '<p class="search-empty-state">Type a word above to search throughout the issue.</p>';
    return;
  }

  const results = STATE.pageTextIndex.filter(item => item.text.toLowerCase().includes(q));

  if (results.length === 0) {
    DOM.searchResultsList.innerHTML = '<p class="search-empty-state">No matching results found.</p>';
    return;
  }

  results.forEach(res => {
    const idx = res.text.toLowerCase().indexOf(q);
    const start = Math.max(0, idx - 40);
    const end = Math.min(res.text.length, idx + 60);
    const snippet = res.text.substring(start, end);

    const itemEl = document.createElement('div');
    itemEl.className = 'search-result-item';
    itemEl.innerHTML = `
      <div class="search-result-page">Page ${res.pageNum}</div>
      <div class="search-result-snippet">"...${snippet}..."</div>
    `;

    itemEl.addEventListener('click', () => {
      closeSearchModal();
      if (STATE.pageFlip) STATE.pageFlip.turnToPage(res.pageNum - 1);
    });

    DOM.searchResultsList.appendChild(itemEl);
  });
}

/**
 * Populates Table of Contents Thumbnail Grid
 */
async function generateThumbnails() {
  if (!STATE.pdfDoc || DOM.thumbnailGrid.children.length > 0) return;

  for (let i = 1; i <= STATE.totalPages; i++) {
    const item = document.createElement('div');
    item.className = 'thumb-item';

    const card = document.createElement('div');
    card.className = 'thumb-card';

    const canvas = document.createElement('canvas');
    card.appendChild(canvas);

    const label = document.createElement('span');
    label.className = 'thumb-label';
    label.textContent = `Page ${i}`;

    item.appendChild(card);
    item.appendChild(label);

    item.addEventListener('click', () => {
      closeTocModal();
      if (STATE.pageFlip) STATE.pageFlip.turnToPage(i - 1);
    });

    DOM.thumbnailGrid.appendChild(item);

    // Render async thumb
    STATE.pdfDoc.getPage(i).then(page => {
      const viewport = page.getViewport({ scale: 0.3 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport });
    });
  }
}

/**
 * Setup All Application UI Event Listeners
 */
function setupEventListeners() {
  // Navigation & View Switches
  DOM.btnOpenIssue.addEventListener('click', openMagazine);
  DOM.btnBackHero.addEventListener('click', showHero);

  // Flipbook Prev/Next Controls
  DOM.btnPrev.addEventListener('click', () => STATE.pageFlip && STATE.pageFlip.flipPrev());
  DOM.btnNext.addEventListener('click', () => STATE.pageFlip && STATE.pageFlip.flipNext());

  // Direct Page Input Change
  DOM.pageInput.addEventListener('change', (e) => {
    let targetPage = parseInt(e.target.value, 10);
    if (isNaN(targetPage)) return;
    targetPage = Math.min(Math.max(targetPage, 1), STATE.totalPages);
    if (STATE.pageFlip) STATE.pageFlip.turnToPage(targetPage - 1);
  });

  // Zoom
  DOM.btnZoomIn.addEventListener('click', () => setZoom(STATE.currentZoom + 0.15));
  DOM.btnZoomOut.addEventListener('click', () => setZoom(STATE.currentZoom - 0.15));
  DOM.btnZoomReset.addEventListener('click', () => setZoom(1.0));

  // Fullscreen
  DOM.btnFullscreen.addEventListener('click', toggleFullscreen);

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === 'INPUT') return;

    if (e.key === 'ArrowRight') STATE.pageFlip && STATE.pageFlip.flipNext();
    if (e.key === 'ArrowLeft') STATE.pageFlip && STATE.pageFlip.flipPrev();
    if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    if (e.key === 'Escape') {
      closeSearchModal();
      closeTocModal();
    }
  });

  // Search Modal
  DOM.btnSearch.addEventListener('click', () => {
    DOM.searchModal.classList.add('active');
    DOM.searchInput.focus();
  });
  DOM.btnCloseSearch.addEventListener('click', closeSearchModal);
  DOM.searchBackdrop.addEventListener('click', closeSearchModal);
  DOM.searchInput.addEventListener('input', (e) => executeSearch(e.target.value));

  // TOC Modal
  DOM.btnToc.addEventListener('click', () => {
    DOM.tocModal.classList.add('active');
    generateThumbnails();
  });
  DOM.btnHeroToc.addEventListener('click', () => {
    openMagazine();
    DOM.tocModal.classList.add('active');
    generateThumbnails();
  });
  DOM.btnCloseToc.addEventListener('click', closeTocModal);
  DOM.tocBackdrop.addEventListener('click', closeTocModal);
}

function closeSearchModal() {
  DOM.searchModal.classList.remove('active');
}

function closeTocModal() {
  DOM.tocModal.classList.remove('active');
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
  }
}

function updateProgress(percent, statusText) {
  if (DOM.progressBar) DOM.progressBar.style.width = `${percent}%`;
  if (DOM.loadingStatus) DOM.loadingStatus.textContent = statusText;
}