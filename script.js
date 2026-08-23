/**
 * INKSPIRE - Official Digital Reader Engine
 * Presidency School Banashankari (PSBSK)
 */

// Configure PDF.js Worker path
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// Global Application State
const STATE = {
  pdfUrl: 'newsletter.pdf',
  pdfDoc: null,
  pageFlip: null,
  totalPages: 0,
  currentPage: 1,
  textIndex: [],
  zoomLevel: 1.0,
  aspectRatio: 0.75
};

// DOM Cache
const DOM = {
  loader: document.getElementById('app-loader'),
  progressBar: document.getElementById('loader-progress-bar'),
  statusText: document.getElementById('loader-status'),
  landingView: document.getElementById('landing-view'),
  readerView: document.getElementById('reader-view'),
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

/* 1. PDF PIPELINE & FLIPBOOK INITIALIZATION */
async function loadPublicationDocument() {
  updateProgress(15, 'Loading PSBSK document...');

  try {
    const loadingTask = pdfjsLib.getDocument(STATE.pdfUrl);
    
    loadingTask.onProgress = (progress) => {
      if (progress.total > 0) {
        const percent = Math.round((progress.loaded / progress.total) * 40) + 15;
        updateProgress(percent, 'Downloading publication data...');
      }
    };

    STATE.pdfDoc = await loadingTask.promise;
    STATE.totalPages = STATE.pdfDoc.numPages;
    
    DOM.lblTotalPages.textContent = `of ${STATE.totalPages}`;
    DOM.inputPageNum.max = STATE.totalPages;

    const firstPage = await STATE.pdfDoc.getPage(1);
    const viewport = firstPage.getViewport({ scale: 1.0 });
    STATE.aspectRatio = viewport.width / viewport.height;

    updateProgress(60, 'Rendering high-definition spreads...');
    await renderAllPages();

    updateProgress(90, 'Initializing 3D flip engine...');
    initPageFlipEngine();
    generateThumbnails();

    updateProgress(100, 'Ready');
    
    setTimeout(() => {
      DOM.loader.style.opacity = '0';
      setTimeout(() => DOM.loader.classList.add('hidden'), 500);
    }, 300);

  } catch (error) {
    console.warn('PDF load failed, rendering fallback view:', error);
    initProceduralFallback();
  }
}

/* 2. RENDER PAGES TO CANVAS */
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

    indexPageText(page, pageNum);
  }
}

/* 3. CALCULATE MAXIMIZED FLIPBOOK DIMENSIONS */
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
    flippingTime: 800
  });

  STATE.pageFlip.loadFromHTML(document.querySelectorAll('#flipbook .page-wrapper'));

  STATE.pageFlip.on('flip', (e) => {
    STATE.currentPage = e.data + 1;
    DOM.inputPageNum.value = STATE.currentPage;
  });
}

function calculateMaximizedDimensions() {
  const stageWidth = window.innerWidth;
  const stageHeight = window.innerHeight - 52;

  const isMobile = stageWidth < 768;
  const availHeight = stageHeight - 40;
  const availWidth = isMobile ? stageWidth - 20 : stageWidth - 80;

  let pageHeight = availHeight;
  let pageWidth = Math.round(pageHeight * STATE.aspectRatio);

  if (!isMobile && (pageWidth * 2 > availWidth)) {
    pageWidth = Math.floor(availWidth / 2);
    pageHeight = Math.floor(pageWidth / STATE.aspectRatio);
  }

  return { width: pageWidth, height: pageHeight };
}

/* 4. SEARCH SYSTEM */
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

/* 5. THUMBNAILS GENERATOR */
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

/* 6. EVENT BINDINGS */
function setupEventListeners() {
  // Navigation Event Bindings
  document.getElementById('nav-brand-home')?.addEventListener('click', showLanding);
  document.getElementById('nav-btn-issue')?.addEventListener('click', showLanding);
  document.getElementById('nav-btn-archive')?.addEventListener('click', () => {
    showLanding();
    document.getElementById('archive-section')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('nav-btn-read-now')?.addEventListener('click', showReader);
  document.getElementById('btn-read-issue')?.addEventListener('click', showReader);
  document.getElementById('btn-browse-toc-landing')?.addEventListener('click', () => {
    showReader();
    toggleOverlay(DOM.tocOverlay);
  });

  document.getElementById('btn-back-landing')?.addEventListener('click', showLanding);
  document.getElementById('footer-link-current')?.addEventListener('click', (e) => {
    e.preventDefault();
    showReader();
  });

  // Flipbook Controls
  document.getElementById('btn-prev-page')?.addEventListener('click', () => STATE.pageFlip?.flipPrev());
  document.getElementById('btn-next-page')?.addEventListener('click', () => STATE.pageFlip?.flipNext());
  document.getElementById('btn-dock-prev')?.addEventListener('click', () => STATE.pageFlip?.flipPrev());
  document.getElementById('btn-dock-next')?.addEventListener('click', () => STATE.pageFlip?.flipNext());

  DOM.inputPageNum?.addEventListener('change', (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) jumpToPage(val);
  });

  // Overlays
  document.getElementById('btn-toc-toggle')?.addEventListener('click', () => toggleOverlay(DOM.tocOverlay));
  document.getElementById('btn-close-toc')?.addEventListener('click', closeOverlays);
  
  document.getElementById('btn-search-toggle')?.addEventListener('click', () => toggleOverlay(DOM.searchOverlay));
  document.getElementById('nav-btn-search')?.addEventListener('click', () => {
    showReader();
    toggleOverlay(DOM.searchOverlay);
  });
  document.getElementById('btn-close-search')?.addEventListener('click', closeOverlays);

  DOM.searchInput?.addEventListener('input', (e) => executeSearch(e.target.value));

  // Zoom
  document.getElementById('btn-zoom-in')?.addEventListener('click', () => handleZoom(0.2));
  document.getElementById('btn-zoom-out')?.addEventListener('click', () => handleZoom(-0.2));

  // Fullscreen
  document.getElementById('btn-fullscreen-toggle')?.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else {
      document.exitFullscreen();
    }
  });

  // Keyboard Navigation
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

  window.addEventListener('resize', () => {
    if (STATE.pageFlip && !DOM.readerView.classList.contains('hidden')) {
      calculateMaximizedDimensions();
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

/* Fallback procedural renderer if newsletter.pdf is missing */
function initProceduralFallback() {
  STATE.totalPages = 4;
  DOM.lblTotalPages.textContent = `of ${STATE.totalPages}`;
  DOM.flipbook.innerHTML = '';

  for (let i = 1; i <= 4; i++) {
    const pageWrapper = document.createElement('div');
    pageWrapper.className = 'page-wrapper';
    pageWrapper.style.padding = '2.5rem';
    pageWrapper.style.background = i === 1 ? '#002B49' : '#FFFFFF';
    pageWrapper.style.color = i === 1 ? '#FFFFFF' : '#0F172A';

    pageWrapper.innerHTML = i === 1 ? `
      <div style="height:100%; border:2px solid #C5A059; padding:2rem; display:flex; flex-direction:column; justify-content:space-between; text-align:center;">
        <span style="font-size:0.75rem; color:#C5A059; letter-spacing:2px; font-weight:800;">PRESIDENCY SCHOOL BANASHANKARI</span>
        <h1 style="font-family:'Playfair Display'; font-size:3.2rem; color:#C5A059;">INKSPIRE</h1>
        <p style="font-size:0.85rem; color:#94A3B8;">August 2026 Edition • PSBSK</p>
      </div>
    ` : `
      <div style="height:100%; display:flex; flex-direction:column; justify-content:space-between;">
        <h2 style="font-family:'Cormorant Garamond'; color:#002B49; font-size:2.2rem;">Editorial Feature ${i}</h2>
        <p style="line-height:1.6; color:#475569; text-align:justify;">Place your publication PDF named "newsletter.pdf" in the root directory to load the digital magazine pages automatically into the interactive flip reader.</p>
        <div style="border-top:1px solid #E2E8F0; padding-top:0.5rem; font-size:0.75rem; color:#94A3B8;">PSBSK INKSPIRE • Page ${i}</div>
      </div>
    `;
    DOM.flipbook.appendChild(pageWrapper);
  }

  initPageFlipEngine();
  DOM.loader.style.opacity = '0';
  setTimeout(() => DOM.loader.classList.add('hidden'), 500);
}