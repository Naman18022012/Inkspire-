/**
 * INKSPIRE - OFFICIAL DIGITAL SCHOOL MAGAZINE ENGINE
 * Presidency School, Banashankari
 * 
 * Powered by PDF.js and StPageFlip
 */

document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // 1. APPLICATION STATE & CONFIGURATION
    // =========================================================================
    const CONFIG = {
        pdfPath: 'newsletter.pdf', // Default PDF file
        pageScale: 2.0,            // Rendering scale for crisp PDF text
        thumbScale: 0.3           // Scale for grid thumbnails
    };

    const state = {
        pdfDoc: null,
        totalPages: 0,
        currentPage: 1,
        pageFlip: null,
        renderedPages: [],
        pageTexts: [], // For local search indexing
        zoomLevel: 1.0,
        isFullscreen: false
    };

    // DOM Elements
    const elements = {
        loadingScreen: document.getElementById('loading-screen'),
        loaderProgress: document.getElementById('loader-progress'),
        loaderStatus: document.getElementById('loader-status'),
        
        landingView: document.getElementById('landing-view'),
        landingCoverContainer: document.getElementById('landing-cover-container'),
        infoPageCount: document.getElementById('info-page-count'),
        btnOpenReader: document.getElementById('btn-open-reader'),
        coverFrameClick: document.getElementById('cover-frame-click'),
        btnOpenTocLanding: document.getElementById('btn-open-toc-landing'),

        readerView: document.getElementById('reader-view'),
        readerStage: document.getElementById('reader-stage'),
        flipbookViewport: document.getElementById('flipbook-viewport'),
        flipbookContainer: document.getElementById('flipbook-container'),
        
        btnExitReader: document.getElementById('btn-exit-reader'),
        btnFirstPage: document.getElementById('btn-first-page'),
        btnPrevPage: document.getElementById('btn-prev-page'),
        btnNextPage: document.getElementById('btn-next-page'),
        btnLastPage: document.getElementById('btn-last-page'),
        inputPageNum: document.getElementById('input-page-num'),
        labelTotalPages: document.getElementById('label-total-pages'),

        btnToggleSearch: document.getElementById('btn-toggle-search'),
        btnToggleToc: document.getElementById('btn-toggle-toc'),
        btnZoomOut: document.getElementById('btn-zoom-out'),
        btnZoomIn: document.getElementById('btn-zoom-in'),
        btnZoomReset: document.getElementById('btn-zoom-reset'),
        zoomLevelIndicator: document.getElementById('zoom-level-indicator'),
        btnToggleFullscreen: document.getElementById('btn-toggle-fullscreen'),
        iconFullscreen: document.getElementById('icon-fullscreen'),

        searchModal: document.getElementById('search-modal'),
        searchInput: document.getElementById('search-input'),
        btnClearSearch: document.getElementById('btn-clear-search'),
        btnCloseSearch: document.getElementById('btn-close-search'),
        searchResultsContainer: document.getElementById('search-results-container'),

        tocModal: document.getElementById('toc-modal'),
        btnCloseToc: document.getElementById('btn-close-toc'),
        thumbnailsGrid: document.getElementById('thumbnails-grid')
    };

    // =========================================================================
    // 2. INITIALIZATION & PDF LOADING
    // =========================================================================
    async function init() {
        try {
            updateLoader(20, 'Fetching publication document...');
            
            // Attempt loading the actual PDF
            try {
                state.pdfDoc = await pdfjsLib.getDocument(CONFIG.pdfPath).promise;
                state.totalPages = state.pdfDoc.numPages;
                updateLoader(40, `Loaded ${state.totalPages} pages. Indexing content...`);
            } catch (err) {
                console.warn('Primary PDF loading failed or missing newsletter.pdf. Generating sample editorial publication...', err);
                await generateFallbackPublication();
            }

            elements.labelTotalPages.textContent = `/ ${state.totalPages}`;
            elements.infoPageCount.textContent = `${state.totalPages} Pages`;
            elements.inputPageNum.max = state.totalPages;

            // Render Cover Preview for Landing Page
            updateLoader(60, 'Rendering high-resolution cover...');
            await renderLandingCover();

            // Build Flipbook Elements in DOM
            updateLoader(80, 'Setting up page-flip engine...');
            await buildFlipbookDOM();

            // Extract Text for Search
            extractTextForSearch();

            // Build Thumbnails Grid
            buildThumbnailsGrid();

            // Initialize PageFlip Library
            initPageFlipEngine();

            updateLoader(100, 'Ready');
            setTimeout(() => {
                elements.loadingScreen.classList.add('hidden');
            }, 500);

            attachEventListeners();

        } catch (error) {
            console.error('Fatal initialization error:', error);
            elements.loaderStatus.textContent = 'Error loading publication. Please check newsletter.pdf.';
        }
    }

    function updateLoader(percentage, text) {
        elements.loaderProgress.style.width = `${percentage}%`;
        elements.loaderStatus.textContent = text;
    }

    // Fallback Renderer if newsletter.pdf is absent during preliminary test
    async function generateFallbackPublication() {
        state.totalPages = 6;
        state.isFallback = true;
    }

    // =========================================================================
    // 3. PAGE RENDERING ENGINE (PDF.js to Canvas)
    // =========================================================================
    async function renderPageToCanvas(pageNum, scale = CONFIG.pageScale) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (state.pdfDoc && !state.isFallback) {
            const page = await state.pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: scale });
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({
                canvasContext: ctx,
                viewport: viewport
            }).promise;
        } else {
            // Render Fallback Editorial Page Canvas
            canvas.width = 800 * scale;
            canvas.height = 1100 * scale;
            
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Header Banner
            ctx.fillStyle = '#002B66';
            ctx.fillRect(0, 0, canvas.width, 120 * scale);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = `bold ${32 * scale}px Cinzel, serif`;
            ctx.textAlign = 'center';
            ctx.fillText('INKSPIRE', canvas.width / 2, 60 * scale);

            ctx.font = `${14 * scale}px Plus Jakarta Sans, sans-serif`;
            ctx.fillText('PRESIDENCY SCHOOL, BANASHANKARI', canvas.width / 2, 90 * scale);

            // Draw Page Content Sample
            ctx.fillStyle = '#111827';
            ctx.font = `bold ${24 * scale}px Playfair Display, serif`;
            ctx.textAlign = 'left';
            ctx.fillText(`Page ${pageNum} - Digital Showcase`, 60 * scale, 180 * scale);

            ctx.fillStyle = '#4B5563';
            ctx.font = `${14 * scale}px Georgia, serif`;
            const sampleText = 'Welcome to the digital edition of INKSPIRE. Place your official newsletter.pdf in the root directory to automatically view your school publication pages here with complete page-flipping visuals, search, and high-definition rendering.';
            
            wrapText(ctx, sampleText, 60 * scale, 220 * scale, canvas.width - (120 * scale), 24 * scale);
        }

        return canvas;
    }

    function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            let metrics = ctx.measureText(testLine);
            let testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
    }

    async function renderLandingCover() {
        const coverCanvas = await renderPageToCanvas(1, 1.5);
        elements.landingCoverContainer.innerHTML = '';
        elements.landingCoverContainer.appendChild(coverCanvas);
    }

    async function buildFlipbookDOM() {
        elements.flipbookContainer.innerHTML = '';

        for (let i = 1; i <= state.totalPages; i++) {
            const pageDiv = document.createElement('div');
            pageDiv.className = 'page';
            
            const pageContent = document.createElement('div');
            pageContent.className = 'page-content';

            const canvas = await renderPageToCanvas(i, CONFIG.pageScale);
            pageContent.appendChild(canvas);
            pageDiv.appendChild(pageContent);
            
            elements.flipbookContainer.appendChild(pageDiv);
        }
    }

    // =========================================================================
    // 4. STPAGEFLIP ENGINE INTEGRATION
    // =========================================================================
    function initPageFlipEngine() {
        const isMobile = window.innerWidth <= 768;

        state.pageFlip = new St.PageFlip(elements.flipbookContainer, {
            width: 550,              // Base page width
            height: 733,             // Base page height (Aspect ratio 1 : 1.33)
            size: "stretch",
            minWidth: 300,
            maxWidth: 1000,
            minHeight: 400,
            maxHeight: 1333,
            maxShadowOpacity: 0.5,
            showCover: true,
            mobileScrollSupport: false,
            usePortrait: isMobile
        });

        state.pageFlip.loadFromHTML(document.querySelectorAll('.page'));

        // Page Flip Event Handlers
        state.pageFlip.on('flip', (e) => {
            state.currentPage = e.data + 1;
            elements.inputPageNum.value = state.currentPage;
            updateActiveThumbnail();
        });

        // Window Resize Responsiveness
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                state.pageFlip.updateFromHtml(document.querySelectorAll('.page'));
            }
        });
    }

    // =========================================================================
    // 5. SEARCH SYSTEM (Text Extraction & Search Overlay)
    // =========================================================================
    async function extractTextForSearch() {
        state.pageTexts = [];
        if (!state.pdfDoc || state.isFallback) return;

        for (let i = 1; i <= state.totalPages; i++) {
            const page = await state.pdfDoc.getPage(i);
            const textContent = await page.getTextContent();
            const text = textContent.items.map(item => item.str).join(' ');
            state.pageTexts.push({ pageNum: i, text: text });
        }
    }

    function performSearch(query) {
        elements.searchResultsContainer.innerHTML = '';
        if (!query.trim()) {
            elements.searchResultsContainer.innerHTML = '<p class="search-empty-prompt">Type a search query above to find text across all pages.</p>';
            return;
        }

        const cleanQuery = query.toLowerCase().trim();
        let matchesFound = 0;

        state.pageTexts.forEach(item => {
            const lowerText = item.text.toLowerCase();
            const index = lowerText.indexOf(cleanQuery);

            if (index !== -1) {
                matchesFound++;
                
                // Extract surrounding snippet
                const start = Math.max(0, index - 40);
                const end = Math.min(item.text.length, index + cleanQuery.length + 60);
                let snippet = item.text.substring(start, end);

                if (start > 0) snippet = '...' + snippet;
                if (end < item.text.length) snippet = snippet + '...';

                // Highlight snippet term
                const regex = new RegExp(`(${cleanQuery})`, 'gi');
                const highlightedSnippet = snippet.replace(regex, '<mark class="search-highlight">$1</mark>');

                const resultEl = document.createElement('div');
                resultEl.className = 'search-result-item';
                resultEl.innerHTML = `
                    <div class="search-result-header">
                        <span>PAGE ${item.pageNum}</span>
                        <i class="fa-solid fa-chevron-right"></i>
                    </div>
                    <div class="search-result-snippet">${highlightedSnippet}</div>
                `;

                resultEl.addEventListener('click', () => {
                    jumpToPage(item.pageNum);
                    closeModal(elements.searchModal);
                });

                elements.searchResultsContainer.appendChild(resultEl);
            }
        });

        if (matchesFound === 0) {
            elements.searchResultsContainer.innerHTML = `<p class="search-empty-prompt">No results found for "${query}".</p>`;
        }
    }

    // =========================================================================
    // 6. THUMBNAILS GRID / TABLE OF CONTENTS
    // =========================================================================
    async function buildThumbnailsGrid() {
        elements.thumbnailsGrid.innerHTML = '';

        for (let i = 1; i <= state.totalPages; i++) {
            const thumbItem = document.createElement('div');
            thumbItem.className = `thumb-item ${i === 1 ? 'active' : ''}`;
            thumbItem.dataset.page = i;

            const box = document.createElement('div');
            box.className = 'thumb-canvas-box';

            const thumbCanvas = await renderPageToCanvas(i, CONFIG.thumbScale);
            box.appendChild(thumbCanvas);

            const label = document.createElement('span');
            label.className = 'thumb-label';
            label.textContent = `Page ${i}`;

            thumbItem.appendChild(box);
            thumbItem.appendChild(label);

            thumbItem.addEventListener('click', () => {
                jumpToPage(i);
                closeModal(elements.tocModal);
            });

            elements.thumbnailsGrid.appendChild(thumbItem);
        }
    }

    function updateActiveThumbnail() {
        document.querySelectorAll('.thumb-item').forEach(item => {
            const p = parseInt(item.dataset.page, 10);
            if (p === state.currentPage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // =========================================================================
    // 7. READER CONTROLS & EVENT LISTENERS
    // =========================================================================
    function attachEventListeners() {
        // Open/Close Reader View
        elements.btnOpenReader.addEventListener('click', openReader);
        elements.coverFrameClick.addEventListener('click', openReader);
        elements.btnExitReader.addEventListener('click', closeReader);

        // Open TOC from landing
        elements.btnOpenTocLanding.addEventListener('click', () => {
            openReader();
            openModal(elements.tocModal);
        });

        // Navigation Controls
        elements.btnPrevPage.addEventListener('click', () => state.pageFlip.flipPrev());
        elements.btnNextPage.addEventListener('click', () => state.pageFlip.flipNext());
        elements.btnFirstPage.addEventListener('click', () => jumpToPage(1));
        elements.btnLastPage.addEventListener('click', () => jumpToPage(state.totalPages));

        elements.inputPageNum.addEventListener('change', (e) => {
            let p = parseInt(e.target.value, 10);
            if (isNaN(p)) p = 1;
            p = Math.max(1, Math.min(state.totalPages, p));
            jumpToPage(p);
        });

        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            if (elements.readerView.classList.contains('hidden')) return;

            if (e.key === 'ArrowLeft') state.pageFlip.flipPrev();
            if (e.key === 'ArrowRight') state.pageFlip.flipNext();
            if (e.key === 'Escape') {
                closeModal(elements.searchModal);
                closeModal(elements.tocModal);
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                openModal(elements.searchModal);
                elements.searchInput.focus();
            }
        });

        // Search Overlay Controls
        elements.btnToggleSearch.addEventListener('click', () => {
            openModal(elements.searchModal);
            elements.searchInput.focus();
        });
        elements.btnCloseSearch.addEventListener('click', () => closeModal(elements.searchModal));
        elements.searchInput.addEventListener('input', (e) => performSearch(e.target.value));
        elements.btnClearSearch.addEventListener('click', () => {
            elements.searchInput.value = '';
            performSearch('');
        });

        // Thumbnails Overlay Controls
        elements.btnToggleToc.addEventListener('click', () => openModal(elements.tocModal));
        elements.btnCloseToc.addEventListener('click', () => closeModal(elements.tocModal));

        // Zoom Controls
        elements.btnZoomIn.addEventListener('click', () => adjustZoom(0.15));
        elements.btnZoomOut.addEventListener('click', () => adjustZoom(-0.15));
        elements.btnZoomReset.addEventListener('click', () => setZoom(1.0));

        // Fullscreen Toggle
        elements.btnToggleFullscreen.addEventListener('click', toggleFullscreen);
    }

    function openReader() {
        elements.landingView.classList.add('hidden');
        elements.readerView.classList.remove('hidden');
        if (state.pageFlip) {
            state.pageFlip.updateFromHtml(document.querySelectorAll('.page'));
        }
    }

    function closeReader() {
        elements.readerView.classList.add('hidden');
        elements.landingView.classList.remove('hidden');
    }

    function jumpToPage(pageNum) {
        if (!state.pageFlip) return;
        state.pageFlip.flip(pageNum - 1);
    }

    function openModal(modalEl) {
        modalEl.classList.remove('hidden');
    }

    function closeModal(modalEl) {
        modalEl.classList.add('hidden');
    }

    function adjustZoom(delta) {
        setZoom(state.zoomLevel + delta);
    }

    function setZoom(level) {
        state.zoomLevel = Math.max(0.8, Math.min(2.0, level));
        elements.flipbookViewport.style.transform = `scale(${state.zoomLevel})`;
        elements.zoomLevelIndicator.textContent = `${Math.round(state.zoomLevel * 100)}%`;
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                elements.iconFullscreen.className = 'fa-solid fa-compress';
            }).catch(err => console.error('Fullscreen error:', err));
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().then(() => {
                    elements.iconFullscreen.className = 'fa-solid fa-expand';
                });
            }
        }
    }

    // Start App
    init();
});