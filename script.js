/**
 * INKSPIRE - High-Performance Digital Magazine Reader Engine
 * Engine Architecture: PDF.js -> Page Dimension Auto-Fit -> St.PageFlip Engine
 */

// Configure PDF.js Worker path
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// Global Application State
const STATE = {
  pdfUrl: 'newsletter.pdf', // Path to target PDF magazine file
  pdfDoc: null,
  pageFlip: null,
  totalPages: 0,
  currentPage: 1,
  textIndex: [],
  zoomLevel: 1.0,
  isZoomed: false,
  aspectRatio: 0.75 // Standard 3:4 portrait ratio default
};

// DOM Cache
const DOM = {
  loader: document.getElementById('app-loader'),
  progressBar: document.getElementById('loader-progress-bar'),
  statusText: document.getElementById('loader-status'),
  landingView: document.getElementById('landing-view'),
  readerView: document.getElementById('reader-view'),
  stage: document.getElementById('magazine-stage'),
  viewport: document.getElementById('stage-viewport'),
  flipbook: document.getElementById('flipbook'),
  inputPageNum: document.getElementById('input-page-num'),
  lblTotalPages: document.getElementById('lbl-total-pages'),
  tocOverlay: document.getElementById('toc-overlay'),
  searchOverlay: document.getElementById('search-overlay'),
  thumbnailGrid: document.getElementById('thumbnail-grid'),
  searchInput: document.getElementById('search-query-input'),
  searchResults: document.getElementById('search-results-list')
};

// Application Boot Sequence
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadPublicationDocument();
});

/* 1. PDF DOCUMENT PIPELINE & ENGINE INITIALIZATION */
async function loadPublicationDocument() {
  updateProgress(15, 'Loading publication document...');

  try {
    const loadingTask = pdfjsLib.getDocument(STATE.pdfUrl);
    
    loadingTask.onProgress = (progress) => {
      if (progress.total > 0) {
        const percent = Math.round((progress.loaded / progress.total) * 40) + 15;
        updateProgress(percent, 'Downloading issue content...');
      }
    };

    STATE.pdfDoc = await loadingTask.promise;
    STATE.totalPages = STATE.pdfDoc.numPages;
    
    DOM.lblTotalPages.textContent = `of ${STATE.totalPages}`;
    DOM.inputPageNum.max = STATE.totalPages;

    // Get page aspect ratio from Page 1
    const firstPage = await STATE.pdfDoc.getPage(1);
    const viewport = firstPage.getViewport({ scale: 1.0 });
    STATE.aspectRatio = viewport.width / viewport.height;

    updateProgress(60, 'Rendering high-definition spreads...');

    // Render Canvas elements for all pages
    await renderAllPages();

    updateProgress(90, 'Initializing 3D page flip engine...');

    // Initialize PageFlip
    initPageFlipEngine();

    // Generate thumbnails for Contents drawer
    generateThumbnails();

    updateProgress(100, 'Ready');
    
    setTimeout(() => {
      DOM.loader.style.opacity = '0';
      setTimeout(() => DOM.loader.classList.add('hidden'), 500);
    }, 300);

  } catch (error) {
    console.warn('PDF load failed, starting procedural fallback render:', error);
    initProceduralFallback();
  }
}

/* 2. RENDER PDF PAGES TO DOM CANVAS ELEMENTS */
async function renderAllPages() {
  DOM.flipbook.innerHTML = '';
  const dpr = window.devicePixelRatio || 1.5;

  for (let pageNum = 1; pageNum <= STATE.totalPages; pageNum++) {
    const pageWrapper = document.createElement('div');
    pageWrapper.className = 'page-wrapper';

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const page = await STATE.pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 * dpr });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    
    pageWrapper.appendChild(canvas);
    DOM.flipbook.appendChild(pageWrapper);

    // Index text content for full-text search engine
    indexPageText(page, pageNum);
  }
}

/* 3. CALCULATE MAXIMIZED FLIPBOOK DIMENSIONS & MOUNT ENGINE */
function initPageFlipEngine() {
  const dims = calculateMaximizedDimensions();

  STATE.pageFlip = new window.St.PageFlip(DOM.flipbook, {
    width: dims.width,
    height: dims.height,
    size: 'fixed',
    minWidth: 280,
    maxWidth: 1200,
    minHeight: 400,
    maxHeight: 1400,
    drawShadow: true,
    showCover: true,
    usePortrait: window.innerWidth < 768,
    maxShadowOpacity: 0.5,
    mobileScrollSupport: false,
    flippingTime: 800
  });

  STATE.pageFlip.loadFromHTML(document.querySelectorAll('#flipbook .page-wrapper'));

  // Sync state on flip events
  STATE.pageFlip.on('flip', (e) => {
    STATE.currentPage = e.data + 1;
    DOM.inputPageNum.value = STATE.currentPage;
  });
}

/* Dynamic math to calculate max size fitting inside viewport */
function calculateMaximizedDimensions() {
  const stageWidth = window.innerWidth;
  const stageHeight = window.innerHeight - 48; // Less top header height

  const isMobile = stageWidth < 768;
  const availHeight = stageHeight - 40; // minimal dock margin
  const availWidth = isMobile ? stageWidth - 20 : stageWidth - 80;

  let pageHeight = availHeight;
  let pageWidth = Math.round(pageHeight * STATE.aspectRatio);

  // If double-page spread exceeds screen width, recalculate based on width constraint
  if (!isMobile && (pageWidth * 2 > availWidth)) {
    pageWidth = Math.floor(availWidth / 2);
    pageHeight = Math.floor(pageWidth / STATE.aspectRatio);
  }

  return { width: pageWidth, height: pageHeight };
}

/* 4. TEXT INDEXING & SEARCH SYSTEM */
async function indexPageText(pageObj, pageNum) {
  const textContent = await pageObj.getTextContent();
  const textString = textContent.items.map(item => item.str).join(' ');
  STATE.textIndex.push({ pageNum, text: textString });
}

function executeSearch(query) {
  if (!query.trim()) {
    DOM.searchResults.innerHTML = '<div class="search-placeholder">Type a keyword above to search this publication.</div>';
    return;
  }

  const matches = STATE.textIndex.filter(item => item.text.toLowerCase().includes(query.toLowerCase()));

  if (matches.length === 0) {
    DOM.searchResults.innerHTML = `<div class="search-placeholder">No matches found for "${query}".</div>`;
    return;
  }

  DOM.searchResults.innerHTML = matches.map(m => {
    const idx = m.text.toLowerCase().indexOf(query.toLowerCase());
    const snippet = m.text.substring(Math.max(0, idx - 30), Math.min(m.text.length, idx + 60))
      .replace(new RegExp(query, 'gi'), match => `<strong style="color:var(--gold-accent);">${match}</strong>`);

    return `
      <div class="search-result-card" onclick="jumpToPage(${m.pageNum})">
        <span class="search-page-badge">Page ${m.pageNum}</span>
        <p class="search-snippet">"...${snippet}..."</p>
      </div>
    `;
  }).join('');
}

/* 5. THUMBNAIL GRID GENERATOR */
async function generateThumbnails() {
  DOM.thumbnailGrid.innerHTML = '';
  
  for (let pageNum = 1; pageNum <= STATE.totalPages; pageNum++) {
    const page = await STATE.pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 0.3 });

    const card = document.createElement('div');
    card.className = 'thumb-card';
    card.onclick = () => jumpToPage(pageNum);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: ctx, viewport: viewport }).promise;

    const label = document.createElement('span');
    label.className = 'thumb-label';
    label.textContent = `Page ${pageNum}`;

    card.appendChild(canvas);
    card.appendChild(label);
    DOM.thumbnailGrid.appendChild(card);
  }
}

/* 6. CONTROL EVENT BINDINGS & HANDLERS */
function setupEventListeners() {
  // Navigation Transitions
  document.getElementById('btn-read-issue')?.addEventListener('click', showReader);
  document.getElementById('btn-browse-toc-landing')?.addEventListener('click', () => {
    showReader();
    toggleOverlay(DOM.tocOverlay);
  });
  document.getElementById('btn-back-landing')?.addEventListener('click', showLanding);

  // Flipbook Controls
  document.getElementById('btn-prev-page')?.addEventListener('click', () => STATE.pageFlip?.flipPrev());
  document.getElementById('btn-next-page')?.addEventListener('click', () => STATE.pageFlip?.flipNext());
  document.getElementById('btn-dock-prev')?.addEventListener('click', () => STATE.pageFlip?.flipPrev());
  document.getElementById('btn-dock-next')?.addEventListener('click', () => STATE.pageFlip?.flipNext());

  // Input Jump
  DOM.inputPageNum?.addEventListener('change', (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) jumpToPage(val);
  });

  // Modal Toggles
  document.getElementById('btn-toc-toggle')?.addEventListener('click', () => toggleOverlay(DOM.tocOverlay));
  document.getElementById('btn-close-toc')?.addEventListener('click', closeOverlays);
  
  document.getElementById('btn-search-toggle')?.addEventListener('click', () => toggleOverlay(DOM.searchOverlay));
  document.getElementById('btn-close-search')?.addEventListener('click', closeOverlays);

  DOM.searchInput?.addEventListener('input', (e) => executeSearch(e.target.value));

  // Zoom Handling
  document.getElementById('btn-zoom-in')?.addEventListener('click', () => handleZoom(0.2));
  document.getElementById('btn-zoom-out')?.addEventListener('click', () => handleZoom(-0.2));

  // Fullscreen Handler
  document.getElementById('btn-fullscreen-toggle')?.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else {
      document.exitFullscreen();
    }
  });

  // Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    if (DOM.readerView.classList.contains('hidden')) return;
    if (e.key === 'ArrowLeft') STATE.pageFlip?.flipPrev();
    if (e.key === 'ArrowRight') STATE.pageFlip?.flipNext();
    if (e.key === 'Escape') closeOverlays();
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      toggleOverlay(DOM.searchOverlay);
    }
  });

  // Resize Handler
  window.addEventListener('resize', () => {
    if (STATE.pageFlip && !DOM.readerView.classList.contains('hidden')) {
      const dims = calculateMaximizedDimensions();
      STATE.pageFlip.updateFromHTML(document.querySelectorAll('#flipbook .page-wrapper'));
    }
  });
}

function jumpToPage(pageNum) {
  if (!STATE.pageFlip) return;
  const target = Math.max(0, Math.min(pageNum - 1, STATE.totalPages - 1));
  STATE.pageFlip.turnToPage(target);
  closeOverlays();
}

function handleZoom(delta) {
  STATE.zoomLevel = Math.max(0.8, Math.min(2.0, STATE.zoomLevel + delta));
  DOM.viewport.style.transform = `scale(${STATE.zoomLevel})`;
}

function showReader() {
  DOM.landingView.classList.add('hidden');
  DOM.readerView.classList.remove('hidden');
  window.dispatchEvent(new Event('resize'));
}

function showLanding() {
  DOM.readerView.classList.add('hidden');
  DOM.landingView.classList.remove('hidden');
}

function toggleOverlay(overlayEl) {
  const isActive = overlayEl.classList.contains('active');
  closeOverlays();
  if (!isActive) overlayEl.classList.add('active');
}

function closeOverlays() {
  DOM.tocOverlay.classList.remove('active');
  DOM.searchOverlay.classList.remove('active');
}

function updateProgress(percent, text) {
  if (DOM.progressBar) DOM.progressBar.style.width = percent + '%';
  if (DOM.statusText) DOM.statusText.textContent = text;
}

/* Fallback procedural generator if local PDF is missing */
function initProceduralFallback() {
  STATE.totalPages = 4;
  DOM.lblTotalPages.textContent = `of ${STATE.totalPages}`;
  DOM.flipbook.innerHTML = '';

  for (let i = 1; i <= 4; i++) {
    const pageWrapper = document.createElement('div');
    pageWrapper.className = 'page-wrapper';
    pageWrapper.style.padding = '2rem';
    pageWrapper.style.background = i === 1 ? '#001224' : '#FFFFFF';
    pageWrapper.style.color = i === 1 ? '#FFFFFF' : '#0F172A';

    pageWrapper.innerHTML = i === 1 ? `
      <div style="height:100%; border:2px solid #C5A059; padding:2rem; display:flex; flex-direction:column; justify-content:space-between; text-align:center;">
        <span style="font-family:'Plus Jakarta Sans'; font-size:0.8rem; color:#C5A059; letter-spacing:2px;">PRESIDENCY SCHOOL BANASHANKARI</span>
        <h1 style="font-family:'Playfair Display'; font-size:3rem; color:#C5A059;">INKSPIRE</h1>
        <p style="font-size:0.9rem; color:#94A3B8;">Drag corners or click side arrows to turn pages.</p>
      </div>
    ` : `
      <div style="height:100%; display:flex; flex-direction:column; justify-content:space-between;">
        <h2 style="font-family:'Cormorant Garamond'; color:#001224; font-size:2rem;">Editorial Page ${i}</h2>
        <p style="line-height:1.6; color:#475569; text-align:justify;">Welcome to the INKSPIRE digital reader platform. Place your custom publication named "newsletter.pdf" in the root directory to display your school magazine automatically.</p>
        <div style="border-top:1px solid #E2E8F0; padding-top:0.5rem; font-size:0.75rem; color:#94A3B8;">Page ${i}</div>
      </div>
    `;
    DOM.flipbook.appendChild(pageWrapper);
  }

  initPageFlipEngine();
  DOM.loader.style.opacity = '0';
  setTimeout(() => DOM.loader.classList.add('hidden'), 500);
}