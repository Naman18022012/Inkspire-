/**
 * INKSPIRE - Official Digital Newsletter Platform
 * Presidency School Banashankari
 */

// 1. DIGITAL NEWSLETTER PUBLICATION DATA
const magazinePages = [
  {
    spreadId: 1,
    left: {
      type: 'cover',
      title: 'INKSPIRE',
      vol: 'VOL. IV | ISSUE 02',
      date: 'AUGUST 2026',
      headline: 'Shaping Tomorrow’s Visionaries',
      lead: 'Celebrating academic excellence, innovative STEM endeavors, and holistic leadership at Presidency School Banashankari.'
    },
    right: {
      type: 'editorial',
      tag: "Principal's Desk",
      title: "Fostering Excellence & Courage",
      author: "Dr. Sunita V. Sharma, Principal",
      text: "<p>Welcome to this edition of INKSPIRE. As we traverse through another remarkable academic session, our institution continues to uphold the core values of integrity, inquiry, and intellectual resilience.</p><p>Our students have demonstrated extraordinary spirit in national science congresses, debate championships, and inter-school athletic meets. May this publication inspire every reader to seek knowledge with enthusiasm.</p>",
      quote: "Education is not the learning of facts, but the training of the mind to think.",
      pageNum: 1
    }
  },
  {
    spreadId: 2,
    left: {
      type: 'article',
      tag: "Academic Horizons",
      title: "National Science Olympiad Winners",
      text: "<p>Presidency Banashankari secured top honours in the National Science Olympiad 2026. Our Grade X research team presented an AI-driven water filtration model designed for local water conservation.</p><p>Under the guidance of our Department of Sciences, student researchers designed low-cost sensor arrays tested right here on our school campus.</p>",
      img: "https://encrypted-tbn1.gstatic.com/licensed-image?q=tbn:ANd9GcQvRT12S9CrnHaY-u7TQ_k4zkTc2ZH2JcvHWQcP--f1V3Rj3Wo9Mdq6QfYoTGJf31vz4ZREIoV4CSsXR3Q",
      pageNum: 2
    },
    right: {
      type: 'article',
      tag: "Campus Innovation",
      title: "The Robotics & AI Workshop",
      text: "<p>Our state-of-the-art Innovation Lab hosted an intensive 3-day workshop on Autonomous Robotics and Machine Learning basics for Middle and High School students.</p><p>Participants constructed autonomous line-following rovers and programmed sensor-activated safety devices, demonstrating exceptional computational thinking.</p>",
      img: "https://encrypted-tbn1.gstatic.com/licensed-image?q=tbn:ANd9GcSZVuXsRH5jIY0R-Io5fjjdx_JnWWMBPkOCyN_hC9BIM4YWDrlsc3nN0kbhhSYrVDA7EFr7dkBe_ORxTCY",
      pageNum: 3
    }
  },
  {
    spreadId: 3,
    left: {
      type: 'article',
      tag: "Cultural Symphony",
      title: "Inter-School Drama Fest Triumph",
      text: "<p>The Presidency School Banashankari Theatrical Troupe took home the Best Play trophy at the Regional Inter-School Cultural Fest. Their poignant original play, 'Echoes of Time', won unanimous acclaim from judges.</p><p>From original music scores to intricate stage design, the production was entirely student-led.</p>",
      img: "https://encrypted-tbn2.gstatic.com/licensed-image?q=tbn:ANd9GcTTmxz3iyAugQOeR4cnGXzeLsO_0Vd154ZYag7CfpJHlLOvjQiT71YrV-Ut76nZRHWRhOGjrNGLqcAyPF4",
      pageNum: 4
    },
    right: {
      type: 'article',
      tag: "Sports Arena",
      title: "Annual Athletic Meet Champions",
      text: "<p>Our young athletes dominated the Inter-State Track & Field Meet in Bengaluru. With 12 Gold, 8 Silver, and 5 Bronze medals, Presidency School Banashankari bagged the Overall Championship Trophy.</p><p>Special recognition goes to Master K. Aryan for breaking the 400m sprint record!</p>",
      img: "https://presidencyschoolbsk.org/wp-content/uploads/2025/02/PSBSK.webp",
      pageNum: 5
    }
  },
  {
    spreadId: 4,
    left: {
      type: 'article',
      tag: "Student Creative Corner",
      title: "Literary Expressions & Verse",
      text: "<p><strong>'The Canvas of Tomorrow'</strong><br><em>By Diya S., Class IX</em><br>We paint the sky with whispered dreams,<br>Beside the gentle flowing streams,<br>Where knowledge grows and courage sings,<br>And hope gives every spirit wings.</p>",
      quote: "Poetry is the rhythmical creation of beauty in words.",
      pageNum: 6
    },
    right: {
      type: 'article',
      tag: "Art Gallery",
      title: "Fine Arts Exhibition Winners",
      text: "<p>Featuring watercolor and digital art submissions from the Annual Visual Arts Showcase held in the school auditorium.</p><p>Selected student artwork will be preserved in our digital campus gallery for the academic year 2026-27.</p>",
      img: "https://encrypted-tbn1.gstatic.com/licensed-image?q=tbn:ANd9GcSZVuXsRH5jIY0R-Io5fjjdx_JnWWMBPkOCyN_hC9BIM4YWDrlsc3nN0kbhhSYrVDA7EFr7dkBe_ORxTCY",
      pageNum: 7
    }
  },
  {
    spreadId: 5,
    left: {
      type: 'article',
      tag: "Alumni Spotlight",
      title: "In Conversation with Dr. Arvind R.",
      text: "<p>Class of 2014 Alumnus Dr. Arvind R., now a Senior Aerospace Researcher, visited our campus for an interactive mentoring session with senior students.</p><p>'The strong foundation in ethics and critical thinking I received at Presidency Banashankari shaped my trajectory in science,' he noted during his key address.</p>",
      pageNum: 8
    },
    right: {
      type: 'backcover',
      title: 'INKSPIRE',
      subtitle: 'Presidency School Banashankari',
      text: 'Thank you for reading the official digital newsletter. Stay connected with our institutional journey.',
      contact: 'www.presidencyschoolbsk.org',
      pageNum: 9
    }
  }
];

const tableOfContentsData = [
  { title: "Principal's Address", desc: "Fostering Excellence & Courage", page: 1 },
  { title: "National Science Olympiad", desc: "AI-Driven Water Conservation Project", page: 2 },
  { title: "Robotics & AI Workshop", desc: "Hands-on engineering in our Innovation Lab", page: 3 },
  { title: "Inter-School Drama Victory", desc: "First prize at Regional Cultural Fest", page: 4 },
  { title: "Annual Athletic Champions", desc: "Overall Trophy at Track & Field Meet", page: 5 },
  { title: "Student Creative Corner", desc: "Award-winning poems and essays", page: 6 },
  { title: "Fine Arts Exhibition", desc: "Student visual art showcase", page: 7 },
  { title: "Alumni Spotlight", desc: "Mentorship session with Dr. Arvind R.", page: 8 }
];

// 2. STATE MANAGEMENT & DOM REFERENCES
let currentSpreadIndex = 0;
let zoomLevel = 1;

let loaderScreen, loaderBar, loaderStatus;
let leftPage, rightPage, pageIndicator, prevBtn, nextBtn, rangeSlider, bookElement;
let drawerOverlay, tocDrawer, tocListItems, searchModal, searchInput, searchResults, toast;

// 3. INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  // Bind Elements
  loaderScreen = document.getElementById('loading-screen');
  loaderBar = document.getElementById('loader-bar');
  loaderStatus = document.getElementById('loader-status');
  leftPage = document.getElementById('left-page-content');
  rightPage = document.getElementById('right-page-content');
  pageIndicator = document.getElementById('page-indicator-text');
  prevBtn = document.getElementById('btn-prev-page');
  nextBtn = document.getElementById('btn-next-page');
  rangeSlider = document.getElementById('page-range-slider');
  bookElement = document.getElementById('book-element');
  drawerOverlay = document.getElementById('drawer-overlay');
  tocDrawer = document.getElementById('toc-drawer');
  tocListItems = document.getElementById('toc-list-items');
  searchModal = document.getElementById('search-modal');
  searchInput = document.getElementById('search-query-input');
  searchResults = document.getElementById('search-results-list');
  toast = document.getElementById('toast');

  // Preloader progress animation
  let progress = 0;
  const interval = setInterval(() => {
    progress += 20;
    if (loaderBar) loaderBar.style.width = progress + '%';
    if (progress === 40 && loaderStatus) loaderStatus.textContent = 'Rendering High-Res Typography...';
    if (progress === 80 && loaderStatus) loaderStatus.textContent = 'Preparing Flipbook Reader...';
    
    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        if (loaderScreen) {
          loaderScreen.style.opacity = '0';
          loaderScreen.style.visibility = 'hidden';
        }
      }, 400);
    }
  }, 120);

  renderSpread(0);
  populateTOC();
  setupEventListeners();
});

// 4. RENDER ENGINE
function renderSpread(index) {
  if (index < 0 || index >= magazinePages.length) return;
  currentSpreadIndex = index;
  const spread = magazinePages[index];

  if (leftPage) leftPage.innerHTML = buildPageHTML(spread.left, 'left');
  if (rightPage) rightPage.innerHTML = buildPageHTML(spread.right, 'right');

  if (prevBtn) prevBtn.disabled = index === 0;
  if (nextBtn) nextBtn.disabled = index === magazinePages.length - 1;
  if (rangeSlider) rangeSlider.value = index + 1;

  if (pageIndicator) {
    const pageStart = index === 0 ? 'Cover' : `Page ${spread.left.pageNum}`;
    const pageEnd = spread.right.type === 'backcover' ? 'Back Cover' : `Page ${spread.right.pageNum}`;
    pageIndicator.textContent = `${pageStart} – ${pageEnd} of 9`;
  }
}

function buildPageHTML(data, side) {
  const spineShadow = `<div class="page-spine-shadow"></div>`;
  
  if (data.type === 'cover') {
    return `
      ${spineShadow}
      <div class="cover-spread">
        <div class="cover-header">
          <div>
            <span class="cover-feature-badge">Official Edition</span>
            <div style="font-family:var(--font-sans-accent); font-size:0.75rem; margin-top:6px; color:var(--color-accent-gold-light);">${data.vol}</div>
          </div>
          <img src="https://presidencyschoolbsk.org/wp-content/uploads/2025/02/PSBSK.webp" alt="Logo" style="height:36px; filter:brightness(0) invert(1);">
        </div>
        <div class="cover-hero-box">
          <h1 class="cover-main-title">${data.title}</h1>
          <h2 class="cover-headline">${data.headline}</h2>
          <p class="cover-lead">${data.lead}</p>
        </div>
        <div class="cover-footer">
          <span>Presidency School Banashankari</span>
          <span>${data.date}</span>
        </div>
      </div>
    `;
  }

  if (data.type === 'backcover') {
    return `
      ${spineShadow}
      <div class="cover-spread" style="text-align:center; justify-content:center; align-items:center;">
        <img src="https://presidencyschoolbsk.org/wp-content/uploads/2025/02/PSBSK.webp" alt="Logo" style="height:60px; filter:brightness(0) invert(1); margin-bottom:1.5rem;">
        <h2 style="font-family:var(--font-display); font-size:2.5rem; color:var(--color-surface);">${data.title}</h2>
        <p style="font-family:var(--font-sans-accent); color:var(--color-accent-gold); text-transform:uppercase; font-size:0.8rem; letter-spacing:2px; margin-bottom:1.5rem;">${data.subtitle}</p>
        <p style="font-size:0.9rem; color:rgba(255,255,255,0.7); max-width:80%; line-height:1.6; margin-bottom:2rem;">${data.text}</p>
        <div style="font-family:var(--font-sans-accent); font-size:0.8rem; color:var(--color-accent-gold-light);">${data.contact}</div>
      </div>
    `;
  }

  return `
    ${spineShadow}
    <div>
      ${data.tag ? `<div class="page-header-tag">${data.tag}</div>` : ''}
      <h3 class="page-editorial-title">${data.title || ''}</h3>
      ${data.author ? `<div style="font-family:var(--font-heading); font-style:italic; font-size:1rem; color:var(--color-primary-light); margin-bottom:0.75rem;">By ${data.author}</div>` : ''}
      ${data.img ? `<div class="page-img-frame"><img src="${data.img}" alt="Article image"></div>` : ''}
      <div class="page-article-text">${data.text || ''}</div>
      ${data.quote ? `<div class="page-quote-box">"${data.quote}"</div>` : ''}
    </div>
    <div class="page-number">
      <span>INKSPIRE Newsletter</span>
      <span>Page ${data.pageNum}</span>
    </div>
  `;
}

// 5. EVENT HANDLERS
function setupEventListeners() {
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentSpreadIndex > 0) renderSpread(currentSpreadIndex - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentSpreadIndex < magazinePages.length - 1) renderSpread(currentSpreadIndex + 1);
    });
  }

  if (rangeSlider) {
    rangeSlider.addEventListener('input', (e) => {
      renderSpread(parseInt(e.target.value) - 1);
    });
  }

  // Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && currentSpreadIndex > 0) {
      renderSpread(currentSpreadIndex - 1);
    } else if (e.key === 'ArrowRight' && currentSpreadIndex < magazinePages.length - 1) {
      renderSpread(currentSpreadIndex + 1);
    } else if (e.key === 'Escape') {
      closeDrawers();
    }
  });

  // Zoom
  const zoomInBtn = document.getElementById('tool-zoom-in');
  const zoomOutBtn = document.getElementById('tool-zoom-out');

  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      if (zoomLevel < 1.3 && bookElement) {
        zoomLevel += 0.15;
        bookElement.style.transform = `scale(${zoomLevel})`;
      }
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      if (zoomLevel > 0.85 && bookElement) {
        zoomLevel -= 0.15;
        bookElement.style.transform = `scale(${zoomLevel})`;
      }
    });
  }

  // Fullscreen
  const fsBtn = document.getElementById('tool-fullscreen');
  if (fsBtn) {
    fsBtn.addEventListener('click', () => {
      const stage = document.getElementById('flipbook-stage');
      if (!document.fullscreenElement && stage) {
        stage.requestFullscreen().catch(err => console.log(err));
      } else if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    });
  }

  // PDF Download Trigger
  const dlBtn = document.getElementById('tool-download');
  if (dlBtn) {
    dlBtn.addEventListener('click', () => {
      showToast('Downloading Official INKSPIRE Vol. IV Issue 2 PDF...');
    });
  }

  // TOC & Search UI Events
  const openTocBtn = document.getElementById('btn-open-toc');
  const toolTocBtn = document.getElementById('tool-toc-btn');
  const closeTocBtn = document.getElementById('btn-close-toc');
  const openSearchBtn = document.getElementById('btn-open-search');
  const closeSearchBtn = document.getElementById('btn-close-search');

  if (openTocBtn) openTocBtn.addEventListener('click', openTOC);
  if (toolTocBtn) toolTocBtn.addEventListener('click', openTOC);
  if (closeTocBtn) closeTocBtn.addEventListener('click', closeDrawers);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawers);

  if (openSearchBtn) {
    openSearchBtn.addEventListener('click', () => {
      if (drawerOverlay) drawerOverlay.classList.add('active');
      if (searchModal) searchModal.classList.add('active');
      if (searchInput) searchInput.focus();
    });
  }

  if (closeSearchBtn) closeSearchBtn.addEventListener('click', closeDrawers);

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (!query) {
        searchResults.innerHTML = '<li style="color:var(--color-text-muted); font-size:0.85rem;">Type a query above to search within this edition.</li>';
        return;
      }

      const matches = tableOfContentsData.filter(item => 
        item.title.toLowerCase().includes(query) || item.desc.toLowerCase().includes(query)
      );

      if (matches.length === 0) {
        searchResults.innerHTML = '<li style="color:var(--color-text-muted); font-size:0.85rem;">No matching articles found.</li>';
      } else {
        searchResults.innerHTML = matches.map(item => `
          <li class="toc-item" onclick="jumpToPage(${item.page})">
            <div>
              <div class="toc-item-title">${item.title}</div>
              <div class="toc-item-sub">${item.desc}</div>
            </div>
            <span class="toc-page-num">Page ${item.page}</span>
          </li>
        `).join('');
      }
    });
  }
}

// 6. TOC UTILITIES
function populateTOC() {
  if (!tocListItems) return;
  tocListItems.innerHTML = tableOfContentsData.map((item) => `
    <li class="toc-item" onclick="jumpToPage(${item.page})">
      <div>
        <div class="toc-item-title">${item.title}</div>
        <div class="toc-item-sub">${item.desc}</div>
      </div>
      <span class="toc-page-num">p. ${item.page}</span>
    </li>
  `).join('');
}

function jumpToPage(pageNum) {
  let targetSpreadIndex = 0;
  magazinePages.forEach((spread, i) => {
    if (spread.left.pageNum === pageNum || spread.right.pageNum === pageNum) {
      targetSpreadIndex = i;
    }
  });
  renderSpread(targetSpreadIndex);
  closeDrawers();
  const element = document.getElementById('flipbook');
  if (element) element.scrollIntoView({ behavior: 'smooth' });
}

function openTOC() {
  if (drawerOverlay) drawerOverlay.classList.add('active');
  if (tocDrawer) tocDrawer.classList.add('active');
}

function closeDrawers() {
  if (drawerOverlay) drawerOverlay.classList.remove('active');
  if (tocDrawer) tocDrawer.classList.remove('active');
  if (searchModal) searchModal.classList.remove('active');
}

function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}