/**
 * INKSPIRE DIGITAL MAGAZINE SYSTEM
 * Publication: INKSPIRE
 * School: Presidency School, Banashankari
 * Pure Static Client Architecture using PDF.js + StPageFlip
 */

// Configure PDF.js Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Application State
const AppState = {
    pdfPath: 'newsletter.pdf',
    pdfDoc: null,
    totalPages: 0,
    currentPage: 1, // 1-based page index
    pageFlip: null,
    zoomLevel: 1.0,
    textCache: {}, // { pageNum: string }
    renderedThumbnails: new Set(),
    isSinglePageMode: false
};

// DOM Element Registry
const DOM = {};

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
    cacheDOMElements();
    initEventListeners();
    loadPDF(AppState.pdfPath);
});

/**
 * Cache necessary DOM nodes
 */
function cacheDOMElements() {
    DOM.loadingScreen = document.getElementById('loading-screen');
    DOM.progressBar = document.getElementById('progress-bar');
    DOM.loadingStatus = document.getElementById('loading-status');
    DOM.loadingError = document.getElementById('loading-error');
    DOM.errorMessage = document.getElementById('error-message');
    DOM.btnRetryLoad = document.getElementById('btn-retry-load');
    DOM.pdfFileInput = document.getElementById('pdf-file-input');

    DOM.landingPage = document.getElementById('landing-page');
    DOM.mastheadTotalPages = document.getElementById('masthead-total-pages');
    DOM.coverCanvas = document.getElementById('cover-canvas');
    DOM.btnOpenIssue = document.getElementById('btn-open-issue');
    DOM.openIssueTrigger = document.getElementById('open-issue-trigger');
    DOM.btnViewTocLanding = document.getElementById('btn-view-toc-landing');

    DOM.readerView = document.getElementById('reader-view');
    DOM.btnBackLanding = document.getElementById('btn-back-landing');
    DOM.btnPrevPage = document.getElementById('btn-prev-page');
    DOM.btnNextPage = document.getElementById('btn-next-page');
    DOM.pageInput = document.getElementById('page-input');
    DOM.totalPagesCount = document.getElementById('total-pages-count');

    DOM.btnToggleSearch = document.getElementById('btn-toggle-search');
    DOM.btnToggleToc = document.getElementById('btn-toggle-toc');
    DOM.btnZoomOut = document.getElementById('btn-zoom-out');
    DOM.btnZoomIn = document.getElementById('btn-zoom-in');
    DOM.btnZoomReset = document.getElementById('btn-zoom-reset');
    DOM.zoomPercentage = document.getElementById('zoom-percentage');
    DOM.btnFullscreen = document.getElementById('btn-fullscreen');

    DOM.readerViewport = document.getElementById('reader-viewport');
    DOM.bookWrapper = document.getElementById('book-wrapper');
    DOM.flipbook = document.getElementById('flipbook');
    DOM.floatingPrev = document.getElementById('floating-prev');
    DOM.floatingNext = document.getElementById('floating-next');

    DOM.searchModal = document.getElementById('search-modal');
    DOM.btnCloseSearch = document.getElementById('btn-close-search');
    DOM.searchInput = document.getElementById('search-input');
    DOM.btnClearSearch = document.getElementById('btn-clear-search');
    DOM.searchResultsInfo = document.getElementById('search-results-info');
    DOM.searchResultsList = document.getElementById('search-results-list');

    DOM.tocOverlay = document.getElementById('toc-overlay');
    DOM.btnCloseToc = document.getElementById('btn-close-toc');
    DOM.tocGrid = document.getElementById('toc-grid');
}

/**
 * Bind DOM Event Listeners
 */
function initEventListeners() {
    // Open / Close Views
    DOM.btnOpenIssue.addEventListener('click', openReaderView);
    DOM.openIssueTrigger.addEventListener('click', openReaderView);
    DOM.btnBackLanding.addEventListener('click', closeReaderView);
    DOM.btnViewTocLanding.addEventListener('click', () => {
        openReaderView();
        openTocOverlay();
    });

    // Navigation Controls
    DOM.btnPrevPage.addEventListener('click', () => AppState.pageFlip && AppState.pageFlip.flipPrev());
    DOM.btnNextPage.addEventListener('click', () => AppState.pageFlip && AppState.pageFlip.flipNext());
    DOM.floatingPrev.addEventListener('click', () => AppState.pageFlip && AppState.pageFlip.flipPrev());
    DOM.floatingNext.addEventListener('click', () => AppState.pageFlip && AppState.pageFlip.flipNext());

    DOM.pageInput.addEventListener('change', (e) => {
        let pageNum = parseInt(e.target.value, 10);
        if (isNaN(pageNum)) return;
        pageNum = Math.max(1, Math.min(pageNum, AppState.totalPages));
        jumpToPage(pageNum);
    });

    // Zoom Controls
    DOM.btnZoomIn.addEventListener('click', () => adjustZoom(0.15));
    DOM.btnZoomOut.addEventListener('click', () => adjustZoom(-0.15));
    DOM.btnZoomReset.addEventListener('click', () => setZoom(1.0));

    // Fullscreen Toggle
    DOM.btnFullscreen.addEventListener('click', toggleFullscreen);

    // Search Controls
    DOM.btnToggleSearch.addEventListener('click', openSearchModal);
    DOM.btnCloseSearch.addEventListener('click', closeSearchModal);
    DOM.btnClearSearch.addEventListener('click', () => {
        DOM.searchInput.value = '';
        DOM.btnClearSearch.classList.add('hidden');
        performSearch('');
    });
    DOM.searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query.length > 0) {
            DOM.btnClearSearch.classList.remove('hidden');
        } else {
            DOM.btnClearSearch.classList.add('hidden');
        }
        performSearch(query);
    });

    // TOC Controls
    DOM.btnToggleToc.addEventListener('click', openTocOverlay);
    DOM.btnCloseToc.addEventListener('click', closeTocOverlay);

    // Keydown Controls
    document.addEventListener('keydown', (e) => {
        if (!DOM.readerView.classList.contains('hidden')) {
            if (e.key === 'ArrowLeft') AppState.pageFlip && AppState.pageFlip.flipPrev();
            if (e.key === 'ArrowRight') AppState.pageFlip && AppState.pageFlip.flipNext();
            if (e.key === 'Escape') {
                closeSearchModal();
                closeTocOverlay();
            }
        }
    });

    // File input fallback
    DOM.pdfFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            const fileURL = URL.createObjectURL(file);
            loadPDF(fileURL);
        }
    });

    DOM.btnRetryLoad.addEventListener('click', () => loadPDF(AppState.pdfPath));

    // Window Resize Handling
    window.addEventListener('resize', handleWindowResize);
}

/**
 * Load PDF File
 */
async function loadPDF(source) {
    showLoadingState();
    updateProgress(10, "Fetching document...");

    try {
        const loadingTask = pdfjsLib.getDocument(source);
        
        loadingTask.onProgress = (progressData) => {
            if (progressData.total > 0) {
                const percent = Math.round((progressData.loaded / progressData.total) * 60);
                updateProgress(10 + percent, `Downloading newsletter... (${percent}%)`);
            }
        };

        AppState.pdfDoc = await loadingTask.promise;
        AppState.totalPages = AppState.pdfDoc.numPages;
        
        updateProgress(75, "Rendering cover page...");
        
        // Render Cover Page for Landing
        await renderCoverPage();

        // Populate Landing & UI Metadata
        DOM.totalPagesCount.textContent = AppState.totalPages;
        DOM.pageInput.max = AppState.totalPages;
        DOM.mastheadTotalPages.innerHTML = `<i class="fa-solid fa-layer-group"></i> ${AppState.totalPages} Pages Edition`;

        updateProgress(90, "Setting up interactive flipbook...");
        
        // Build Flipbook Elements
        await buildFlipbookStructure();

        updateProgress(100, "Ready!");
        setTimeout(() => hideLoadingState(), 400);

        // Pre-cache text in background
        cachePDFText();

    } catch (error) {
        console.error("Error loading PDF:", error);
        showLoadingError("Could not load 'newsletter.pdf'. Make sure the file exists in the directory or select a local PDF.");
    }
}

/**
 * Progress & Loading Screen Utilities
 */
function updateProgress(percentage, statusText) {
    DOM.progressBar.style.width = `${percentage}%`;
    if (statusText) DOM.loadingStatus.textContent = statusText;
}

function showLoadingState() {
    DOM.loadingScreen.classList.remove('hidden');
    DOM.loadingError.classList.add('hidden');
    DOM.progressBar.style.width = '0%';
}

function hideLoadingState() {
    DOM.loadingScreen.classList.add('hidden');
}

function showLoadingError(msg) {
    DOM.loadingError.classList.remove('hidden');
    DOM.errorMessage.textContent = msg;
    DOM.loadingStatus.textContent = "Loading failed.";
}

/**
 * Render Front Cover Canvas
 */
async function renderCoverPage() {
    const page = await AppState.pdfDoc.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = DOM.coverCanvas;
    const context = canvas.getContext('2d');

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
        canvasContext: context,
        viewport: viewport
    };

    await page.render(renderContext).promise;
}

/**
 * Build Page-Flip HTML Structure & Initialize StPageFlip
 */
async function buildFlipbookStructure() {
    DOM.flipbook.innerHTML = '';
    
    // Check viewport width to determine layout mode
    AppState.isSinglePageMode = window.innerWidth <= 768;

    // First page (Cover)
    const page1 = await AppState.pdfDoc.getPage(1);
    const aspect = page1.getViewport({ scale: 1.0 });
    
    // Calculate page dimension bounds
    const availableHeight = window.innerHeight - 80;
    const calcHeight = Math.min(availableHeight, 900);
    const calcWidth = Math.round(calcHeight * (aspect.width / aspect.height));

    for (let i = 1; i <= AppState.totalPages; i++) {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page';
        pageDiv.dataset.density = (i === 1 || i === AppState.totalPages) ? 'hard' : 'soft';
        
        const canvas = document.createElement('canvas');
        canvas.id = `page-canvas-${i}`;
        pageDiv.appendChild(canvas);
        DOM.flipbook.appendChild(pageDiv);
    }

    // Destroy existing instance if any
    if (AppState.pageFlip) {
        AppState.pageFlip.destroy();
    }

    // Instantiate StPageFlip
    AppState.pageFlip = new St.PageFlip(DOM.flipbook, {
        width: calcWidth,
        height: calcHeight,
        size: 'stretch',
        minWidth: 280,
        maxWidth: 1000,
        minHeight: 400,
        maxHeight: 1400,
        maxShadowOpacity: 0.4,
        showCover: true,
        mobileScrollSupport: false
    });

    AppState.pageFlip.loadFromHTML(document.querySelectorAll('.page'));

    // Bind PageFlip State Change
    AppState.pageFlip.on('flip', (e) => {
        AppState.currentPage = e.data + 1;
        DOM.pageInput.value = AppState.currentPage;
        renderVisiblePages();
    });

    // Render initial set of pages
    await renderVisiblePages();
}

/**
 * Render PDF Pages onto Canvases
 */
async function renderVisiblePages() {
    if (!AppState.pdfDoc) return;

    // Render current page, previous, and next pages for smooth flipping
    const current = AppState.currentPage;
    const pagesToRender = [current - 1, current, current + 1, current + 2]
        .filter(p => p >= 1 && p <= AppState.totalPages);

    for (const pageNum of pagesToRender) {
        const canvas = document.getElementById(`page-canvas-${pageNum}`);
        if (!canvas || canvas.dataset.rendered === 'true') continue;

        try {
            const page = await AppState.pdfDoc.getPage(pageNum);
            const scale = 2.0; // High DPI crisp rendering
            const viewport = page.getViewport({ scale: scale });
            const context = canvas.getContext('2d');

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            canvas.dataset.rendered = 'true';
        } catch (err) {
            console.error(`Error rendering page ${pageNum}:`, err);
        }
    }
}

/**
 * Navigation Utility: Jump to specific page
 */
function jumpToPage(pageNum) {
    if (!AppState.pageFlip) return;
    const targetIdx = pageNum - 1;
    AppState.pageFlip.turnToPage(targetIdx);
}

/**
 * View Switches
 */
function openReaderView() {
    DOM.landingPage.classList.add('hidden');
    DOM.readerView.classList.remove('hidden');
    
    if (AppState.pageFlip) {
        AppState.pageFlip.update();
        renderVisiblePages();
    }
}

function closeReaderView() {
    DOM.readerView.classList.add('hidden');
    DOM.landingPage.classList.remove('hidden');
}

/**
 * Zoom Capabilities
 */
function adjustZoom(delta) {
    setZoom(AppState.zoomLevel + delta);
}

function setZoom(level) {
    AppState.zoomLevel = Math.max(0.7, Math.min(level, 2.2));
    DOM.zoomPercentage.textContent = `${Math.round(AppState.zoomLevel * 100)}%`;
    DOM.bookWrapper.style.transform = `scale(${AppState.zoomLevel})`;
}

/**
 * Fullscreen Handling
 */
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting fullscreen: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

/**
 * Search Engine: Background Text Extraction
 */
async function cachePDFText() {
    for (let i = 1; i <= AppState.totalPages; i++) {
        try {
            const page = await AppState.pdfDoc.getPage(i);
            const tokenContent = await page.getTextContent();
            const textString = tokenContent.items.map(item => item.str).join(' ');
            AppState.textCache[i] = textString;
        } catch (e) {
            console.warn(`Failed to extract text for page ${i}`);
        }
    }
}

function openSearchModal() {
    DOM.searchModal.classList.remove('hidden');
    DOM.searchInput.focus();
}

function closeSearchModal() {
    DOM.searchModal.classList.add('hidden');
}

function performSearch(query) {
    DOM.searchResultsList.innerHTML = '';
    
    if (!query || query.length < 2) {
        DOM.searchResultsInfo.textContent = "Enter keyword to search text across all pages.";
        return;
    }

    const matches = [];
    const lowerQuery = query.toLowerCase();

    for (let pageNum = 1; pageNum <= AppState.totalPages; pageNum++) {
        const pageText = AppState.textCache[pageNum] || '';
        const lowerText = pageText.toLowerCase();
        const matchIndex = lowerText.indexOf(lowerQuery);

        if (matchIndex !== -1) {
            // Extract snippet context
            const start = Math.max(0, matchIndex - 40);
            const end = Math.min(pageText.length, matchIndex + query.length + 50);
            let snippet = pageText.substring(start, end);

            // Highlight query
            const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
            snippet = snippet.replace(regex, '<mark>$1</mark>');

            matches.push({
                pageNum: pageNum,
                snippet: `...${snippet}...`
            });
        }
    }

    DOM.searchResultsInfo.textContent = `Found ${matches.length} result(s) for "${query}"`;

    if (matches.length === 0) {
        DOM.searchResultsList.innerHTML = `<div class="search-result-item"><p class="result-snippet">No matching text found.</p></div>`;
        return;
    }

    matches.forEach(m => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML = `
            <div class="result-page-num">Page ${m.pageNum}</div>
            <div class="result-snippet">${m.snippet}</div>
        `;
        item.addEventListener('click', () => {
            jumpToPage(m.pageNum);
            closeSearchModal();
        });
        DOM.searchResultsList.appendChild(item);
    });
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Table of Contents & Thumbnails Grid
 */
function openTocOverlay() {
    DOM.tocOverlay.classList.remove('hidden');
    renderTocThumbnails();
}

function closeTocOverlay() {
    DOM.tocOverlay.classList.add('hidden');
}

async function renderTocThumbnails() {
    if (AppState.renderedThumbnails.size >= AppState.totalPages) return;

    DOM.tocGrid.innerHTML = '';

    for (let i = 1; i <= AppState.totalPages; i++) {
        const item = document.createElement('div');
        item.className = 'toc-item';
        
        const thumbContainer = document.createElement('div');
        thumbContainer.className = 'toc-thumb-container';

        const canvas = document.createElement('canvas');
        canvas.id = `toc-canvas-${i}`;
        thumbContainer.appendChild(canvas);

        const caption = document.createElement('div');
        caption.className = 'toc-caption';
        caption.textContent = `Page ${i}`;

        item.appendChild(thumbContainer);
        item.appendChild(caption);

        item.addEventListener('click', () => {
            jumpToPage(i);
            closeTocOverlay();
        });

        DOM.tocGrid.appendChild(item);

        // Render Thumbnail asynchronously
        renderThumbnailCanvas(i, canvas);
    }
}

async function renderThumbnailCanvas(pageNum, canvas) {
    try {
        const page = await AppState.pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 0.3 });
        const context = canvas.getContext('2d');

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;

        AppState.renderedThumbnails.add(pageNum);
    } catch (e) {
        console.warn(`Failed to render thumbnail for page ${pageNum}`);
    }
}

/**
 * Window Resize Debounce Handler
 */
let resizeTimeout;
function handleWindowResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (AppState.pageFlip && !DOM.readerView.classList.contains('hidden')) {
            buildFlipbookStructure();
        }
    }, 300);
}