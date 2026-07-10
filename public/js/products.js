// Bo Mei Er Products — Data Loader & Renderer
// 資料來源：優先讀取 products.json（本地靜態），再背景更新 Supabase 資料

function BME_formatPrice(price) {
  if (typeof price === 'string' && price.startsWith('NT$')) return price;
  return 'NT$ ' + Number(price);
}

const BME = {
  products: [],
  currentFilter: 'all',
  _supabaseUpdated: false,
  _initPromise: null,

  async init() {
    if (this._initPromise) return this._initPromise;
    this._initPromise = this._doInit();
    return this._initPromise;
  },

  async _doInit() {
    await this.loadProducts();
    this.setupFilters();
    this.refreshFilterCounts();
  },

  async loadProducts() {
    // Step 1: Load from local products.json FIRST (no external dependency)
    try {
      const resp = await fetch('products.json');
      if (resp.ok) {
        const json = await resp.json();
        this.products = (json.products || []).map(p => ({ ...p, price: BME_formatPrice(p.price) }));
      }
    } catch (e) {
      console.warn('products.json load failed:', e);
    }

    // If local data loaded, try Supabase in background for fresher data
    if (this.products.length > 0) {
      this._trySupabaseInBackground();
      return;
    }

    // Last resort — try Supabase synchronously
    await this._trySupabaseSync();

    if (this.products.length === 0) {
      this.showError('無法載入商品資料，請稍後再試。');
    }
  },

  // Background Supabase load — doesn't block rendering
  _trySupabaseInBackground() {
    setTimeout(async () => {
      try {
        if (typeof initSupabase !== 'function') return;
        const client = await initSupabase();
        if (!client) return;
        const { data, error } = await client
          .from('products')
          .select('*')
          .in('status', ['上架', '即將上架', '試作中'])
          .order('date_added', { ascending: false });
        if (error || !data || data.length === 0) return;
                // Only overwrite if the returned products use the same SKU set
        var supabaseSkus = data.map(function(p) { return p.sku; });
        var currentSkus = this.products.map(function(p) { return p.sku; });
        var matchCount = supabaseSkus.filter(function(s) { return currentSkus.indexOf(s) >= 0; }).length;
        // Only use Supabase data if at least half the SKUs match (prevent old data override)
        if (matchCount >= data.length * 0.5) {
          this.products = data.map(p => ({ ...p, price: BME_formatPrice(p.price) }));
        } else {
          console.warn('Supabase data mismatch - keeping local products.json data');
          return;
        }
        this._supabaseUpdated = true;
        this._reRenderCurrentView();
      } catch (e) {
        console.warn('Supabase background load failed (non-critical):', e);
      }
    }, 100);
  },

  async _trySupabaseSync() {
    try {
      if (typeof initSupabase !== 'function') return;
      const client = await initSupabase();
      if (!client) return;
      const { data, error } = await client
        .from('products')
        .select('*')
        .in('status', ['上架', '即將上架', '試作中'])
        .order('date_added', { ascending: false });
      if (!error && data && data.length > 0) {
                // Only overwrite if the returned products use the same SKU set
        var supabaseSkus = data.map(function(p) { return p.sku; });
        var currentSkus = this.products.map(function(p) { return p.sku; });
        var matchCount = supabaseSkus.filter(function(s) { return currentSkus.indexOf(s) >= 0; }).length;
        // Only use Supabase data if at least half the SKUs match (prevent old data override)
        if (matchCount >= data.length * 0.5) {
          this.products = data.map(p => ({ ...p, price: BME_formatPrice(p.price) }));
        } else {
          console.warn('Supabase data mismatch - keeping local products.json data');
          return;
        }
      }
    } catch (e) {
      console.warn('Supabase sync load failed:', e);
    }
  },

  _reRenderCurrentView() {
    // Re-render product grid if visible
    const grid = document.getElementById('product-grid');
    if (grid) {
      this.renderGrid('product-grid', this.currentFilter);
      this.refreshFilterCounts();
      return;
    }
    // Re-render product detail if visible
    const detailSku = window.currentProductSku;
    if (detailSku) {
      this.renderDetail(detailSku);
      this.renderRelated(detailSku);
    }
  },

  showError(msg) {
    const grid = document.querySelector('.product-grid');
    if (grid) {
      grid.innerHTML = '<p style="text-align:center;color:#888;padding:48px;">' + msg + '</p>';
    }
  },

  setupFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.onclick = (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.filter;
        this.renderGrid('product-grid', this.currentFilter);
      };
    });
  },

  getFilteredProducts(filter) {
    if (filter === 'all') return this.products;
    if (filter === 'new') return this.products.filter(p => p.status === '上架');
    return this.products.filter(p => p.style_profile === filter);
  },

  renderGrid(containerId, filter) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const filtered = this.getFilteredProducts(filter);
    if (filtered.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:#888;padding:48px;">該分類目前還沒有商品，可以先看看其他款式。</p>';
      return;
    }

    container.innerHTML = filtered.map(p => this.createCard(p)).join('');

    container.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => {
        window.location.href = 'product.html?sku=' + card.dataset.sku;
      });
    });

    // Event delegation for fav & cart buttons
    container.querySelectorAll('.fav-btn-card').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        BME_toggleFavorite(btn.dataset.sku);
      });
    });
    container.querySelectorAll('.cart-btn-card').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        BME_addToCart(btn.dataset.sku);
      });
    });
  },

  createCard(product) {
    const imgSrc = product.images && product.images[0] ? 'images/products/' + product.images[0] : '';
    const heroSrc = product.images && product.images[1] ? 'images/products/' + product.images[1] : '';

    let badge = '';
    let extraCls = '';
    let styleBadge = product.style ? '<div class="product-card-style-badge">' + product.style + '</div>' : '';
    let brandMark = '<div class="product-card-brand">鉑魅兒 · 手作</div>';

    if (product.status === '即將上架') {
      badge = '<div class="product-card-badge-coming">即將上架 · 開放追蹤</div>';
      extraCls = ' product-card-coming';
    } else if (product.status === '試作中') {
      badge = '<div class="product-card-badge-trial">試作</div>';
      extraCls = ' product-card-trial';
    }

    const styleCls = product.style_profile ? ' style-bg-' + product.style_profile : '';
    const cardCls = 'product-card' + styleCls + extraCls;

    let imgs = '';
    if (imgSrc) {
      imgs = '<img src="' + imgSrc + '" alt="' + product.product_name + '" class="product-card-main-img" loading="lazy">';
      if (heroSrc) {
        imgs += '<img src="' + heroSrc + '" alt="' + product.product_name + ' - 情境" class="product-card-hero-img" loading="lazy">';
      }
      imgs += styleBadge + brandMark;
    } else {
      imgs = '<div class="product-card-placeholder">暫無圖片</div>';
    }

    const linkUrl = product.status === '即將上架'
      ? 'https://www.instagram.com/bomeier/?utm_source=website&utm_medium=item&utm_campaign=' + product.sku
      : 'product.html?sku=' + product.sku;

    return '<a class="' + cardCls + '" data-sku="' + product.sku + '" data-style="' + product.style + '" href="' + linkUrl + '">'
      + '<div class="product-card-image">' + imgs + '</div>'
      + '<div class="product-card-body">'
      + '<div class="product-card-name">' + product.product_name + '</div>'
      + badge
      + '<div class="product-card-price">' + product.price + '</div>'
      + '<div class="product-card-actions" style="display:flex;gap:8px;margin-top:8px;">'
      + '<button class="fav-btn fav-btn-card" data-sku="' + product.sku + '" aria-label="加入收藏">♡</button>'
      + '<button class="cart-btn-card" data-sku="' + product.sku + '" aria-label="加入購物車">🛒</button>'
      + '</div>'
      + '</div></a>';
  },

  renderDetail(sku) {
    const product = this.products.find(p => p.sku === sku);
    if (!product) {
      this.showError('找不到此商品');
      return;
    }

    window.currentProductSku = sku;

    // Images
    const mainImg = document.querySelector('.product-main-image');
    const thumbs = document.querySelector('.product-thumbnails');
    if (mainImg && thumbs) {
      const images = product.images && product.images.length ? product.images : ['placeholder_01.jpg'];
      mainImg.innerHTML = images[0]
        ? '<img src="images/products/' + images[0] + '" alt="' + product.product_name + '" id="main-product-image">'
        : '<div class="product-card-placeholder" style="height:100%;">暫無圖片</div>';

      thumbs.innerHTML = images.map(function(img, i) {
        return '<div class="product-thumbnail' + (i === 0 ? ' active' : '') + '" data-index="' + i + '">'
          + '<img src="images/products/' + img + '" alt="' + product.product_name + ' - ' + (i + 1) + '">'
          + '</div>';
      }).join('');

      thumbs.querySelectorAll('.product-thumbnail').forEach(function(thumb) {
        thumb.addEventListener('click', function() {
          thumbs.querySelectorAll('.product-thumbnail').forEach(function(t) { t.classList.remove('active'); });
          thumb.classList.add('active');
          mainImg.innerHTML = '<img src="images/products/' + images[thumb.dataset.index] + '" alt="' + product.product_name + '">';
        });
      });
    }

    // Info
    var el = function(id) { return document.getElementById(id); };
    if (el('product-name')) el('product-name').textContent = product.product_name;
    if (el('product-style')) el('product-style').textContent = product.style;
    if (el('product-material')) el('product-material').textContent = product.material;
    if (el('product-description')) el('product-description').innerHTML = product.description.replace(/\\\\n/g, '<br>').replace(/\\n/g, '<br>');
    if (el('product-price')) el('product-price').textContent = product.price;
    if (el('product-status')) el('product-status').textContent = product.status;

    document.title = product.product_name + ' | 鉑魅兒 Bo Mei Er';

    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', product.description.substring(0, 150));

    // Tags
    var tagsEl = el('product-tags');
    if (tagsEl && product.tags) {
      tagsEl.innerHTML = product.tags.map(function(t) { return '<span class="product-tag">' + t + '</span>'; }).join('');
    }

    // Breadcrumb
    var bc = el('breadcrumb-product');
    if (bc) bc.textContent = product.product_name;

    // CTA
    var cta = el('cta-btn');
    if (cta) cta.href = 'https://www.instagram.com/bomeier/?utm_source=website&utm_medium=product&utm_campaign=' + sku;

    // Share links
    var pageUrl = encodeURIComponent(window.location.href);
    var shareText = encodeURIComponent(product.product_name);
    var lb = el('share-line');
    if (lb) lb.href = 'https://line.me/R/msg/text/?' + shareText + '%20' + pageUrl;
    var fb = el('share-fb');
    if (fb) fb.href = 'https://www.facebook.com/sharer/sharer.php?u=' + pageUrl;
  },

  refreshFilterCounts() {
    var counts = this.getFilterCounts();
    var labels = {
      'all': '全部', 'new': '新品上架', 'romantic_rose': '浪漫復古',
      'clear_pastel': '清透日常', 'porcelain_blue': '霧藍瓷感',
      'sage_natural': '自然清新', 'midnight_luxury': '午夜精品'
    };
    document.querySelectorAll('.filter-btn').forEach(function(btn) {
      var f = btn.dataset.filter;
      if (counts[f] !== undefined && labels[f]) {
        btn.innerHTML = labels[f] + ' (' + counts[f] + ')';
      }
    });
  },

  getFilterCounts() {
    var counts = { 'all': this.products.length };
    counts['new'] = this.products.filter(function(p) { return p.status === '上架'; }).length;
    var self = this;
    ['romantic_rose', 'clear_pastel', 'porcelain_blue', 'sage_natural', 'midnight_luxury'].forEach(function(s) {
      counts[s] = self.products.filter(function(p) { return p.style_profile === s; }).length;
    });
    return counts;
  },

  renderRelated(sku) {
    var container = document.getElementById('related-products');
    if (!container) return;
    var product = this.products.find(function(p) { return p.sku === sku; });
    if (!product) return;
    var sameStyle = this.products.filter(function(p) {
      return p.sku !== sku && p.style_profile === product.style_profile && p.status === '上架';
    });
    var related = sameStyle.length >= 3 ? sameStyle : this.products.filter(function(p) {
      return p.sku !== sku && p.status === '上架';
    });
    related = related.slice(0, 4);
    if (related.length === 0) { container.style.display = 'none'; return; }
    container.style.display = 'block';
    container.querySelector('.related-grid').innerHTML = related.map(function(p) {
      var img = p.images && p.images[0] ? 'images/products/' + p.images[0] : '';
      var hero = p.images && p.images[1] ? 'images/products/' + p.images[1] : '';
      var sb = p.style ? '<div class="product-card-style-badge">' + p.style + '</div>' : '';
      var bm = '<div class="product-card-brand">鉌魅兒 · 手作</div>';
      return '<a href="product.html?sku=' + p.sku + '" class="product-card'
        + (p.style_profile ? ' style-bg-' + p.style_profile : '') + '">'
        + '<div class="product-card-image">'
        + (img ? '<img src="' + img + '" alt="' + p.product_name + '" class="product-card-main-img" loading="lazy">' : '')
        + (hero ? '<img src="' + hero + '" alt="' + p.product_name + ' - 情境" class="product-card-hero-img" loading="lazy">' : '')
        + sb + bm
        + '</div>'
        + '<div class="product-card-body">'
        + '<div class="product-card-name">' + p.product_name + '</div>'
        + '<div class="product-card-price">' + p.price + '</div>'
        + '</div></a>';
    }).join('');
  }
};

// Note: BME.init() is called by each page's inline script, not here
// products.html, index.html each have their own DOMContentLoaded handler


