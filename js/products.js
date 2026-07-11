// Bo Mei Er Products - Data Loader & Renderer
// Static products.json is the public storefront source of truth; Supabase can add fields, but local data wins by SKU.
function BME_formatPrice(price) {
  if (typeof price === 'string' && price.startsWith('NT$')) return price;
  var number = Number(String(price || 0).replace(/[^0-9]/g, ''));
  return 'NT$ ' + number.toLocaleString('zh-TW');
}

const BME = {
  products: [],
  currentFilter: 'all',
  currentSearch: '',
  currentType: 'all',
  currentSort: 'newest',
  _initPromise: null,
  _source: 'local',
  publicStatuses: ['\u4e0a\u67b6', '\u5373\u5c07\u4e0a\u67b6', '\u8a66\u4f5c'],

  async init() {
    if (this._initPromise) return this._initPromise;
    this._initPromise = this._doInit();
    return this._initPromise;
  },

  async _doInit() {
    await this.loadProducts();
    this.applyUrlState();
    this.setupFilters();
    this.setupProductControls();
    this.refreshFilterCounts();
  },

  async loadProducts() {
    const localPromise = this.fetchLocalProducts();
    const supabasePromise = this.fetchSupabaseProducts();
    const results = await Promise.allSettled([localPromise, supabasePromise]);
    const localProducts = results[0].status === 'fulfilled' ? results[0].value : [];
    const supabaseProducts = results[1].status === 'fulfilled' ? results[1].value : [];

    this.products = this.mergeProductSources(localProducts, supabaseProducts)
      .filter(product => this.isPublicProduct(product));
    this._source = supabaseProducts.length ? 'merged' : 'local';

    if (this.products.length === 0) {
      this.showError('\u76ee\u524d\u6c92\u6709\u53ef\u986f\u793a\u7684\u5546\u54c1\uff0c\u8acb\u7a0d\u5f8c\u518d\u56de\u4f86\u770b\u770b\u3002');
    }
  },

  async fetchLocalProducts() {
    try {
      const resp = await fetch('products.json', { cache: 'no-store' });
      if (!resp.ok) return [];
      const json = await resp.json();
      return (json.products || []).map(p => this.normalizeProduct(p));
    } catch (e) {
      console.warn('products.json load failed:', e);
      return [];
    }
  },

  async fetchSupabaseProducts() {
    try {
      if (typeof initSupabase !== 'function') return [];
      const client = await initSupabase();
      if (!client) return [];
      const { data, error } = await client
        .from('products')
        .select('*')
        .order('date_added', { ascending: false });
      if (error) {
        console.warn('Supabase products load failed:', error.message || error);
        return [];
      }
      return (data || []).map(p => this.normalizeProduct(p));
    } catch (e) {
      console.warn('Supabase products load failed:', e);
      return [];
    }
  },

  mergeProductSources(localProducts, supabaseProducts) {
    var bySku = {};
    supabaseProducts.forEach(function(product) {
      if (product.sku) bySku[product.sku] = product;
    });
    localProducts.forEach(function(product) {
      if (!product.sku) return;
      var base = bySku[product.sku] || {};
      bySku[product.sku] = Object.assign({}, base, product);
    });
    return Object.keys(bySku)
      .map(function(sku) { return bySku[sku]; })
      .sort(function(a, b) {
        var aDate = new Date(a.date_added || a.created_at || 0).getTime();
        var bDate = new Date(b.date_added || b.created_at || 0).getTime();
        return bDate - aDate;
      });
  },

  normalizeProduct(product) {
    var images = Array.isArray(product.images)
      ? product.images
      : String(product.images || '').split(/[\n,]+/);
    var tags = Array.isArray(product.tags)
      ? product.tags
      : String(product.tags || '').split(/[\n,]+/);
    var normalized = Object.assign({}, product, {
      sku: String(product.sku || '').trim(),
      product_name: product.product_name || product.name || '',
      price: BME_formatPrice(product.price),
      images: images.map(function(item) { return String(item || '').trim(); }).filter(Boolean),
      tags: tags.map(function(item) { return String(item || '').trim(); }).filter(Boolean),
      status: product.status || '\u4e0a\u67b6',
      style_profile: product.style_profile || '',
      description: product.description || '',
      material: product.material || '',
      style: product.style || '',
      feature: product.feature || ''
    });
    normalized.product_type = product.product_type || this.getProductType(normalized);
    return normalized;
  },

  isPublicProduct(product) {
    return this.publicStatuses.indexOf(product.status) >= 0 && !product.is_sold && !this.isHiddenLegacyProduct(product);
  },

  isHiddenLegacyProduct(product) {
    var sku = String(product && product.sku ? product.sku : '');
    var match = sku.match(/^BM-T(\d{3})$/);
    return !!(match && Number(match[1]) < 32);
  },

  resolveProductImage(path) {
    if (!path) return '';
    var value = String(path).trim();
    if (/^(https?:)?\/\//.test(value) || /^data:/.test(value) || value.indexOf('../') === 0 || value.indexOf('/') === 0) {
      return value;
    }
    if (value.indexOf('images/') === 0) return value;
    return 'images/products/' + value;
  },

  escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  getNumericPrice(product) {
    return parseInt(String(product.price || '').replace(/[^0-9]/g, ''), 10) || 0;
  },

  getProductType(product) {
    var text = [
      product.product_name,
      product.sku,
      product.material,
      product.feature,
      product.description,
      (product.tags || []).join(' ')
    ].join(' ').toLowerCase();
    if (/earring/.test(text)) return 'earrings';
    if (/bracelet/.test(text)) return 'bracelet';
    if (/necklace|pendant/.test(text)) return 'necklace';
    if (/keychain|charm/.test(text)) return 'keychain';
    if (/phone|strap|BM-T|BM-R|BM-S|BM-N/i.test(text)) return 'phone_strap';
    return 'other';
  },

  applyUrlState() {
    var params = new URLSearchParams(window.location.search);
    this.currentFilter = params.get('filter') || this.currentFilter || 'all';
    this.currentSearch = params.get('q') || '';
    this.currentType = params.get('type') || 'all';
    this.currentSort = params.get('sort') || 'newest';
  },

  updateUrlState() {
    if (!document.body || !document.getElementById('product-search')) return;
    var params = new URLSearchParams(window.location.search);
    this.currentFilter === 'all' ? params.delete('filter') : params.set('filter', this.currentFilter);
    this.currentSearch ? params.set('q', this.currentSearch) : params.delete('q');
    this.currentType === 'all' ? params.delete('type') : params.set('type', this.currentType);
    this.currentSort === 'newest' ? params.delete('sort') : params.set('sort', this.currentSort);
    var nextUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '') + window.location.hash;
    window.history.replaceState({}, '', nextUrl);
  },

  _reRenderCurrentView() {
    const grid = document.getElementById('product-grid');
    if (grid) {
      this.renderGrid('product-grid', this.currentFilter);
      this.refreshFilterCounts();
      return;
    }
    const detailSku = window.currentProductSku;
    if (detailSku) {
      this.renderDetail(detailSku);
      this.renderRelated(detailSku);
    }
  },

  showError(msg) {
    const grid = document.querySelector('.product-grid');
    if (grid) {
      grid.innerHTML = '<p style="text-align:center;color:#888;padding:48px;">' + this.escapeHtml(msg) + '</p>';
    }
  },

  setupFilters() {
    var self = this;
    document.querySelectorAll('.filter-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.filter === self.currentFilter);
      btn.onclick = function() {
        document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        self.currentFilter = btn.dataset.filter || 'all';
        self.updateUrlState();
        self.renderGrid('product-grid', self.currentFilter);
      };
    });
  },

  setupProductControls() {
    var search = document.getElementById('product-search');
    var type = document.getElementById('product-type');
    var sort = document.getElementById('product-sort');
    var self = this;
    if (search) search.value = this.currentSearch;
    if (type) type.value = this.currentType;
    if (sort) sort.value = this.currentSort;

    var rerender = function() {
      self.currentSearch = search ? search.value.trim() : '';
      self.currentType = type ? type.value : 'all';
      self.currentSort = sort ? sort.value : 'newest';
      self.updateUrlState();
      self.renderGrid('product-grid', self.currentFilter);
    };
    if (search) search.addEventListener('input', rerender);
    if (type) type.addEventListener('change', rerender);
    if (sort) sort.addEventListener('change', rerender);
  },

  getFilteredProducts(filter) {
    var list = this.products.slice();
    if (filter === 'new') {
      list = list.filter(function(p) { return p.status === '\u4e0a\u67b6'; });
    } else if (filter && filter !== 'all') {
      list = list.filter(function(p) { return p.style_profile === filter; });
    }

    if (this.currentType && this.currentType !== 'all') {
      var self = this;
      list = list.filter(function(p) { return self.getProductType(p) === self.currentType; });
    }

    if (this.currentSearch) {
      var keyword = this.currentSearch.toLowerCase();
      list = list.filter(function(p) {
        return [
          p.product_name,
          p.sku,
          p.style,
          p.style_profile,
          p.material,
          p.feature,
          p.description,
          (p.tags || []).join(' ')
        ].join(' ').toLowerCase().indexOf(keyword) >= 0;
      });
    }

    return this.sortProducts(list);
  },

  sortProducts(list) {
    var self = this;
    var sorted = list.slice();
    if (this.currentSort === 'price_asc') {
      sorted.sort(function(a, b) { return self.getNumericPrice(a) - self.getNumericPrice(b); });
    } else if (this.currentSort === 'price_desc') {
      sorted.sort(function(a, b) { return self.getNumericPrice(b) - self.getNumericPrice(a); });
    } else if (this.currentSort === 'name_asc') {
      sorted.sort(function(a, b) { return String(a.product_name).localeCompare(String(b.product_name), 'zh-Hant'); });
    } else {
      sorted.sort(function(a, b) {
        var aDate = new Date(a.date_added || a.created_at || 0).getTime();
        var bDate = new Date(b.date_added || b.created_at || 0).getTime();
        return bDate - aDate;
      });
    }
    return sorted;
  },

  renderGrid(containerId, filter) {
    const container = document.getElementById(containerId);
    if (!container) return;
    var activeFilter = filter || this.currentFilter || 'all';
    this.currentFilter = activeFilter;

    const filtered = this.getFilteredProducts(activeFilter);
    this.refreshResultCount(filtered.length);
    if (filtered.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:#888;padding:48px;">\u76ee\u524d\u6c92\u6709\u7b26\u5408\u689d\u4ef6\u7684\u5546\u54c1\uff0c\u53ef\u4ee5\u63db\u500b\u5206\u985e\u770b\u770b\u3002</p>';
      return;
    }

    var limit = container.dataset.limit ? parseInt(container.dataset.limit, 10) : 0;
    var visible = limit > 0 ? filtered.slice(0, limit) : filtered;
    container.innerHTML = visible.map(p => this.createCard(p)).join('');

    container.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => {
        window.location.href = card.getAttribute('href') || ('product.html?sku=' + card.dataset.sku);
      });
    });

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
    const imgSrc = product.images && product.images[0] ? this.resolveProductImage(product.images[0]) : '';

    let badge = '';
    let extraCls = '';
    let styleBadge = product.style ? '<div class="product-card-style-badge">' + this.escapeHtml(product.style) + '</div>' : '';
    let brandMark = '<div class="product-card-brand">\u9251\u9b45\u5152 ? \u624b\u4f5c</div>';

    if (product.status === '\u5373\u5c07\u4e0a\u67b6') {
      badge = '<div class="product-card-badge-coming">\u5373\u5c07\u4e0a\u67b6 ? \u958b\u653e\u8ffd\u8e64</div>';
      extraCls = ' product-card-coming';
    } else if (product.status === '\u8a66\u4f5c') {
      badge = '<div class="product-card-badge-trial">\u8a66\u4f5c</div>';
      extraCls = ' product-card-trial';
    }

    const styleCls = product.style_profile ? ' style-bg-' + product.style_profile : '';
    const cardCls = 'product-card' + styleCls + extraCls;

    let imgs = '';
    if (imgSrc) {
      imgs = '<img src="' + this.escapeHtml(imgSrc) + '" alt="' + this.escapeHtml(product.product_name) + '" class="product-card-main-img" loading="lazy">';
      imgs += styleBadge + brandMark;
    } else {
      imgs = '<div class="product-card-placeholder">\u66ab\u7121\u5716\u7247</div>';
    }

    const linkUrl = product.status === '\u5373\u5c07\u4e0a\u67b6'
      ? 'https://www.instagram.com/bomeier/?utm_source=website&utm_medium=item&utm_campaign=' + encodeURIComponent(product.sku)
      : 'product.html?sku=' + encodeURIComponent(product.sku);

    return '<a class="' + cardCls + '" data-sku="' + this.escapeHtml(product.sku) + '" data-style="' + this.escapeHtml(product.style) + '" href="' + linkUrl + '">'
      + '<div class="product-card-image">' + imgs + '</div>'
      + '<div class="product-card-body">'
      + '<div class="product-card-name">' + this.escapeHtml(product.product_name) + '</div>'
      + badge
      + '<div class="product-card-price">' + this.escapeHtml(product.price) + '</div>'
      + '<div class="product-card-actions" style="display:flex;gap:8px;margin-top:8px;">'
      + '<button class="fav-btn fav-btn-card" data-sku="' + this.escapeHtml(product.sku) + '" aria-label="\u52a0\u5165\u6536\u85cf">&#9825;</button>'
      + '<button class="cart-btn-card" data-sku="' + this.escapeHtml(product.sku) + '" aria-label="\u52a0\u5165\u8cfc\u7269\u8eca">+</button>'
      + '</div>'
      + '</div></a>';
  },

  renderDetail(sku) {
    const product = this.products.find(p => p.sku === sku);
    if (!product) {
      this.showError('\u627e\u4e0d\u5230\u9019\u500b\u5546\u54c1');
      return;
    }

    window.currentProductSku = sku;

    const mainImg = document.querySelector('.product-main-image');
    const thumbs = document.querySelector('.product-thumbnails');
    if (mainImg && thumbs) {
      const images = product.images && product.images.length ? product.images : ['placeholder_01.jpg'];
      const firstImage = this.resolveProductImage(images[0]);
      mainImg.innerHTML = firstImage
        ? '<button class="product-zoom-trigger" type="button" aria-label="\u653e\u5927\u67e5\u770b\u5546\u54c1\u7167\u7247"><img src="' + this.escapeHtml(firstImage) + '" alt="' + this.escapeHtml(product.product_name) + '" id="main-product-image"><span>\u9ede\u5716\u653e\u5927</span></button>'
        : '<div class="product-card-placeholder" style="height:100%;">\u66ab\u7121\u5716\u7247</div>';

      var self = this;
      thumbs.innerHTML = images.map(function(img, i) {
        return '<div class="product-thumbnail' + (i === 0 ? ' active' : '') + '" data-index="' + i + '">'
          + '<img src="' + self.escapeHtml(self.resolveProductImage(img)) + '" alt="' + self.escapeHtml(product.product_name) + ' - ' + (i + 1) + '">'
          + '</div>';
      }).join('');

      thumbs.querySelectorAll('.product-thumbnail').forEach(function(thumb) {
        thumb.addEventListener('click', function() {
          thumbs.querySelectorAll('.product-thumbnail').forEach(function(t) { t.classList.remove('active'); });
          thumb.classList.add('active');
          var selected = self.resolveProductImage(images[thumb.dataset.index]);
          mainImg.innerHTML = '<button class="product-zoom-trigger" type="button" aria-label="\u653e\u5927\u67e5\u770b\u5546\u54c1\u7167\u7247"><img src="' + self.escapeHtml(selected) + '" alt="' + self.escapeHtml(product.product_name) + '"><span>\u9ede\u5716\u653e\u5927</span></button>';
          self.bindProductZoom(product.product_name);
        });
      });
      this.bindProductZoom(product.product_name);
    }

    var el = function(id) { return document.getElementById(id); };
    if (el('product-name')) el('product-name').textContent = product.product_name;
    if (el('product-style')) el('product-style').textContent = product.style;
    if (el('product-material')) el('product-material').textContent = product.material;
    if (el('product-description')) el('product-description').innerHTML = this.escapeHtml(product.description).replace(/\\\\n/g, '<br>').replace(/\\n/g, '<br>');
    if (el('product-price')) el('product-price').textContent = product.price;
    if (el('product-status')) el('product-status').textContent = product.status;

    document.title = product.product_name + ' | \u9251\u9b45\u5152 Bo Mei Er';

    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', product.description.substring(0, 150));

    var tagsEl = el('product-tags');
    if (tagsEl && product.tags) {
      tagsEl.innerHTML = product.tags.map(function(t) { return '<span class="product-tag">' + BME.escapeHtml(t) + '</span>'; }).join('');
    }

    var bc = el('breadcrumb-product');
    if (bc) bc.textContent = product.product_name;

    var cta = el('cta-btn');
    if (cta) cta.href = 'https://www.instagram.com/bomeier/?utm_source=website&utm_medium=product&utm_campaign=' + encodeURIComponent(sku);

    var pageUrl = encodeURIComponent(window.location.href);
    var shareText = encodeURIComponent(product.product_name);
    var lb = el('share-line');
    if (lb) lb.href = 'https://line.me/R/msg/text/?' + shareText + '%20' + pageUrl;
    var fb = el('share-fb');
    if (fb) fb.href = 'https://www.facebook.com/sharer/sharer.php?u=' + pageUrl;
  },

  bindProductZoom(productName) {
    var modal = document.getElementById('product-zoom-modal');
    var zoomImage = document.getElementById('product-zoom-image');
    var close = document.getElementById('product-zoom-close');
    var trigger = document.querySelector('.product-zoom-trigger');
    if (!modal || !zoomImage || !trigger) return;

    var closeZoom = function() {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('zoom-open');
    };

    trigger.onclick = function() {
      var img = trigger.querySelector('img');
      if (!img) return;
      zoomImage.src = img.currentSrc || img.src;
      zoomImage.alt = productName || img.alt || '';
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('zoom-open');
    };
    if (close) close.onclick = closeZoom;
    modal.onclick = function(event) {
      if (event.target === modal) closeZoom();
    };
    document.onkeydown = function(event) {
      if (event.key === 'Escape' && modal.classList.contains('active')) closeZoom();
    };
  },

  refreshResultCount(count) {
    var node = document.getElementById('product-result-count');
    if (!node) return;
    var suffix = this.currentSearch ? '\uff0c\u641c\u5c0b\uff1a' + this.currentSearch : '';
    node.textContent = '\u986f\u793a ' + count + ' \u4ef6\u5546\u54c1' + suffix;
  },

  refreshFilterCounts() {
    var counts = this.getFilterCounts();
    var labels = {
      'all': '\u5168\u90e8', 'new': '\u65b0\u54c1\u4e0a\u67b6', 'romantic_rose': '\u6d6a\u6f2b\u5fa9\u53e4',
      'clear_pastel': '\u6e05\u900f\u65e5\u5e38', 'porcelain_blue': '\u9727\u85cd\u74f7\u611f',
      'sage_natural': '\u81ea\u7136\u6e05\u65b0', 'midnight_luxury': '\u5348\u591c\u7cbe\u54c1'
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
    counts['new'] = this.products.filter(function(p) { return p.status === '\u4e0a\u67b6'; }).length;
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
      return p.sku !== sku && p.style_profile === product.style_profile && p.status === '\u4e0a\u67b6';
    });
    var related = sameStyle.length >= 3 ? sameStyle : this.products.filter(function(p) {
      return p.sku !== sku && p.status === '\u4e0a\u67b6';
    });
    related = related.slice(0, 4);
    if (related.length === 0) { container.style.display = 'none'; return; }
    container.style.display = 'block';
    container.querySelector('.related-grid').innerHTML = related.map(function(p) {
      return BME.createCard(p);
    }).join('');
  }
};

// Note: BME.init() is called by each page's inline script.
