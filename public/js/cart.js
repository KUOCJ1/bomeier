// Bo Mei Er — Shopping Cart Module
// 初期使用 localStorage，登入後可同步到 Supabase

var BME_CART = {
  items: [],

  init: function() {
    this.loadFromLocal();
    this.injectCartUI();
    this.renderBadge();
  },

  loadFromLocal: function() {
    try {
      var saved = localStorage.getItem('bme_cart');
      this.items = saved ? JSON.parse(saved) : [];
    } catch(e) {
      this.items = [];
    }
  },

  saveToLocal: function() {
    localStorage.setItem('bme_cart', JSON.stringify(this.items));
    this.renderBadge();
  },

  add: function(product) {
    var existing = this.items.find(function(i) { return i.sku === product.sku; });
    if (existing) {
      existing.quantity += 1;
    } else {
      this.items.push({
        sku: product.sku,
        product_name: product.product_name,
        price: product.price,
        quantity: 1,
        image: (product.images && product.images[0]) ? product.images[0] : ''
      });
    }
    this.saveToLocal();
    this.showNotification('已加入購物車');
  },

  remove: function(sku) {
    this.items = this.items.filter(function(i) { return i.sku !== sku; });
    this.saveToLocal();
    this.renderPanel();
  },

  updateQuantity: function(sku, qty) {
    var item = this.items.find(function(i) { return i.sku === sku; });
    if (item) {
      item.quantity = Math.max(1, qty);
      this.saveToLocal();
      this.renderPanel();
    }
  },

  getCount: function() {
    return this.items.reduce(function(sum, i) { return sum + i.quantity; }, 0);
  },

  getTotal: function() {
    var total = 0;
    for (var i = 0; i < this.items.length; i++) {
      var price = parseInt(String(this.items[i].price).replace(/[^0-9]/g, '')) || 0;
      total += price * this.items[i].quantity;
    }
    return total;
  },

  resolveImage: function(path) {
    if (!path) return '';
    var value = String(path).trim();
    if (/^(https?:)?\/\//.test(value) || /^data:/.test(value) || value.indexOf('../') === 0 || value.indexOf('/') === 0) {
      return value;
    }
    if (value.indexOf('images/') === 0) return value;
    return 'images/products/' + value;
  },

  injectCartUI: function() {
    // Cart icon in nav
    var navLinks = document.querySelector('.nav-links');
    if (navLinks && !document.getElementById('cart-icon')) {
      var cartIcon = document.createElement('a');
      cartIcon.id = 'cart-icon';
      cartIcon.href = '#';
      cartIcon.setAttribute('onclick', 'BME_CART.togglePanel();return false;');
      cartIcon.style.cssText = 'position:relative;font-size:18px;';
      cartIcon.innerHTML = '🛒 <span id="cart-badge" class="cart-badge" style="display:none;">0</span>';
      navLinks.appendChild(cartIcon);
    }

    // Cart sidebar panel
    if (!document.getElementById('cart-panel')) {
      var panel = document.createElement('div');
      panel.id = 'cart-panel';
      panel.className = 'cart-panel';
      panel.innerHTML =
        '<div class="cart-panel-overlay" onclick="BME_CART.togglePanel()"></div>' +
        '<div class="cart-panel-content">' +
          '<div class="cart-panel-header">' +
            '<h3>購物車</h3>' +
            '<button class="cart-panel-close" onclick="BME_CART.togglePanel()">&times;</button>' +
          '</div>' +
          '<div id="cart-panel-items" class="cart-panel-items"></div>' +
          '<div class="cart-panel-footer">' +
            '<div id="cart-panel-total" class="cart-panel-total"></div>' +
            '<button class="btn btn-primary" onclick="BME_CART.checkout()" style="width:100%;">前往結帳</button>' +
            '<p style="font-size:11px;color:#999;margin-top:8px;text-align:center;">結帳後將導向 IG 私訊確認訂單</p>' +
          '</div>' +
        '</div>';
      document.body.appendChild(panel);
    }
  },

  togglePanel: function() {
    var panel = document.getElementById('cart-panel');
    if (!panel) return;
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
      this.renderPanel();
    }
  },

  renderPanel: function() {
    var container = document.getElementById('cart-panel-items');
    var totalEl = document.getElementById('cart-panel-total');
    if (!container) return;

    if (this.items.length === 0) {
      container.innerHTML = '<div class="cart-empty">購物車是空的<br><span style="font-size:13px;color:#999;">去逛逛商品吧</span></div>';
      if (totalEl) totalEl.textContent = '';
      return;
    }

    var self = this;
    container.innerHTML = this.items.map(function(item) {
      var imgHtml = item.image
        ? '<img src="' + self.resolveImage(item.image) + '" alt="' + item.product_name + '" class="cart-item-img">'
        : '<div class="cart-item-img-placeholder"></div>';
      return '<div class="cart-item">' +
        imgHtml +
        '<div class="cart-item-info">' +
          '<div class="cart-item-name">' + item.product_name + '</div>' +
          '<div class="cart-item-price">' + self.displayPrice(item.price) + '</div>' +
          '<div class="cart-item-qty">' +
            '<button onclick="BME_CART.updateQuantity(\'' + item.sku + '\',' + (item.quantity - 1) + ')" ' + (item.quantity <= 1 ? 'disabled' : '') + '>&minus;</button>' +
            '<span>' + item.quantity + '</span>' +
            '<button onclick="BME_CART.updateQuantity(\'' + item.sku + '\',' + (item.quantity + 1) + ')">+</button>' +
          '</div>' +
        '</div>' +
        '<button class="cart-item-remove" onclick="BME_CART.remove(\'' + item.sku + '\')">&times;</button>' +
      '</div>';
    }).join('');

    var total = this.getTotal();
    if (totalEl) {
      totalEl.innerHTML = '合計：<strong>NT$ ' + total.toLocaleString() + '</strong>';
    }
  },

  renderBadge: function() {
    var badge = document.getElementById('cart-badge');
    if (!badge) return;
    var count = this.getCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline' : 'none';
  },

  checkout: function() {
    // 初期透過 IG 私訊購買
    var total = this.getTotal();
    var itemsStr = this.items.map(function(i) { return i.product_name + ' x' + i.quantity; }).join('%0A');
    var msg = '嗨鉑魅兒，我想購買以下商品：%0A%0A' +
      itemsStr + '%0A%0A' +
      '合計：NT$ ' + total.toLocaleString() + '%0A%0A' +
      '請協助確認庫存與總金額，謝謝！';
    window.open('https://www.instagram.com/bomeier/?utm_source=website&utm_medium=cart&utm_campaign=checkout&text=' + msg, '_blank');
  },

  displayPrice: function(price) {
    if (typeof price === 'string' && price.startsWith('NT$')) return price;
    return 'NT$ ' + Number(price);
  },

  showNotification: function(msg) {
    var el = document.createElement('div');
    el.className = 'cart-notification';
    el.textContent = msg;
    el.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#0A1628;color:#fff;padding:10px 24px;border-radius:24px;font-size:14px;z-index:10000;opacity:0;transition:opacity 0.3s;';
    document.body.appendChild(el);
    requestAnimationFrame(function() { el.style.opacity = '1'; });
    setTimeout(function() { el.style.opacity = '0'; setTimeout(function() { el.remove(); }, 300); }, 2000);
  }
};

// Add to cart button handler
function BME_addToCart(sku) {
  // Find product from BME.products
  if (typeof BME !== 'undefined' && BME.products) {
    var product = BME.products.find(function(p) { return p.sku === sku; });
    if (product) {
      BME_CART.add(product);
    }
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // Initialize cart after everything loads
  setTimeout(function() { BME_CART.init(); }, 500);
});
