// Bo Mei Er — Main Site Functions

document.addEventListener('DOMContentLoaded', () => {

  // --- Navigation scroll effect ---
  const nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  // --- Mobile nav toggle ---
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
    });

    // Close on link click
    links.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        links.classList.remove('open');
      });
    });
  }

  // --- Scroll fade-in animations ---
  const fadeEls = document.querySelectorAll('.fade-in, .atelier-reveal');
  if (fadeEls.length) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      fadeEls.forEach(el => el.classList.add('visible'));
    } else {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      fadeEls.forEach(el => observer.observe(el));
    }
  }

  // --- Active nav link ---
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath) {
      link.classList.add('active');
    }
  });
});


// --- Journal article toggle ---
function toggleArticle(articleId) {
  const article = document.getElementById(articleId);
  if (!article) return;
  article.classList.toggle('open');
  article.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// --- Journal card click handler ---
document.addEventListener('DOMContentLoaded', () => {
  const journalGrid = document.getElementById('journal-grid');
  if (!journalGrid) return;

  
  const articles = [
    { id: 'article-1', image: 'images/products/article-1_cover.webp', date: '2026 年 7 月', title: '琉璃珠是怎麼燒出來的？', desc: '一顆手作琉璃珠從軟化到成型的過程，以及為什麼每一顆都不一樣。', badge: '精選' },
    { id: 'article-2', image: 'images/products/article-2_cover.webp', date: '2026 年 7 月', title: '送禮指南｜手機鏈挑選的幾個原則', desc: '送朋友手機鏈之前，先想清楚這三件事。', badge: '精選' },
    { id: 'article-3', image: 'images/products/article-3_cover.webp', date: '2026 年 7 月', title: '選物人的日常：我們怎麼挑一條手機鏈', desc: '從材料、手感、到光線測試——鉑魅兒的選品流程。', badge: '精選' },
    { id: 'article-4', image: 'images/products/article-4_cover.webp', date: '2026 年 7 月', title: '日常保養｜讓手機鏈陪你更久', desc: '琉璃珠、金屬配件、扣環掛繩的簡易維護指南。', badge: '延伸' },
    { id: 'article-5', image: 'images/products/article-5_cover.webp', date: '2026 年 7 月', title: '手機鏈素材解密｜玻璃珠、琉璃與其他材質的差異', desc: '壓克力、玻璃、琉璃、天然石——手機鏈的材質這麼多，到底差在哪？', badge: '延伸' },
    { id: 'article-6', image: 'images/products/article-6_cover.webp', date: '2026 年 7 月', title: '不只手機鏈｜琉璃配飾的延伸應用', desc: '一條手機鏈可以變成手鍊、吊飾、包包装飾——教你幾種玩法。', badge: '延伸' }
  ];

  journalGrid.innerHTML = articles.map(a => 
    `<div class="journal-card clickable" onclick="toggleArticle('${a.id}')">
      <div class="journal-card-image">
        <img src="${a.image}" alt="${a.title}" loading="lazy">
        <span class="journal-card-badge">${a.badge}</span>
      </div>
      <div class="journal-card-body">
        <div class="journal-date">${a.date}</div>
        <h3>${a.title}</h3>
        <p>${a.desc}</p>
        <span class="read-more">閱讀全文 →</span>
      </div>
    </div>`
  ).join('');
});



// --- Scroll to top (centralized) ---
(function() {
  var btn = document.createElement('button');
  btn.id = 'scroll-top';
  btn.setAttribute('aria-label', '回到頂端');
  btn.innerHTML = '↑';
  Object.assign(btn.style, {
    position: 'fixed', bottom: '24px', right: '24px',
    width: '44px', height: '44px', borderRadius: '50%',
    background: '#C9956B', color: '#fff', border: 'none',
    fontSize: '20px', cursor: 'pointer', opacity: '0',
    transform: 'translateY(20px)', transition: 'all 0.3s ease',
    zIndex: '999', boxShadow: '0 2px 12px rgba(201,149,107,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  });
  document.body.appendChild(btn);
  window.addEventListener("scroll", function() {
    btn.style.opacity = window.scrollY > 400 ? '1' : '0';
    btn.style.transform = window.scrollY > 400 ? 'translateY(0)' : 'translateY(20px)';
  });
  btn.addEventListener("click", function() { window.scrollTo({ top: 0, behavior: "smooth" }); });
})();
