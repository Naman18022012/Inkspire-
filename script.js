/**
 * INKSPIRE DIGITAL MAGAZINE ENGINE
 * Presidency School, Banashankari
 * Fully responsive PDF.js & StPageFlip integration
 */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // CONFIGURATION & GLOBAL STATE
  // ==========================================
  const CONFIG = {
    pdfUrl: 'newsletter.pdf',
    pageWidth: 550,    // Standard single page base width
    pageHeight: 778,   // Standard A4 aspect ratio (1 : 1.414)
    zoomStep: 0.15,
    minZoom: 0.7,
    maxZoom: 2.0
  };

  const STATE = {
    pdfDoc: null,
    totalPages: 0,
    currentPage: 1, // 1-indexed
    pageFlip: null,
    zoomLevel: 1.0,
    pageTextContents: [], // Extracted text per page for search
    isSearching: false,
    isFullscreen: false,
    isFallbackMode: false
  };

  // Configure PDF.js Worker
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  // DOM Elements
  const DOM = {
    // Views
    landingView: document.getElementById('landing-view'),
    readerView: document.getElementById('reader-view'),
    
    // Landing Controls
    btnHeroOpen: document.getElementById('btn-hero-open'),
    btnCoverLaunch: document.getElementById('btn-cover-launch'),
    btnQuickRead: document.getElementById('btn-quick-read'),
    landingCoverCanvas: document.getElementById('landing-cover-canvas'),
    landingCoverContainer: document.getElementById('landing-cover-container'),
    tocItemLinks: document.querySelectorAll('.toc-item-link'),

    // Reader Toolbar Controls
    btnBackLanding: document.getElementById('btn-back-landing'),
    btnPrevPage: document.getElementById('btn-prev-page'),
    btnNextPage: document.getElementById('btn-next-page'),
    pageInput: document.getElementById('page-input'),
    pageTotal: document.getElementById('page-total'),
    btnToggleSearch: document.getElementById('btn-toggle-search'),
    btnToggleToc: document.getElementById('btn-toggle-toc'),
    btnZoomOut: document.getElementById('btn-zoom-out'),
    btnZoomIn: document.getElementById('btn-zoom-in'),
    btnZoomReset: document.getElementById('btn-zoom-reset'),
    zoomPercentage: document.getElementById('zoom-percentage'),
    btnToggleFullscreen: document.getElementById('btn-toggle-fullscreen'),
    iconFullscreen: document.getElementById('icon-fullscreen'),

    // Stage & Flipbook Container
    readerStage: document.getElementById('reader-stage'),
    zoomWrapper: document.getElementById('zoom-wrapper'),
    flipbookContainer: document.getElementById('flipbook-container'),
    flipbook: document.getElementById('flipbook'),

    // Overlays & Modals
    loadingScreen: document.getElementById('loading-screen'),
    loadingStatus: document.getElementById('loading-status'),
    loadingProgress: document.getElementById('loading-progress'),

    searchModal: document.getElementById('search-modal'),
    btnCloseSearch: document.getElementById('btn-close-search'),
    searchQueryInput: document.getElementById('search-query-input'),
    btnExecuteSearch: document.getElementById('btn-execute-search'),
    searchResultsInfo: document.getElementById('search-results-info'),
    searchResultsList: document.getElementById('search-results-list'),

    thumbnailsDrawer: document.getElementById('thumbnails-drawer'),
    btnCloseDrawer: document.getElementById('btn-close-drawer'),
    thumbnailsGrid: document.getElementById('thumbnails-grid')
  };

  // ==========================================
  // INITIALIZATION ENTRY POINT
  // ==========================================
  async function initApplication() {
    setupEventListeners();
    
    updateLoadingProgress(10, 'Fetching INKSPIRE PDF document...');

    try {
      // Attempt to load newsletter.pdf
      const loadingTask = pdfjsLib.getDocument(CONFIG.pdfUrl);
      STATE.pdfDoc = await loadingTask.promise;
      STATE.totalPages = STATE.pdfDoc.numPages;
      STATE.isFallbackMode = false;
      
      updateLoadingProgress(40, `Loaded ${STATE.totalPages} pages. Extracting content...`);
    } catch (error) {
      console.warn('PDF.js could not load newsletter.pdf directly. Activating built-in high-fidelity fallback presentation.', error);
      STATE.isFallbackMode = true;
      STATE.totalPages = 12; // High fidelity 12-page sample issue
    }

    // Render Landing Page Cover Preview
    renderLandingCover();

    // Prepare Reader Pages
    await buildReaderPages();

    // Extract text for search engine
    extractPdfText();

    // Hide Loading Overlay
    updateLoadingProgress(100, 'Ready!');
    setTimeout(() => {
      DOM.loadingScreen.classList.add('hidden');
    }, 400);
  }

  // ==========================================
  // LANDING COVER RENDERER
  // ==========================================
  async function renderLandingCover() {
    const canvas = DOM.landingCoverCanvas;
    if (!canvas) return;

    if (!STATE.isFallbackMode && STATE.pdfDoc) {
      try {
        const page = await STATE.pdfDoc.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
      } catch (e) {
        generateMockPageCanvas(canvas, 1);
      }
    } else {
      generateMockPageCanvas(canvas, 1);
    }
  }

  // ==========================================
  // READER BUILDER & STPAGEFLIP INITIALIZER
  // ==========================================
  async function buildReaderPages() {
    DOM.flipbook.innerHTML = '';
    DOM.flipbook.style.display = 'block';

    // 1. Create DOM structure for each page
    for (let i = 1; i <= STATE.totalPages; i++) {
      const pageDiv = document.createElement('div');
      pageDiv.className = 'page';
      pageDiv.setAttribute('data-page-num', i);

      const contentDiv = document.createElement('div');
      contentDiv.className = 'page-content';

      const canvas = document.createElement('canvas');
      canvas.id = `page-canvas-${i}`;

      contentDiv.appendChild(canvas);
      pageDiv.appendChild(contentDiv);
      DOM.flipbook.appendChild(pageDiv);
    }

    // 2. Render Canvas Contents
    const renderPromises = [];
    for (let i = 1; i <= STATE.totalPages; i++) {
      renderPromises.push(renderSinglePageCanvas(i));
    }
    await Promise.all(renderPromises);

    // 3. Initialize StPageFlip
    initStPageFlip();
  }

  async function renderSinglePageCanvas(pageNum) {
    const canvas = document.getElementById(`page-canvas-${pageNum}`);
    if (!canvas) return;

    if (!STATE.isFallbackMode && STATE.pdfDoc) {
      try {
        const page = await STATE.pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // High-res render
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
      } catch (err) {
        generateMockPageCanvas(canvas, pageNum);
      }
    } else {
      generateMockPageCanvas(canvas, pageNum);
    }
  }

  function initStPageFlip() {
    if (typeof St === 'undefined' || !St.PageFlip) {
      console.error('StPageFlip library not loaded');
      return;
    }

    // Destroy existing instance if present
    if (STATE.pageFlip) {
      try { STATE.pageFlip.destroy(); } catch(e){}
    }

    const isMobile = window.innerWidth <= 768;

    STATE.pageFlip = new St.PageFlip(DOM.flipbook, {
      width: CONFIG.pageWidth,
      height: CONFIG.pageHeight,
      size: 'stretch',
      minWidth: 300,
      maxWidth: 900,
      minHeight: 424,
      maxHeight: 1272,
      maxShadowOpacity: 0.6,
      showCover: true,
      mobileScrollSupport: false,
      usePortrait: isMobile
    });

    const pageElements = DOM.flipbook.querySelectorAll('.page');
    STATE.pageFlip.loadFromHTML(pageElements);

    // Event Listeners for Page Flip updates
    STATE.pageFlip.on('flip', (e) => {
      STATE.currentPage = e.data + 1; // 0-based index converted to 1-based
      updateUIState();
    });

    DOM.pageTotal.textContent = `of ${STATE.totalPages}`;
    updateUIState();
  }

  // ==========================================
  // FALLBACK / PROCEDURAL PAGE GENERATOR
  // ==========================================
  function generateMockPageCanvas(canvas, pageNum) {
    canvas.width = 1200;
    canvas.height = 1697; // A4 ratio
    const ctx = canvas.getContext('2d');

    // Page Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header Border & Banner
    ctx.fillStyle = '#002B66';
    ctx.fillRect(60, 60, canvas.width - 120, 120);

    // Header Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 42px Cinzel, serif';
    ctx.fillText('INKSPIRE DIGITAL MAGAZINE', 90, 125);

    ctx.fillStyle = '#C5A880';
    ctx.font = 'bold 22px Plus Jakarta Sans, sans-serif';
    ctx.fillText(`PRESIDENCY SCHOOL BANASHANKARI • PAGE ${pageNum.toString().padStart(2, '0')}`, 90, 155);

    if (pageNum === 1) {
      // Front Cover Design
      ctx.fillStyle = '#0A192F';
      ctx.fillRect(60, 210, canvas.width - 120, 650);

      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 70px Cinzel, serif';
      ctx.fillText('ANNUAL EDITION', 100, 320);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '32px Merriweather, serif';
      ctx.fillText('Official School Newspaper & Digital Newsletter', 100, 380);

      // Hero Graphic Placeholder
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(100, 430, canvas.width - 200, 380);
      ctx.fillStyle = '#C5A880';
      ctx.font = 'bold 40px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SPORTS DAY & ACADEMIC TRIUMPHS', canvas.width / 2, 630);
      ctx.textAlign = 'left';

      // Editorial Articles Columns
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 36px Cinzel, serif';
      ctx.fillText('HEADLINE: EXCELLENCE IN EDUCATION', 60, 930);

      ctx.fillStyle = '#475569';
      ctx.font = '24px Merriweather, serif';
      ctx.fillText('Presidency School Banashankari continues its proud tradition of holistic', 60, 980);
      ctx.fillText('development, academic rigor, and stellar athletic performance.', 60, 1020);

    } else {
      // Inner Pages Article Layout
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 42px Cinzel, serif';
      ctx.fillText(`SECTION ${pageNum}: FEATURED EDITORIAL & GALLERY`, 60, 240);

      // Two Column Article Lines
      ctx.fillStyle = '#334155';
      ctx.font = '22px Merriweather, serif';
      let y = 300;
      for (let i = 0; i < 15; i++) {
        ctx.fillText(`This is a sample article paragraph text rendering for page ${pageNum} of INKSPIRE.`, 60, y);
        ctx.fillText(`Students, teachers, and school leadership contribute inspiring stories.`, 60, y + 30);
        y += 80;
      }

      // Page Footer
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 20px Plus Jakarta Sans, sans-serif';
      ctx.fillText('PRESIDENCY SCHOOL BANASHANKARI | INKSPIRE 2026', 60, canvas.height - 80);
      ctx.fillText(`PAGE ${pageNum}`, canvas.width - 160, canvas.height - 80);
    }
  }

  // ==========================================
  // NAVIGATION & VIEW SWITCHING LOGIC
  // ==========================================
  function switchView(viewName) {
    if (viewName === 'reader') {
      DOM.landingView.classList.remove('view-active');
      DOM.landingView.classList.add('view-hidden');
      DOM.readerView.classList.remove('view-hidden');
      DOM.readerView.classList.add('view-active');

      if (STATE.pageFlip) {
        STATE.pageFlip.update();
      }
    } else {
      DOM.readerView.classList.remove('view-active');
      DOM.readerView.classList.add('view-hidden');
      DOM.landingView.classList.remove('view-hidden');
      DOM.landingView.classList.add('view-active');
    }
  }

  function goToPage(pageNumber) {
    const target = Math.max(1, Math.min(pageNumber, STATE.totalPages));
    STATE.currentPage = target;
    
    if (STATE.pageFlip) {
      STATE.pageFlip.flip(target - 1); // 0-indexed in StPageFlip
    }
    updateUIState();
  }

  function updateUIState() {
    DOM.pageInput.value = STATE.currentPage;
    DOM.zoomPercentage.textContent = `${Math.round(STATE.zoomLevel * 100)}%`;

    // Highlight active thumbnail
    const thumbs = DOM.thumbnailsGrid.querySelectorAll('.thumb-item');
    thumbs.forEach((thumb, idx) => {
      if (idx + 1 === STATE.currentPage) {
        thumb.classList.add('active');
      } else {
        thumb.classList.remove('active');
      }
    });
  }

  // ==========================================
  // TEXT EXTRACTION & SEARCH ENGINE
  // ==========================================
  async function extractPdfText() {
    STATE.pageTextContents = [];

    if (!STATE.isFallbackMode && STATE.pdfDoc) {
      for (let i = 1; i <= STATE.totalPages; i++) {
        try {
          const page = await STATE.pdfDoc.getPage(i);
          const tokenContent = await page.getTextContent();
          const textString = tokenContent.items.map(item => item.str).join(' ');
          STATE.pageTextContents.push({ pageNum: i, text: textString });
        } catch (e) {
          STATE.pageTextContents.push({ pageNum: i, text: `INKSPIRE Page ${i} Editorial Content Presidency School Banashankari` });
        }
      }
    } else {
      for (let i = 1; i <= STATE.totalPages; i++) {
        STATE.pageTextContents.push({
          pageNum: i,
          text: `INKSPIRE Digital Magazine Page ${i} Presidency School Banashankari Sports Day Academics Principal Article Student Essays Literature Gallery STEM Science`
        });
      }
    }
  }

  function executeSearch(query) {
    const trimmed = query.trim().toLowerCase();
    DOM.searchResultsList.innerHTML = '';

    if (!trimmed) {
      DOM.searchResultsInfo.textContent = 'Please enter a valid keyword to search.';
      return;
    }

    const matches = [];
    STATE.pageTextContents.forEach(item => {
      const idx = item.text.toLowerCase().indexOf(trimmed);
      if (idx !== -1) {
        // Extract snippet context surrounding keyword
        const start = Math.max(0, idx - 40);
        const end = Math.min(item.text.length, idx + 80);
        const snippet = item.text.substring(start, end);
        matches.push({ pageNum: item.pageNum, snippet: snippet });
      }
    });

    if (matches.length === 0) {
      DOM.searchResultsInfo.textContent = `No results found for "${query}". Try keywords like "Sports", "Science", or "Editorial".`;
      return;
    }

    DOM.searchResultsInfo.textContent = `Found ${matches.length} result(s) for "${query}":`;

    matches.forEach(match => {
      const card = document.createElement('div');
      card.className = 'search-result-card';

      // Highlight keyword in snippet
      const reg = new RegExp(`(${trimmed})`, 'gi');
      const highlightedSnippet = match.snippet.replace(reg, '<mark>$1</mark>');

      card.innerHTML = `
        <div class="result-header">
          <span class="result-page-badge">PAGE ${match.pageNum}</span>
        </div>
        <div class="result-snippet">"...${highlightedSnippet}..."</div>
      `;

      card.addEventListener('click', () => {
        goToPage(match.pageNum);
        closeSearchModal();
        switchView('reader');
      });

      DOM.searchResultsList.appendChild(card);
    });
  }

  // ==========================================
  // THUMBNAILS DRAWER GENERATOR
  // ==========================================
  async function generateThumbnails() {
    DOM.thumbnailsGrid.innerHTML = '';

    for (let i = 1; i <= STATE.totalPages; i++) {
      const thumbItem = document.createElement('div');
      thumbItem.className = `thumb-item ${i === STATE.currentPage ? 'active' : ''}`;

      const wrapper = document.createElement('div');
      wrapper.className = 'thumb-canvas-wrapper';

      const canvas = document.createElement('canvas');
      wrapper.appendChild(canvas);

      const label = document.createElement('span');
      label.className = 'thumb-page-label';
      label.textContent = `Page ${i}`;

      thumbItem.appendChild(wrapper);
      thumbItem.appendChild(label);

      thumbItem.addEventListener('click', () => {
        goToPage(i);
        closeThumbnailsDrawer();
      });

      DOM.thumbnailsGrid.appendChild(thumbItem);

      // Render thumbnail canvas
      renderThumbnailCanvas(canvas, i);
    }
  }

  async function renderThumbnailCanvas(canvas, pageNum) {
    if (!STATE.isFallbackMode && STATE.pdfDoc) {
      try {
        const page = await STATE.pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 0.25 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
      } catch (e) {
        generateMockPageCanvas(canvas, pageNum);
      }
    } else {
      generateMockPageCanvas(canvas, pageNum);
    }
  }

  // ==========================================
  // ZOOM & FULLSCREEN ENGINE
  // ==========================================
  function setZoom(newZoom) {
    STATE.zoomLevel = Math.max(CONFIG.minZoom, Math.min(CONFIG.maxZoom, newZoom));
    DOM.zoomWrapper.style.transform = `scale(${STATE.zoomLevel})`;
    DOM.zoomPercentage.textContent = `${Math.round(STATE.zoomLevel * 100)}%`;
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        STATE.isFullscreen = true;
        DOM.iconFullscreen.className = 'fa-solid fa-compress';
      }).catch(err => {
        console.warn('Fullscreen mode request rejected', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          STATE.isFullscreen = false;
          DOM.iconFullscreen.className = 'fa-solid fa-expand';
        });
      }
    }
  }

  // ==========================================
  // MODAL CONTROL FUNCTIONS
  // ==========================================
  function openSearchModal() {
    DOM.searchModal.classList.remove('modal-hidden');
    DOM.searchQueryInput.focus();
  }

  function closeSearchModal() {
    DOM.searchModal.classList.add('modal-hidden');
  }

  function openThumbnailsDrawer() {
    generateThumbnails();
    DOM.thumbnailsDrawer.classList.remove('drawer-hidden');
  }

  function closeThumbnailsDrawer() {
    DOM.thumbnailsDrawer.classList.add('drawer-hidden');
  }

  function updateLoadingProgress(percent, statusText) {
    DOM.loadingProgress.style.width = `${percent}%`;
    DOM.loadingStatus.textContent = statusText;
  }

  // ==========================================
  // EVENT LISTENERS SETUP
  // ==========================================
  function setupEventListeners() {
    
    // Launch Reader Controls
    DOM.btnHeroOpen.addEventListener('click', () => switchView('reader'));
    DOM.btnCoverLaunch.addEventListener('click', () => switchView('reader'));
    DOM.btnQuickRead.addEventListener('click', () => switchView('reader'));
    DOM.btnBackLanding.addEventListener('click', () => switchView('landing'));

    // TOC Direct Links from Landing Page
    DOM.tocItemLinks.forEach(link => {
      link.addEventListener('click', () => {
        const pageNum = parseInt(link.getAttribute('data-page'), 10);
        switchView('reader');
        goToPage(pageNum);
      });
    });

    // Flipbook Navigation Buttons
    DOM.btnPrevPage.addEventListener('click', () => {
      if (STATE.pageFlip) STATE.pageFlip.flipPrev();
    });

    DOM.btnNextPage.addEventListener('click', () => {
      if (STATE.pageFlip) STATE.pageFlip.flipNext();
    });

    // Jump to Page Input
    DOM.pageInput.addEventListener('change', (e) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val)) {
        goToPage(val);
      }
    });

    // Keyboard Arrow Controls
    document.addEventListener('keydown', (e) => {
      if (!DOM.readerView.classList.contains('view-active')) return;
      if (document.activeElement.tagName === 'INPUT') return;

      if (e.key === 'ArrowLeft') {
        if (STATE.pageFlip) STATE.pageFlip.flipPrev();
      } else if (e.key === 'ArrowRight') {
        if (STATE.pageFlip) STATE.pageFlip.flipNext();
      } else if (e.key === 'Escape') {
        closeSearchModal();
        closeThumbnailsDrawer();
      }
    });

    // Zoom Buttons
    DOM.btnZoomIn.addEventListener('click', () => setZoom(STATE.zoomLevel + CONFIG.zoomStep));
    DOM.btnZoomOut.addEventListener('click', () => setZoom(STATE.zoomLevel - CONFIG.zoomStep));
    DOM.btnZoomReset.addEventListener('click', () => setZoom(1.0));

    // Fullscreen Toggle
    DOM.btnToggleFullscreen.addEventListener('click', toggleFullscreen);

    // Search Controls
    DOM.btnToggleSearch.addEventListener('click', openSearchModal);
    DOM.btnCloseSearch.addEventListener('click', closeSearchModal);
    DOM.btnExecuteSearch.addEventListener('click', () => executeSearch(DOM.searchQueryInput.value));
    DOM.searchQueryInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') executeSearch(DOM.searchQueryInput.value);
    });

    // Thumbnails / TOC Controls
    DOM.btnToggleToc.addEventListener('click', openThumbnailsDrawer);
    DOM.btnCloseDrawer.addEventListener('click', closeThumbnailsDrawer);

    // Window Resize Handling
    window.addEventListener('resize', () => {
      if (STATE.pageFlip) {
        STATE.pageFlip.update();
      }
    });
  }

  // Run Application
  initApplication();

});