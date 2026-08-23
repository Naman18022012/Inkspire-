/**
 * INKSPIRE - High-Performance Digital Magazine Reader Engine
 * Architecture: PDF.js -> Page Rendering -> St.PageFlip
 */

// Configure PDF.js Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Application State
const STATE = {
  pdfUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf', // Fallback working sample PDF URL
  pdfDoc: null,
  pageFlip: null,
  totalPages: 0,
  currentPage: 1,
  textIndex: [], // Index for client-side full-text search
  isZoomed: false
};

// DOM References
const DOM = {
  loader: document.getElementById('app-loader'),
  progressBar: document.getElementById('loader-progress-bar'),
  statusText: document.getElementById('loader-status'),
  flipbook: document.getElementById('flipbook'),
  stageViewport: document.getElementById('stage-viewport'),
  inputPageNum: document.getElementById('input-page-num'),
  lblTotalPages: document.getElementById('lbl-total-pages'),
  btnPrev: document.getElementById('btn-prev-page'),
  btnNext: document.getElementById('btn-next-page'),
  tocOverlay: document.getElementById('toc-overlay'),
  searchOverlay: document.getElementById('search-overlay'),
  thumbnailGrid: document.getElementById('thumbnail-grid'),
  searchQueryInput: document.getElementById('search-query-input'),
  searchResultsList: document.getElementById('search-results-list')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initMagazineReader();
    setupEventListeners();
  } catch (error) {
    console.error('Initialization error:', error);
    updateLoader(100, 'Error loading document. Loading procedural pages...');
    setTimeout(initProceduralFallback, 1000);
  }
});

// 1. PDF PIPELINE & PAGEFLIP INITIALIZATION
async function initMagazineReader() {
  updateLoader(15, 'Fetching publication document...');
  
  // Load PDF Document
  const loadingTask = pdfjsLib.getDocument(STATE.pdfUrl);
  loadingTask.onProgress = (progress) => {
    if (progress.total > 0) {
      const percent = Math.round((progress.loaded / progress.total) * 40) + 15;
      updateLoader(percent, 'Downloading PDF publication...');
    }
  };

  STATE.pdfDoc = await loadingTask.promise;
  STATE.totalPages = STATE.pdfDoc.numPages;
  DOM.lblTotalPages.textContent = `of ${STATE.totalPages}`;
  DOM.inputPageNum.max = STATE.totalPages;

  updateLoader(60, 'Rendering high-resolution pages...');
  
  // Calculate optimal canvas dimensions based on viewport
  const firstPage = await STATE.pdfDoc.getPage(1);
  const viewport = firstPage.getViewport({ scale: 1.0 });
  const aspectRatio = viewport.width / viewport.height;
  
  const targetHeight = Math.min(window.innerHeight - 100, 900);
  const targetWidth = Math.round(targetHeight * aspectRatio);

  // Render pages to DOM elements
  DOM.flipbook.innerHTML = '';
  for (let pageNum = 1; pageNum <= STATE.totalPages; pageNum++) {
    const pageDiv = document.createElement('div');
    pageDiv.className = 'page';
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // DPR scaling for razor-sharp typography
    const dpr = window.devicePixelRatio || 1;
    const pageObj = await STATE.pdfDoc.getPage(pageNum);
    const pageViewport = pageObj.getViewport({ scale: (targetHeight / pageObj.getViewport({ scale: 1 }).height) * dpr });

    canvas.width = pageViewport.width;
    canvas.height = pageViewport.height;

    await pageObj.render({ canvasContext: context, viewport: pageViewport }).promise;
    pageDiv.appendChild(canvas);
    DOM.flipbook.appendChild(pageDiv);

    // Build Search Text Index asynchronously
    indexPageText(pageObj, pageNum);
    
    const progressPercent = 60 + Math.round((pageNum / STATE.totalPages) * 30);
    updateLoader(progressPercent, `Rendering page ${pageNum} of ${STATE.totalPages}...`);
  }

  updateLoader(95, 'Initializing 3D Flipbook engine...');

  // Initialize St.PageFlip
  STATE.pageFlip = new window.St.PageFlip(DOM.flipbook, {
    width: targetWidth,
    height: targetHeight,
    size: 'stretch',
    minWidth: 280,
    maxWidth: 1000,
    minHeight: 400,
    maxHeight: 1200,
    drawShadow: true,
    showCover: true,
    usePortrait: true,
    maxShadowOpacity: 0.6,
    mobileScrollSupport: false
  });

  STATE.pageFlip.loadFromHTML(document.querySelectorAll('#flipbook .page'));

  // Sync state on flip events
  STATE.pageFlip.on('flip', (e) => {
    STATE.currentPage = e.data + 1;
    DOM.inputPageNum.value = STATE.currentPage;
  });

  // Generate background thumbnails for TOC
  generateThumbnails(targetWidth, targetHeight);

  updateLoader(100, 'Complete');
  setTimeout(() => {
    DOM.loader.style.opacity = '0';
    DOM.loader.style.visibility = 'hidden';
  }, 400);
}

// 2. TEXT INDEXING & SEARCH SYSTEM
async function indexPageText(pageObj, pageNum) {
  const textContent = await pageObj.getTextContent();
  const textString = textContent.items.map(item => item.str).join(' ');
  STATE.textIndex.push({ pageNum, text: textString });
}

function performSearch(query) {
  if (!query.trim()) {
    DOM.searchResultsList.innerHTML = '<div class="search-placeholder">Enter text above to search through all rendered PDF pages.</div>';
    return;
  }

  const matches = STATE.textIndex.filter(item => item.text.toLowerCase().includes(query.toLowerCase()));

  if (matches.length === 0) {
    DOM.searchResultsList.innerHTML = '<div class="search-placeholder">No matching text found in this issue.</div>';
    return;
  }

  DOM.searchResultsList.innerHTML = matches.map(m => {
    const idx = m.text.toLowerCase().indexOf(query.toLowerCase());
    const start = Math.max(0, idx - 40);
    const end = Math.min(m.text.length, idx + 60);
    const snippet = m.text.substring(start, end).replace(new RegExp(query, 'gi'), match => `<strong style="color:var(--color-accent-gold);">${match}</strong>`);

    return `
      <div class="search-result-item" onclick="jumpToPage(${m.pageNum})">
        <span class="result-page-badge">Page ${m.pageNum}</span>
        <p class="result-snippet">"...${snippet}..."</p>
      </div>
    `;
  }).join('');
}

// 3. THUMBNAILS GENERATOR
async function generateThumbnails() {
  DOM.thumbnailGrid.innerHTML = '';
  for (let pageNum = 1; pageNum <= STATE.totalPages; pageNum++) {
    const pageObj = await STATE.pdfDoc.getPage(pageNum);
    const viewport = pageObj.getViewport({ scale: 0.25 });

    const thumbItem = document.createElement('div');
    thumbItem.className = 'thumb-item';
    thumbItem.onclick = () => jumpToPage(pageNum);

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await pageObj.render({ canvasContext: context, viewport: viewport }).promise;

    const label = document.createElement('span');
    label.textContent = `Page ${pageNum}`;

    thumbItem.appendChild(canvas);
    thumbItem.appendChild(label);
    DOM.thumbnailGrid.appendChild(thumbItem);
  }
}

// 4. NAVIGATION & CONTROLS
function jumpToPage(pageNum) {
  if (!STATE.pageFlip) return;
  const targetIndex = Math.max(0, Math.min(pageNum - 1, STATE.totalPages - 1));
  STATE.pageFlip.turnToPage(targetIndex);
  closeOverlays();
}

function setupEventListeners() {
  // Flipbook Controls
  DOM.btnPrev.addEventListener('click', () => STATE.pageFlip && STATE.pageFlip.flipPrev());
  DOM.btnNext.addEventListener('click', () => STATE.pageFlip && STATE.pageFlip.flipNext());

  DOM.inputPageNum.addEventListener('change', (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) jumpToPage(val);
  });

  // Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') STATE.pageFlip && STATE.pageFlip.flipPrev();
    if (e.key === 'ArrowRight') STATE.pageFlip && STATE.pageFlip.flipNext();
    if (e.key === 'Escape') closeOverlays();
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      toggleOverlay(DOM.searchOverlay);
    }
  });

  // UI Overlays
  document.getElementById('btn-toc-toggle').addEventListener('click', () => toggleOverlay(DOM.tocOverlay));
  document.getElementById('btn-close-toc').addEventListener('click', closeOverlays);

  document.getElementById('btn-search-toggle').addEventListener('click', () => toggleOverlay(DOM.searchOverlay));
  document.getElementById('btn-close-search').addEventListener('click', closeOverlays);

  DOM.searchQueryInput.addEventListener('input', (e) => performSearch(e.target.value));

  // Zoom & Fullscreen
  document.getElementById('btn-zoom-toggle').addEventListener('click', () => {
    STATE.isZoomed = !STATE.isZoomed;
    DOM.stageViewport.classList.toggle('zoomed', STATE.isZoomed);
  });

  document.getElementById('btn-fullscreen-toggle').addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  });
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

function updateLoader(percent, statusText) {
  if (DOM.progressBar) DOM.progressBar.style.width = percent + '%';
  if (DOM.statusText) DOM.statusText.textContent = statusText;
}

// Fallback generator in case of network/PDF CORS block
function initProceduralFallback() {
  STATE.totalPages = 6;
  DOM.lblTotalPages.textContent = `of ${STATE.totalPages}`;
  DOM.flipbook.innerHTML = '';

  for (let i = 1; i <= 6; i++) {
    const pageDiv = document.createElement('div');
    pageDiv.className = 'page';
    pageDiv.style.padding = '3rem';
    pageDiv.style.background = i === 1 ? '#001224' : '#FFFFFF';
    pageDiv.style.color = i === 1 ? '#FFFFFF' : '#1E293B';

    pageDiv.innerHTML = i === 1 ? `
      <div style="height:100%; display:flex; flex-direction:column; justify-content:space-between; border:2px solid #C5A059; padding:2rem;">
        <h1 style="font-family:'Playfair Display'; font-size:3rem; color:#C5A059;">INKSPIRE</h1>
        <p style="font-size:1.2rem;">Presidency School Banashankari Digital Edition</p>
        <p style="font-size:0.8rem; opacity:0.7;">Drag corners or use arrow keys to flip pages</p>
      </div>
    ` : `
      <div style="height:100%; display:flex; flex-direction:column; justify-content:space-between;">
        <h2 style="font-family:'Playfair Display'; color:#002B49;">Publication Article Page ${i}</h2>
        <p style="line-height:1.8; text-align:justify;">Welcome to the interactive reader for INKSPIRE. This publication features high-resolution PDF rendering combined with real physical page turning mechanics.</p>
        <div style="border-top:1px solid #DDD; padding-top:1rem; font-size:0.8rem; color:#666;">Page ${i}</div>
      </div>
    `;
    DOM.flipbook.appendChild(pageDiv);
  }

  STATE.pageFlip = new window.St.PageFlip(DOM.flipbook, {
    width: 500,
    height: 700,
    size: 'stretch',
    showCover: true
  });
  STATE.pageFlip.loadFromHTML(document.querySelectorAll('#flipbook .page'));
  DOM.loader.style.opacity = '0';
  DOM.loader.style.visibility = 'hidden';
}