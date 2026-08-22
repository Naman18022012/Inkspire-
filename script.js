/**
 * INKSPIRE - Official 3D Interactive Magazine Engine
 * Presidency School Banashankari
 */

// 1. MAGAZINE CONTENT DATA
const magazineSpreads = [
  {
    spreadId: 0,
    left: {
      type: 'cover',
      vol: 'VOL. IV | ISSUE 02',
      date: 'AUGUST 2026',
      title: 'INKSPIRE',
      headline: 'Shaping Tomorrow’s Visionaries',
      lead: 'Official Digital Newsletter of Presidency School Banashankari, celebrating academic excellence, creative arts, and campus innovation.'
    },
    right: {
      type: 'editorial',
      tag: "Principal's Desk",
      title: "Fostering Excellence & Courage",
      author: "Dr. Sunita V. Sharma, Principal",
      text: "<p>Welcome to this edition of INKSPIRE. As we traverse through another remarkable academic session, our institution continues to uphold the core values of integrity, inquiry, and intellectual resilience.</p><p>Our students have demonstrated extraordinary spirit in national science congresses, debate championships, and inter-school athletic meets. May this publication inspire every reader.</p>",
      pageNum: 1
    }
  },
  {
    spreadId: 1,
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
    spreadId: 2,
    left: {
      type: 'article',
      tag: "Cultural Symphony",
      title: "Inter-School Drama Victory",
      text: "<p>The Presidency School Banashankari Theatrical Troupe took home the Best Play trophy at the Regional Inter-School Cultural Fest. Their poignant original play, 'Echoes of Time', won unanimous acclaim from judges.</p><p>From original music scores to intricate stage design, the production was entirely student-led.</p>",
      img: "https://encrypted-tbn2.gstatic.com/licensed-image?q=tbn:ANd9GcTTmxz3iyAugQOeR4cnGXzeLsO_0Vd154ZYag7CfpJHlLOvjQiT71YrV-Ut76nZRHWRhOGjrNGLqcAyPF4",
      pageNum: 4
    },
    right: {
      type: 'article',
      tag: "Sports Arena",
      title: "Annual Athletic Champions",
      text: "<p>Our young athletes dominated the Inter-State Track & Field Meet in Bengaluru. With 12 Gold, 8 Silver, and 5 Bronze medals, Presidency School Banashankari bagged the Overall Championship Trophy.</p><p>Special recognition goes to Master K. Aryan for breaking the 400m sprint record!</p>",
      img: "https://presidencyschoolbsk.org/wp-content/uploads/2025/02/PSBSK.webp",
      pageNum: 5
    }
  },
  {
    spreadId: 3,
    left: {
      type: 'article',
      tag: "Creative Corner",
      title: "The Canvas of Tomorrow",
      text: "<p><em>By Diya S., Class IX</em></p><p>We paint the sky with whispered dreams,<br>Beside the gentle flowing streams,<br>Where knowledge grows and courage sings,<br>And hope gives every spirit wings.</p>",
      pageNum: 6
    },
    right: {
      type: 'backcover',
      title: 'INKSPIRE',
      subtitle: 'Presidency School Banashankari',
      text: 'Thank you for reading the official digital newsletter. Stay connected with our institutional journey.',
      contact: 'www.presidencyschoolbsk.org',
      pageNum: 7
    }
  }
];

// Table of Contents Reference
const tocData = [
  { title: "Principal's Address", page: 1 },
  { title: "National Science Olympiad", page: 2 },
  { title: "Robotics & AI Workshop", page: 3 },
  { title: "Inter-School Drama Victory", page: 4 },
  { title: "Annual Athletic Champions", page: 5 },
  { title: "Creative Corner", page: 6 }
];

// 2. STATE MANAGEMENT
let currentSpread = 0;
let isAnimating = false;

// DOM Elements
let baseLeft, baseRight, bookElement, prevBtn, nextBtn, counterEl, loader, loaderBar, drawerOverlay, tocDrawer, tocList;

// 3. INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  baseLeft = document.getElementById('page-base-left');
  baseRight = document.getElementById('page-base-right');
  bookElement = document.getElementById('magazine-book');
  prevBtn = document.getElementById('btn-prev');
  nextBtn = document.getElementById('btn-next');
  counterEl = document.getElementById('page-counter-text');
  loader = document.getElementById('loading-screen');
  loaderBar = document.getElementById('loader-bar-fill');
  drawerOverlay = document.getElementById('drawer-overlay');
  tocDrawer = document.getElementById('toc-drawer');
  tocList = document.getElementById('toc-list-items');

  // Preloader Animation
  let progress = 0;
  const loadInterval = setInterval(() => {
    progress += 25;
    if (loaderBar) loaderBar.style.width = progress + '%';
    if (progress >= 100) {
      clearInterval(loadInterval);
      setTimeout(() => {
        if (loader) {
          loader.style.opacity = '0';
          loader.style.visibility = 'hidden';
        }
      }, 300);
    }
  }, 100);

  renderBaseSpread(0);
  populateTOC();
  setupEventListeners();
});

// 4. RENDER STATIC BASE PAGES
function renderBaseSpread(index) {
  const spread = magazineSpreads[index];
  baseLeft.innerHTML = renderPageContent(spread.left);
  baseRight.innerHTML = renderPageContent(spread.right);
  
  currentSpread = index;
  updateControls();
}

function renderPageContent(data) {
  if (data.type === 'cover') {
    return `
      <div class="cover-inner">
        <div>
          <span class="edition-badge">${data.vol}</span>
          <div style="font-family:var(--font-accent); font-size:0.75rem; color:var(--color-accent-gold-light); margin-top:4px;">${data.date}</div>
        </div>
        <div>
          <h1 class="cover-title">${data.title}</h1>
          <h2 class="cover-headline">${data.headline}</h2>
          <p class="cover-lead">${data.lead}</p>
        </div>
        <div style="font-family:var(--font-accent); font-size:0.75rem; color:rgba(255,255,255,0.6);">Presidency School Banashankari</div>
      </div>
    `;
  }

  if (data.type === 'backcover') {
    return `
      <div class="cover-inner" style="text-align:center; justify-content:center; align-items:center;">
        <h2 style="font-family:var(--font-display); font-size:2.5rem; color:#FFF;">${data.title}</h2>
        <p style="font-family:var(--font-accent); color:var(--color-accent-gold); font-size:0.8rem; letter-spacing:2px; margin-bottom:1.5rem;">${data.subtitle}</p>
        <p style="font-size:0.9rem; color:rgba(255,255,255,0.8); margin-bottom:2rem;">${data.text}</p>
        <div style="font-family:var(--font-accent); font-size:0.8rem; color:var(--color-accent-gold-light);">${data.contact}</div>
      </div>
    `;
  }

  return `
    <div class="page-inner">
      <div>
        ${data.tag ? `<div class="page-tag">${data.tag}</div>` : ''}
        <h3 class="page-title">${data.title}</h3>
        ${data.author ? `<div style="font-family:var(--font-heading); font-style:italic; font-size:0.95rem; color:var(--color-primary-light); margin-bottom:0.75rem;">By ${data.author}</div>` : ''}
        ${data.img ? `<div class="page-image-frame"><img src="${data.img}" alt="Article image"></div>` : ''}
        <div class="page-body">${data.text}</div>
      </div>
      <div class="page-footer-bar">
        <span>INKSPIRE Publication</span>
        <span>Page ${data.pageNum}</span>
      </div>
    </div>
  `;
}

// 5. REAL 3D PAGE FLIP ANIMATION ENGINE
function turnPage(direction) {
  if (isAnimating) return;

  if (direction === 'next' && currentSpread < magazineSpreads.length - 1) {
    isAnimating = true;
    const targetSpread = currentSpread + 1;

    // Create 3D animated flipper leaf
    const flipper = document.createElement('div');
    flipper.className = 'page-flipper flip-left';

    flipper.innerHTML = `
      <div class="flipper-face front">${baseRight.innerHTML}</div>
      <div class="flipper-face back">${renderPageContent(magazineSpreads[targetSpread].left)}</div>
    `;

    // Pre-render new target right page on base
    baseRight.innerHTML = renderPageContent(magazineSpreads[targetSpread].right);
    bookElement.appendChild(flipper);

    flipper.addEventListener('animationend', () => {
      baseLeft.innerHTML = renderPageContent(magazineSpreads[targetSpread].left);
      flipper.remove();
      currentSpread = targetSpread;
      updateControls();
      isAnimating = false;
    });

  } else if (direction === 'prev' && currentSpread > 0) {
    isAnimating = true;
    const targetSpread = currentSpread - 1;

    // Create 3D animated flipper leaf
    const flipper = document.createElement('div');
    flipper.className = 'page-flipper flip-right';

    flipper.innerHTML = `
      <div class="flipper-face front">${baseLeft.innerHTML}</div>
      <div class="flipper-face back">${renderPageContent(magazineSpreads[targetSpread].right)}</div>
    `;

    // Pre-render new target left page on base
    baseLeft.innerHTML = renderPageContent(magazineSpreads[targetSpread].left);
    bookElement.appendChild(flipper);

    flipper.addEventListener('animationend', () => {
      baseRight.innerHTML = renderPageContent(magazineSpreads[targetSpread].right);
      flipper.remove();
      currentSpread = targetSpread;
      updateControls();
      isAnimating = false;
    });
  }
}

// Update UI Buttons and Page Number Counter
function updateControls() {
  if (prevBtn) prevBtn.disabled = currentSpread === 0;
  if (nextBtn) nextBtn.disabled = currentSpread === magazineSpreads.length - 1;
  
  if (counterEl) {
    if (currentSpread === 0) {
      counterEl.textContent = 'Cover Spread';
    } else {
      const leftNum = magazineSpreads[currentSpread].left.pageNum;
      const rightNum = magazineSpreads[currentSpread].right.pageNum;
      counterEl.textContent = `Pages ${leftNum} – ${rightNum || 'End'}`;
    }
  }
}

// 6. TOC & NAVIGATION HELPERS
function populateTOC() {
  if (!tocList) return;
  tocList.innerHTML = tocData.map(item => `
    <li class="toc-item" onclick="jumpToPage(${item.page})">
      <span style="font-family:var(--font-accent); font-weight:700; font-size:0.9rem; color:var(--color-primary);">${item.title}</span>
      <span style="font-family:var(--font-display); font-weight:700; color:var(--color-accent-gold);">p. ${item.page}</span>
    </li>
  `).join('');
}

function jumpToPage(pageNum) {
  let targetIndex = 0;
  magazineSpreads.forEach((s, idx) => {
    if (s.left.pageNum === pageNum || s.right.pageNum === pageNum) {
      targetIndex = idx;
    }
  });
  renderBaseSpread(targetIndex);
  closeDrawers();
}

function setupEventListeners() {
  if (prevBtn) prevBtn.addEventListener('click', () => turnPage('prev'));
  if (nextBtn) nextBtn.disabled = false; nextBtn.addEventListener('click', () => turnPage('next'));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') turnPage('prev');
    if (e.key === 'ArrowRight') turnPage('next');
    if (e.key === 'Escape') closeDrawers();
  });

  const openToc = document.getElementById('btn-open-toc');
  const closeToc = document.getElementById('btn-close-toc');

  if (openToc) openToc.addEventListener('click', () => {
    if (drawerOverlay) drawerOverlay.classList.add('active');
    if (tocDrawer) tocDrawer.classList.add('active');
  });

  if (closeToc) closeToc.addEventListener('click', closeDrawers);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawers);
}

function closeDrawers() {
  if (drawerOverlay) drawerOverlay.classList.remove('active');
  if (tocDrawer) tocDrawer.classList.remove('active');
}