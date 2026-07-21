// Bo Mei Er - Admin Dashboard
// 依賴：auth.js, supabase-config.js

var BME_ADMIN = {
  adminEmail: null,
  adminRole: null,
  productEditorId: null,
  postEditorId: null,
  adminEmailAllowlist: ['kuocj1@gmail.com', 'bomei.cheng1116@gmail.com'],
  roleLabels: {
    owner: '擁有者',
    admin: '管理員',
    fulfillment: '訂單處理',
    editor: '內容編輯',
    user: '一般會員'
  },
  pagePermissions: {
    orders: 'orders:read',
    custom: 'orders:read',
    'custom-options': 'content:write',
    products: 'content:write',
    posts: 'content:write',
    permissions: 'permissions:write'
  },
  rolePermissions: {
    owner: ['orders:read', 'orders:write', 'content:write', 'permissions:write'],
    admin: ['orders:read', 'orders:write', 'content:write'],
    fulfillment: ['orders:read', 'orders:write'],
    editor: ['content:write'],
    user: []
  },
  storageBucket: 'product-images',
  customOptionGroups: {
    style: '風格情境',
    metal: '金屬材質',
    length: '鏈長規格',
    type: '商品種類'
  },

  init: function() {
    var self = this;
    BME_getUser().then(function(user) {
      if (!user) {
        window.location.href = '../login.html?redirect=admin/orders.html';
        return;
      }

      initSupabase().then(function(client) {
        client.from('profiles').select('role').eq('id', user.id).single().then(function(res) {
          var role = (res && res.data && res.data.role) ? res.data.role : 'user';
          var isAllowlisted = user && user.email && BME_ADMIN.adminEmailAllowlist.indexOf(user.email.toLowerCase()) >= 0;
          if (isAllowlisted) role = 'owner';
          if (BME_ADMIN.isAdminRole(role)) {
            self.adminEmail = user.email;
            self.adminRole = role;
            var loading = document.getElementById('admin-loading');
            var content = document.getElementById('admin-content');
            var email = document.getElementById('admin-email');
            if (loading) loading.style.display = 'none';
            if (content) content.style.display = 'block';
            if (email) email.textContent = user.email + ' · ' + self.getRoleLabel(role);
            self.applyNavigationPermissions();
            self.loadPage(self.getAllowedPage(self.getPage()));
          } else {
            var fail = document.getElementById('admin-loading');
            if (fail) {
              fail.innerHTML = '<p style="color:#C97B6B;">你沒有管理員權限。</p><a href="../index.html" class="btn btn-secondary" style="margin-top:12px;">回首頁</a>';
            }
          }
        }).catch(function(err) {
          var failNode = document.getElementById('admin-loading');
          if (failNode) failNode.innerHTML = '<p style="color:#C97B6B;">驗證失敗：' + BME_ADMIN.escapeHtml((err && err.message) ? err.message : '請稍後再試') + '</p>';
        });
      });
    });
  },

  getPage: function() {
    return new URLSearchParams(window.location.search).get('page') || 'orders';
  },

  loadPage: function(page) {
    page = this.getAllowedPage(page);
    var navBtns = document.querySelectorAll('.admin-nav-btn');
    navBtns.forEach(function(btn) { btn.classList.remove('active'); });
    var active = document.querySelector('.admin-nav-btn[data-page="' + page + '"]');
    if (active) active.classList.add('active');

    if (page === 'orders') this.renderOrders();
    else if (page === 'custom') this.renderCustomOrders();
    else if (page === 'custom-options') this.renderCustomOptions();
    else if (page === 'products') this.renderProducts();
    else if (page === 'posts') this.renderPosts();
    else if (page === 'permissions') this.renderPermissions();
  },

  isAdminRole: function(role) {
    return ['owner', 'admin', 'fulfillment', 'editor'].indexOf(role) >= 0;
  },

  getRoleLabel: function(role) {
    return this.roleLabels[role] || role || '未設定';
  },

  hasPermission: function(permission) {
    var permissions = this.rolePermissions[this.adminRole] || [];
    return permissions.indexOf(permission) >= 0;
  },

  requirePermission: function(permission, message) {
    if (this.hasPermission(permission)) return true;
    alert(message || '你的角色沒有執行這個操作的權限。');
    return false;
  },

  getAllowedPage: function(page) {
    var target = page || 'orders';
    var needed = this.pagePermissions[target];
    if (!needed || this.hasPermission(needed)) return target;
    var fallback = ['orders', 'custom', 'products', 'posts', 'custom-options', 'permissions'].find(function(candidate) {
      var perm = BME_ADMIN.pagePermissions[candidate];
      return perm && BME_ADMIN.hasPermission(perm);
    });
    return fallback || 'orders';
  },

  applyNavigationPermissions: function() {
    document.querySelectorAll('.admin-nav-btn').forEach(function(btn) {
      var page = btn.dataset.page;
      var permission = BME_ADMIN.pagePermissions[page];
      var allowed = !permission || BME_ADMIN.hasPermission(permission);
      btn.style.display = allowed ? '' : 'none';
      btn.disabled = !allowed;
    });
  },

  escapeHtml: function(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  formatDate: function(value) {
    if (!value) return '—';
    var d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
  },

  formatShortDate: function(value) {
    if (!value) return '—';
    var d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' });
  },

  imageSrc: function(path, folder) {
    if (!path) return '';
    if (/^https?:\/\//.test(path) || /^data:/.test(path) || /^\/\//.test(path) || path.indexOf('../') === 0 || path.indexOf('images/') === 0 || path.indexOf('/') === 0) {
      return path;
    }
    return (folder || '../images/products/') + path;
  },

  parseList: function(value) {
    if (!value) return [];
    return String(value)
      .split(/[\n,]+/)
      .map(function(item) { return item.trim(); })
      .filter(function(item) { return item; });
  },

  renderEmpty: function(container, message) {
    container.innerHTML = '<div class="empty-state"><p>' + this.escapeHtml(message) + '</p></div>';
  },

  renderStatCards: function(cards) {
    return '<div class="admin-stats">' + cards.map(function(card) {
      return '<div class="admin-stat-card">' +
        '<span>' + BME_ADMIN.escapeHtml(card.label) + '</span>' +
        '<strong>' + BME_ADMIN.escapeHtml(card.value) + '</strong>' +
      '</div>';
    }).join('') + '</div>';
  },

  getControlValue: function(id) {
    var node = document.getElementById(id);
    return node ? node.value.trim() : '';
  },

  matchesText: function(value, keyword) {
    if (!keyword) return true;
    return String(value || '').toLowerCase().indexOf(keyword.toLowerCase()) >= 0;
  },

  renderImagePreview: function(textareaId, previewId, folder) {
    var source = document.getElementById(textareaId);
    var preview = document.getElementById(previewId);
    if (!source || !preview) return;
    var images = this.parseList(source.value).slice(0, 4);
    if (images.length === 0) {
      preview.innerHTML = '<div class="admin-image-empty">尚未填寫圖片</div>';
      return;
    }
    preview.innerHTML = images.map(function(img) {
      var src = BME_ADMIN.imageSrc(img, folder);
      return '<figure class="admin-image-preview-item">' +
        '<img src="' + BME_ADMIN.escapeHtml(src) + '" alt="圖片預覽" loading="lazy">' +
        '<figcaption>' + BME_ADMIN.escapeHtml(img) + '</figcaption>' +
      '</figure>';
    }).join('');
  },

  setButtonBusy: function(buttonId, busy, label) {
    var btn = document.getElementById(buttonId);
    if (!btn) return;
    if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;
    btn.disabled = !!busy;
    btn.textContent = busy ? (label || '處理中…') : btn.dataset.originalText;
  },

  safeFileSegment: function(value) {
    return String(value || 'product')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'product';
  },

  appendTextareaLines: function(textareaId, lines) {
    var field = document.getElementById(textareaId);
    if (!field) return;
    var current = this.parseList(field.value);
    field.value = current.concat(lines).join('\n');
  },

  uploadProductImages: function(fileInputId, textareaId, previewId) {
    if (!this.requirePermission('content:write')) return;
    var input = document.getElementById(fileInputId);
    var files = input && input.files ? Array.prototype.slice.call(input.files) : [];
    if (files.length === 0) {
      alert('請先選擇要上傳的圖片');
      return;
    }

    var skuField = document.getElementById('product-sku');
    var sku = this.safeFileSegment(skuField ? skuField.value : 'product');
    this.setButtonBusy('product-upload-btn', true, '上傳中…');

    initSupabase().then(function(client) {
      var uploaded = [];
      var chain = files.reduce(function(promise, file) {
        return promise.then(function() {
          if (!/^image\//.test(file.type)) {
            throw new Error('只能上傳圖片檔：' + file.name);
          }
          var ext = file.name.indexOf('.') >= 0 ? file.name.split('.').pop() : 'jpg';
          var name = Date.now() + '-' + BME_ADMIN.safeFileSegment(file.name.replace(/\.[^.]+$/, '')) + '.' + BME_ADMIN.safeFileSegment(ext);
          var path = 'products/' + sku + '/' + name;
          return client.storage
            .from(BME_ADMIN.storageBucket)
            .upload(path, file, { cacheControl: '3600', upsert: true })
            .then(function(res) {
              if (res && res.error) throw res.error;
              var publicRes = client.storage.from(BME_ADMIN.storageBucket).getPublicUrl(path);
              if (publicRes && publicRes.data && publicRes.data.publicUrl) {
                uploaded.push(publicRes.data.publicUrl);
              }
            });
        });
      }, Promise.resolve());

      chain.then(function() {
        BME_ADMIN.setButtonBusy('product-upload-btn', false);
        BME_ADMIN.appendTextareaLines(textareaId, uploaded);
        BME_ADMIN.renderImagePreview(textareaId, previewId, '../images/products/');
        input.value = '';
        alert('已上傳 ' + uploaded.length + ' 張圖片，並加入圖片清單');
      }).catch(function(err) {
        BME_ADMIN.setButtonBusy('product-upload-btn', false);
        alert('圖片上傳失敗：' + ((err && err.message) ? err.message : '請確認 Supabase Storage bucket 已建立'));
      });
    }).catch(function(err) {
      BME_ADMIN.setButtonBusy('product-upload-btn', false);
      alert('圖片上傳失敗：' + ((err && err.message) ? err.message : '請稍後再試'));
    });
  },

  renderOrders: function() {
    if (!this.requirePermission('orders:read')) return;
    var container = document.getElementById('admin-panel-content');
    if (!container) return;
    container.innerHTML = '<div class="skeleton-loading" style="padding:40px;text-align:center;">載入訂單…</div>';

    initSupabase().then(function(client) {
      client.from('orders').select('*').order('created_at', { ascending: false }).then(function(res) {
        var orders = res.data || [];
        if (orders.length === 0) {
          BME_ADMIN.renderEmpty(container, '還沒有訂單記錄');
          return;
        }

        var statusLabels = { pending: '待確認', confirmed: '已確認', shipped: '已出貨', completed: '已完成', cancelled: '已取消', refunded: '已退款' };
        var statusColors = { pending: '#D4A574', confirmed: '#8FB8C9', shipped: '#7BAE7F', completed: '#0A1628', cancelled: '#C97B6B', refunded: '#999' };
        var pendingCount = orders.filter(function(o) { return o.status === 'pending'; }).length;
        var openCount = orders.filter(function(o) { return ['pending', 'confirmed', 'shipped'].indexOf(o.status) >= 0; }).length;
        var revenue = orders.reduce(function(sum, o) { return sum + (parseInt(o.amount, 10) || 0); }, 0);

        var html = '<div class="admin-toolbar"><div><h2 style="margin:0;font-size:18px;color:#0A1628;">訂單管理</h2><p style="margin:4px 0 0;color:#777;font-size:13px;">追蹤一般商品訂單狀態。</p></div></div>';
        html += BME_ADMIN.renderStatCards([
          { label: '訂單總數', value: orders.length },
          { label: '待確認', value: pendingCount },
          { label: '處理中', value: openCount },
          { label: '累計金額', value: 'NT$ ' + revenue }
        ]);
        html += '<div style="overflow-x:auto;"><table class="admin-table"><thead><tr>' +
          '<th>日期</th><th>商品</th><th>數量</th><th>金額</th><th>客戶</th><th>聯絡方式</th><th>狀態</th><th>操作</th></tr></thead><tbody>';

        html += orders.map(function(o) {
          var date = BME_ADMIN.formatShortDate(o.created_at);
          return '<tr>' +
            '<td>' + date + '</td>' +
            '<td>' + BME_ADMIN.escapeHtml(o.sku || '—') + '</td>' +
            '<td>' + BME_ADMIN.escapeHtml(o.quantity || 1) + '</td>' +
            '<td>NT$ ' + BME_ADMIN.escapeHtml(o.amount || '—') + '</td>' +
            '<td>' + BME_ADMIN.escapeHtml(o.customer_name || '—') + '</td>' +
            '<td>' + BME_ADMIN.escapeHtml(o.contact_method || '—') + '</td>' +
            '<td><span class="status-badge" style="background:' + (statusColors[o.status] || '#999') + ';">' + (statusLabels[o.status] || BME_ADMIN.escapeHtml(o.status || '—')) + '</span></td>' +
            '<td><select class="admin-status-select" data-order-id="' + o.id + '" onchange="BME_ADMIN.updateOrderStatus(this)">' +
              Object.keys(statusLabels).map(function(k) {
                return '<option value="' + k + '"' + (o.status === k ? ' selected' : '') + '>' + statusLabels[k] + '</option>';
              }).join('') +
            '</select></td>' +
          '</tr>';
        }).join('');

        html += '</tbody></table></div>';
        container.innerHTML = html;
      });
    });
  },

  renderCustomOrders: function() {
    if (!this.requirePermission('orders:read')) return;
    var container = document.getElementById('admin-panel-content');
    if (!container) return;
    container.innerHTML = '<div class="skeleton-loading" style="padding:40px;text-align:center;">載入客製化訂單…</div>';

    var styleLabels = { romantic_rose: '浪漫復古', clear_pastel: '清透日常', porcelain_blue: '霧藍瓷感', sage_natural: '自然清新', midnight_luxury: '午夜精品' };
    var metalLabels = { rose_gold: '玫瑰金', warm_gold: '暖金色', silver: '銀色', black: '黑色' };
    var lengthLabels = { choker: '短鏈', medium: '中鏈', long: '長鏈', custom_length: '客製' };
    var typeLabels = { phone_strap: '手機鏈', earrings: '耳環', bracelet: '手鍊', necklace: '項鍊', keychain: '鑰匙圈', other: '其他' };
        var statusLabels = { pending: '待處理', discussing: '討論中', confirmed: '已確認', in_production: '製作中', shipped: '已出貨', completed: '已完成', cancelled: '已取消' };
        var statusColors = { pending: '#D4A574', discussing: '#8FB8C9', confirmed: '#0A1628', in_production: '#7BAE7F', shipped: '#7BAE7F', completed: '#0A1628', cancelled: '#C97B6B' };

    initSupabase().then(function(client) {
      client.from('custom_orders').select('*').order('created_at', { ascending: false }).then(function(res) {
        var orders = res.data || [];
        if (orders.length === 0) {
          BME_ADMIN.renderEmpty(container, '還沒有客製化訂單');
          return;
        }

        var pendingCount = orders.filter(function(o) { return o.status === 'pending'; }).length;
        var discussingCount = orders.filter(function(o) { return o.status === 'discussing'; }).length;
        var productionCount = orders.filter(function(o) { return o.status === 'in_production'; }).length;
        var completedCount = orders.filter(function(o) { return o.status === 'completed'; }).length;
        var html = '<div class="admin-toolbar"><div><h2 style="margin:0;font-size:18px;color:#0A1628;">客製化訂單</h2><p style="margin:4px 0 0;color:#777;font-size:13px;">追蹤客戶風格、材質與參考圖需求。</p></div></div>';
        html += BME_ADMIN.renderStatCards([
          { label: '客製總數', value: orders.length },
          { label: '待處理', value: pendingCount },
          { label: '討論中', value: discussingCount },
          { label: '製作中', value: productionCount },
          { label: '已完成', value: completedCount }
        ]);
        html += '<div style="overflow-x:auto;"><table class="admin-table"><thead><tr>' +
          '<th>日期</th><th>客戶</th><th>色系</th><th>金屬</th><th>長度</th><th>類型</th><th>參考圖</th><th>描述</th><th>狀態</th><th>操作</th></tr></thead><tbody>';

        html += orders.map(function(o) {
          var ref = o.reference_image_url ? '<a href="' + BME_ADMIN.escapeHtml(o.reference_image_url) + '" target="_blank">查看</a>' : '—';
          var desc = o.description || '';
          var shortDesc = desc.length > 28 ? desc.substring(0, 28) + '…' : desc || '—';
          return '<tr>' +
            '<td>' + BME_ADMIN.formatShortDate(o.created_at) + '</td>' +
            '<td>' + BME_ADMIN.escapeHtml(o.customer_name || '—') + '</td>' +
            '<td>' + BME_ADMIN.escapeHtml(styleLabels[o.glass_color] || o.glass_color || '—') + '</td>' +
            '<td>' + BME_ADMIN.escapeHtml(metalLabels[o.metal_type] || o.metal_type || '—') + '</td>' +
            '<td>' + BME_ADMIN.escapeHtml(lengthLabels[o.chain_length] || o.chain_length || '—') + '</td>' +
            '<td>' + BME_ADMIN.escapeHtml(typeLabels[o.accessory_type] || o.accessory_type || '—') + '</td>' +
            '<td>' + ref + '</td>' +
            '<td title="' + BME_ADMIN.escapeHtml(desc) + '">' + BME_ADMIN.escapeHtml(shortDesc) + '</td>' +
            '<td><span class="status-badge" style="background:' + (statusColors[o.status] || '#999') + ';">' + (statusLabels[o.status] || BME_ADMIN.escapeHtml(o.status || '—')) + '</span></td>' +
            '<td><select class="admin-status-select" data-order-id="' + o.id + '" onchange="BME_ADMIN.updateCustomStatus(this)">' +
              Object.keys(statusLabels).map(function(k) {
                return '<option value="' + k + '"' + (o.status === k ? ' selected' : '') + '>' + statusLabels[k] + '</option>';
              }).join('') +
            '</select></td>' +
          '</tr>';
        }).join('');

        html += '</tbody></table></div>';
        container.innerHTML = html;
      });
    });
  },

  renderProducts: function() {
    if (!this.requirePermission('content:write')) return;
    var container = document.getElementById('admin-panel-content');
    if (!container) return;
    container.innerHTML = '<div class="skeleton-loading" style="padding:40px;text-align:center;">載入商品…</div>';

    initSupabase().then(function(client) {
      client.from('products').select('*').order('date_added', { ascending: false }).then(function(res) {
        var products = res.data || [];
        var statusLabels = { '上架': '上架', '下架': '下架', '已售出': '已售出', '試作中': '試作中', '即將上架': '即將上架' };
        var statusColors = { '上架': '#7BAE7F', '下架': '#999', '已售出': '#C97B6B', '試作中': '#D4A574', '即將上架': '#8FB8C9' };
        var keyword = BME_ADMIN.getControlValue('admin-product-search');
        var statusFilter = BME_ADMIN.getControlValue('admin-product-status');
        var filtered = products.filter(function(p) {
          var haystack = [p.sku, p.product_name, p.style, p.style_profile, p.description].join(' ');
          var statusOk = !statusFilter || p.status === statusFilter;
          return statusOk && BME_ADMIN.matchesText(haystack, keyword);
        });
        var activeCount = products.filter(function(p) { return p.status === '上架'; }).length;
        var comingCount = products.filter(function(p) { return p.status === '即將上架' || p.status === '試作中'; }).length;
        var soldCount = products.filter(function(p) { return p.is_sold || p.status === '已售出'; }).length;

        var html = '<div class="admin-toolbar">' +
          '<div>' +
            '<h2 style="margin:0;font-size:18px;color:#0A1628;">商品管理</h2>' +
            '<p style="margin:4px 0 0;color:#777;font-size:13px;">可改價格、描述、圖片路徑與上架狀態。建議先用搜尋找到 SKU，再進編輯。</p>' +
          '</div>' +
          '<button class="btn btn-primary" onclick="BME_ADMIN.showProductForm()" style="font-size:13px;padding:8px 16px;">＋ 新增商品</button>' +
        '</div>';
        html += BME_ADMIN.renderStatCards([
          { label: '商品總數', value: products.length },
          { label: '目前上架', value: activeCount },
          { label: '準備中', value: comingCount },
          { label: '已售出', value: soldCount }
        ]);
        html += '<div class="admin-controls">' +
          '<label>搜尋商品 <input id="admin-product-search" class="admin-input" value="' + BME_ADMIN.escapeHtml(keyword) + '" placeholder="輸入 SKU、品名、風格"></label>' +
          '<label>篩選狀態 <select id="admin-product-status" class="admin-input">' +
            '<option value="">全部狀態</option>' +
            Object.keys(statusLabels).map(function(k) {
              return '<option value="' + k + '"' + (statusFilter === k ? ' selected' : '') + '>' + statusLabels[k] + '</option>';
            }).join('') +
          '</select></label>' +
          '<button class="btn btn-secondary" onclick="BME_ADMIN.renderProducts()">套用</button>' +
        '</div>';

        if (products.length === 0) {
          html += '<div class="empty-state"><p>還沒有商品資料</p></div>';
          container.innerHTML = html;
          return;
        }
        if (filtered.length === 0) {
          html += '<div class="empty-state"><p>找不到符合條件的商品。</p></div>';
          container.innerHTML = html;
          return;
        }

        html += '<div style="overflow-x:auto;"><table class="admin-table"><thead><tr>' +
          '<th>圖片</th><th>SKU</th><th>商品名稱</th><th>價格</th><th>風格</th><th>描述</th><th>狀態</th><th>已售</th><th>操作</th></tr></thead><tbody>';

        filtered.forEach(function(p) {
          var images = Array.isArray(p.images) ? p.images : [];
          var imgSrc = images[0] ? BME_ADMIN.imageSrc(images[0]) : '';
          var imgHtml = imgSrc ? '<img src="' + BME_ADMIN.escapeHtml(imgSrc) + '" class="admin-thumb" alt="商品圖片">' : '<div class="admin-thumb-placeholder"></div>';
          var desc = p.description || '';
          var shortDesc = desc.length > 36 ? desc.substring(0, 36) + '…' : desc || '—';

          html += '<tr>' +
            '<td>' + imgHtml + '</td>' +
            '<td style="font-family:monospace;font-size:12px;">' + BME_ADMIN.escapeHtml(p.sku) + '</td>' +
            '<td>' + BME_ADMIN.escapeHtml(p.product_name) + '</td>' +
            '<td>NT$ ' + BME_ADMIN.escapeHtml(p.price) + '</td>' +
            '<td style="font-size:12px;">' + BME_ADMIN.escapeHtml(p.style || p.style_profile || '—') + '</td>' +
            '<td title="' + BME_ADMIN.escapeHtml(desc) + '" style="max-width:240px;">' + BME_ADMIN.escapeHtml(shortDesc) + '</td>' +
            '<td><span class="status-badge" style="background:' + (statusColors[p.status] || '#999') + ';">' + BME_ADMIN.escapeHtml(statusLabels[p.status] || p.status || '—') + '</span></td>' +
            '<td><label class="admin-check"><input type="checkbox" ' + (p.is_sold ? 'checked' : '') + ' onchange="BME_ADMIN.toggleSold(\'' + p.id + '\', this.checked)"> 已售出</label></td>' +
            '<td>' +
              '<div class="admin-row-actions">' +
                '<button class="admin-link-btn" onclick="BME_ADMIN.showProductForm(\'' + p.id + '\')">編輯</button>' +
                '<button class="admin-link-btn danger" onclick="BME_ADMIN.deleteProduct(\'' + p.id + '\', \'' + BME_ADMIN.escapeHtml(p.product_name) + '\')">刪除</button>' +
              '</div>' +
            '</td>' +
          '</tr>';
        });

        html += '</tbody></table></div>';
        container.innerHTML = html;
        var search = document.getElementById('admin-product-search');
        var filter = document.getElementById('admin-product-status');
        if (search) search.onkeydown = function(e) { if (e.key === 'Enter') BME_ADMIN.renderProducts(); };
        if (filter) filter.onchange = function() { BME_ADMIN.renderProducts(); };
      });
    });
  },

  renderPosts: function() {
    if (!this.requirePermission('content:write')) return;
    var container = document.getElementById('admin-panel-content');
    if (!container) return;
    container.innerHTML = '<div class="skeleton-loading" style="padding:40px;text-align:center;">載入網誌文章…</div>';

    initSupabase().then(function(client) {
      client.from('journal_posts').select('*').order('sort_order', { ascending: true }).order('published_at', { ascending: false }).then(function(res) {
        var posts = res.data || [];
        var statusLabels = { draft: '草稿', published: '已發布', archived: '封存' };
        var statusColors = { draft: '#999', published: '#7BAE7F', archived: '#C97B6B' };
        var keyword = BME_ADMIN.getControlValue('admin-post-search');
        var statusFilter = BME_ADMIN.getControlValue('admin-post-status');
        var filtered = posts.filter(function(post) {
          var haystack = [post.slug, post.title, post.category, post.excerpt].join(' ');
          var statusOk = !statusFilter || post.status === statusFilter;
          return statusOk && BME_ADMIN.matchesText(haystack, keyword);
        });
        var publishedCount = posts.filter(function(post) { return post.status === 'published'; }).length;
        var draftCount = posts.filter(function(post) { return post.status === 'draft' || !post.status; }).length;
        var featuredCount = posts.filter(function(post) { return !!post.featured; }).length;

        var html = '<div class="admin-toolbar">' +
          '<div>' +
            '<h2 style="margin:0;font-size:18px;color:#0A1628;">網誌文章管理</h2>' +
            '<p style="margin:4px 0 0;color:#777;font-size:13px;">管理誌頁的標題、摘要、封面與全文內容。草稿不會出現在前台。</p>' +
          '</div>' +
          '<button class="btn btn-primary" onclick="BME_ADMIN.showPostForm()" style="font-size:13px;padding:8px 16px;">＋ 新增文章</button>' +
        '</div>';
        html += BME_ADMIN.renderStatCards([
          { label: '文章總數', value: posts.length },
          { label: '已發布', value: publishedCount },
          { label: '草稿', value: draftCount },
          { label: '精選', value: featuredCount }
        ]);
        html += '<div class="admin-controls">' +
          '<label>搜尋文章 <input id="admin-post-search" class="admin-input" value="' + BME_ADMIN.escapeHtml(keyword) + '" placeholder="輸入標題、slug、分類"></label>' +
          '<label>篩選狀態 <select id="admin-post-status" class="admin-input">' +
            '<option value="">全部狀態</option>' +
            Object.keys(statusLabels).map(function(k) {
              return '<option value="' + k + '"' + (statusFilter === k ? ' selected' : '') + '>' + statusLabels[k] + '</option>';
            }).join('') +
          '</select></label>' +
          '<button class="btn btn-secondary" onclick="BME_ADMIN.renderPosts()">套用</button>' +
        '</div>';

        if (posts.length === 0) {
          html += '<div class="empty-state"><p>還沒有網誌文章</p></div>';
          container.innerHTML = html;
          return;
        }
        if (filtered.length === 0) {
          html += '<div class="empty-state"><p>找不到符合條件的文章。</p></div>';
          container.innerHTML = html;
          return;
        }

        html += '<div style="overflow-x:auto;"><table class="admin-table"><thead><tr>' +
          '<th>封面</th><th>標題</th><th>分類</th><th>摘要</th><th>狀態</th><th>發布日</th><th>精選</th><th>操作</th></tr></thead><tbody>';

        filtered.forEach(function(post) {
          var cover = BME_ADMIN.imageSrc(post.cover_image, '../images/products/');
          var coverHtml = cover ? '<img src="' + BME_ADMIN.escapeHtml(cover) + '" class="admin-thumb" alt="文章封面">' : '<div class="admin-thumb-placeholder"></div>';
          var excerpt = post.excerpt || '';
          var shortExcerpt = excerpt.length > 42 ? excerpt.substring(0, 42) + '…' : excerpt || '—';

          html += '<tr>' +
            '<td>' + coverHtml + '</td>' +
            '<td>' + BME_ADMIN.escapeHtml(post.title || '—') + '</td>' +
            '<td style="font-size:12px;">' + BME_ADMIN.escapeHtml(post.category || '—') + '</td>' +
            '<td title="' + BME_ADMIN.escapeHtml(excerpt) + '" style="max-width:280px;">' + BME_ADMIN.escapeHtml(shortExcerpt) + '</td>' +
            '<td><span class="status-badge" style="background:' + (statusColors[post.status] || '#999') + ';">' + BME_ADMIN.escapeHtml(statusLabels[post.status] || post.status || '—') + '</span></td>' +
            '<td>' + BME_ADMIN.formatShortDate(post.published_at) + '</td>' +
            '<td>' + (post.featured ? '是' : '否') + '</td>' +
            '<td>' +
              '<div class="admin-row-actions">' +
                '<button class="admin-link-btn" onclick="BME_ADMIN.showPostForm(\'' + post.id + '\')">編輯</button>' +
                '<button class="admin-link-btn danger" onclick="BME_ADMIN.deletePost(\'' + post.id + '\', \'' + BME_ADMIN.escapeHtml(post.title || '') + '\')">刪除</button>' +
              '</div>' +
            '</td>' +
          '</tr>';
        });

        html += '</tbody></table></div>';
        container.innerHTML = html;
        var search = document.getElementById('admin-post-search');
        var filter = document.getElementById('admin-post-status');
        if (search) search.onkeydown = function(e) { if (e.key === 'Enter') BME_ADMIN.renderPosts(); };
        if (filter) filter.onchange = function() { BME_ADMIN.renderPosts(); };
      }).catch(function(err) {
        container.innerHTML = '<div class="empty-state"><p>文章資料表讀取失敗：' + BME_ADMIN.escapeHtml((err && err.message) ? err.message : '請先建立 journal_posts 資料表') + '</p></div>';
      });
    });
  },

  showProductForm: function(productId) {
    if (!this.requirePermission('content:write')) return;
    var container = document.getElementById('admin-panel-content');
    var self = this;
    this.productEditorId = productId || null;
    var isEdit = !!productId;

    initSupabase().then(function(client) {
      var load = isEdit ? client.from('products').select('*').eq('id', productId).single() : Promise.resolve({ data: null });
      load.then(function(res) {
        var product = res.data || {};
        var images = Array.isArray(product.images) ? product.images.join('\n') : '';
        var tags = Array.isArray(product.tags) ? product.tags.join(', ') : '';

        container.innerHTML =
          '<div class="admin-form-shell">' +
            '<div class="admin-toolbar" style="margin-bottom:16px;">' +
              '<div>' +
                '<h2 style="margin:0;font-size:18px;color:#0A1628;">' + (isEdit ? '編輯商品' : '新增商品') + '</h2>' +
                '<p style="margin:4px 0 0;color:#777;font-size:13px;">圖片欄位支援檔名或完整 URL，手動換圖就改這裡。</p>' +
              '</div>' +
              '<button class="btn btn-secondary" onclick="BME_ADMIN.renderProducts()">返回列表</button>' +
            '</div>' +
            '<div class="admin-form">' +
              '<input type="hidden" id="product-id" value="' + BME_ADMIN.escapeHtml(product.id || '') + '">' +
              '<label>SKU <input id="product-sku" class="admin-input" value="' + BME_ADMIN.escapeHtml(product.sku || '') + '" placeholder="例如：BM-R001"></label>' +
              '<label>商品名稱 <input id="product-name" class="admin-input" value="' + BME_ADMIN.escapeHtml(product.product_name || '') + '" placeholder="例如：蝶舞玫瑰"></label>' +
              '<label>價格（NT$） <input id="product-price" class="admin-input" type="number" value="' + BME_ADMIN.escapeHtml(product.price || 0) + '" placeholder="299"></label>' +
              '<label>風格名稱 <input id="product-style" class="admin-input" value="' + BME_ADMIN.escapeHtml(product.style || '') + '" placeholder="浪漫復古"></label>' +
              '<label>風格代碼 ' +
                '<select id="product-style-profile" class="admin-input">' +
                  '<option value="romantic_rose"' + (product.style_profile === 'romantic_rose' ? ' selected' : '') + '>浪漫復古</option>' +
                  '<option value="clear_pastel"' + (product.style_profile === 'clear_pastel' ? ' selected' : '') + '>清透日常</option>' +
                  '<option value="porcelain_blue"' + (product.style_profile === 'porcelain_blue' ? ' selected' : '') + '>霧藍瓷感</option>' +
                  '<option value="sage_natural"' + (product.style_profile === 'sage_natural' ? ' selected' : '') + '>自然清新</option>' +
                  '<option value="midnight_luxury"' + (product.style_profile === 'midnight_luxury' ? ' selected' : '') + '>午夜精品</option>' +
                '</select>' +
              '</label>' +
              '<label>材質 <textarea id="product-material" class="admin-input" rows="2" placeholder="琉璃珠、金屬配件">' + BME_ADMIN.escapeHtml(product.material || '') + '</textarea></label>' +
              '<label>特色一句話 <input id="product-feature" class="admin-input" value="' + BME_ADMIN.escapeHtml(product.feature || '') + '" placeholder="一句話賣點"></label>' +
              '<label>描述 <textarea id="product-description" class="admin-input" rows="6" placeholder="商品詳細描述，每段可換行。">' + BME_ADMIN.escapeHtml(product.description || '') + '</textarea></label>' +
              '<label>圖片檔名或 URL（每行一個） <textarea id="product-images" class="admin-input" rows="3" placeholder="BM-T001_main.jpg\nBM-T001_hero.jpg">' + BME_ADMIN.escapeHtml(images) + '</textarea></label>' +
              '<div class="admin-upload-row">' +
                '<input id="product-image-upload" class="admin-file-input" type="file" accept="image/*" multiple>' +
                '<button id="product-upload-btn" type="button" class="btn btn-secondary" onclick="BME_ADMIN.uploadProductImages(\'product-image-upload\', \'product-images\', \'product-image-preview\')">上傳圖片並加入清單</button>' +
              '</div>' +
              '<div class="admin-field-help">第一張是商品主圖，第二張建議放情境圖。可填檔名、貼完整 https 圖片網址，也可以直接選檔上傳。</div>' +
              '<div id="product-image-preview" class="admin-image-preview"></div>' +
              '<label>標籤（逗號分隔） <input id="product-tags" class="admin-input" value="' + BME_ADMIN.escapeHtml(tags) + '" placeholder="手機鏈, 琉璃, 手作"></label>' +
              '<label>上架日期 <input id="product-date" class="admin-input" type="date" value="' + BME_ADMIN.escapeHtml(product.date_added || '') + '"></label>' +
              '<label>狀態 ' +
                '<select id="product-status" class="admin-input">' +
                  '<option value="上架"' + (product.status === '上架' ? ' selected' : '') + '>上架</option>' +
                  '<option value="即將上架"' + (product.status === '即將上架' ? ' selected' : '') + '>即將上架</option>' +
                  '<option value="試作中"' + (product.status === '試作中' ? ' selected' : '') + '>試作中</option>' +
                  '<option value="下架"' + (product.status === '下架' ? ' selected' : '') + '>下架</option>' +
                  '<option value="已售出"' + (product.status === '已售出' ? ' selected' : '') + '>已售出</option>' +
                '</select>' +
              '</label>' +
              '<label class="admin-check"><input id="product-is-sold" type="checkbox"' + (product.is_sold ? ' checked' : '') + '> 標記為已售出</label>' +
              '<div class="admin-form-actions">' +
                '<button id="product-save-btn" class="btn btn-primary" onclick="BME_ADMIN.saveProduct()">儲存</button>' +
                '<button class="btn btn-secondary" onclick="BME_ADMIN.renderProducts()">取消</button>' +
              '</div>' +
            '</div>' +
          '</div>';
        BME_ADMIN.renderImagePreview('product-images', 'product-image-preview', '../images/products/');
        var imageField = document.getElementById('product-images');
        if (imageField) imageField.oninput = function() {
          BME_ADMIN.renderImagePreview('product-images', 'product-image-preview', '../images/products/');
        };
      });
    });
  },

  saveProduct: function() {
    if (!this.requirePermission('content:write')) return;
    var productId = document.getElementById('product-id').value.trim();
    var priceValue = document.getElementById('product-price').value;
    var payload = {
      sku: document.getElementById('product-sku').value.trim(),
      product_name: document.getElementById('product-name').value.trim(),
      price: parseInt(priceValue, 10),
      style: document.getElementById('product-style').value.trim(),
      style_profile: document.getElementById('product-style-profile').value,
      material: document.getElementById('product-material').value.trim(),
      feature: document.getElementById('product-feature').value.trim(),
      description: document.getElementById('product-description').value.trim(),
      images: this.parseList(document.getElementById('product-images').value),
      tags: this.parseList(document.getElementById('product-tags').value),
      date_added: document.getElementById('product-date').value || new Date().toISOString().split('T')[0],
      status: document.getElementById('product-status').value,
      is_sold: document.getElementById('product-is-sold').checked,
      updated_at: new Date().toISOString()
    };

    if (!payload.sku || !payload.product_name) {
      alert('請填寫 SKU 與商品名稱');
      return;
    }

    if (isNaN(payload.price) || payload.price < 0) {
      alert('請填寫正確價格');
      return;
    }

    if (payload.images.length === 0) {
      alert('請至少填一張商品圖片');
      return;
    }

    this.setButtonBusy('product-save-btn', true, '儲存中…');
    initSupabase().then(function(client) {
      var request = productId
        ? client.from('products').update(payload).eq('id', productId)
        : client.from('products').insert(payload);

      request.then(function(res) {
        BME_ADMIN.setButtonBusy('product-save-btn', false);
        if (res && res.error) {
          alert('儲存失敗：' + res.error.message);
          return;
        }
        alert('商品已儲存');
        BME_ADMIN.renderProducts();
      }).catch(function(err) {
        BME_ADMIN.setButtonBusy('product-save-btn', false);
        alert('儲存失敗：' + ((err && err.message) ? err.message : '請稍後再試'));
      });
    });
  },

  deleteProduct: function(productId, title) {
    if (!this.requirePermission('content:write')) return;
    if (!confirm('確認刪除商品「' + title + '」？')) return;
    initSupabase().then(function(client) {
      client.from('products').delete().eq('id', productId).then(function(res) {
        if (res && res.error) {
          alert('刪除失敗：' + res.error.message);
          return;
        }
        BME_ADMIN.renderProducts();
      });
    });
  },

  showPostForm: function(postId) {
    if (!this.requirePermission('content:write')) return;
    var container = document.getElementById('admin-panel-content');
    this.postEditorId = postId || null;
    var isEdit = !!postId;

    initSupabase().then(function(client) {
      var load = isEdit ? client.from('journal_posts').select('*').eq('id', postId).single() : Promise.resolve({ data: null });
      load.then(function(res) {
        var post = res.data || {};

        container.innerHTML =
          '<div class="admin-form-shell">' +
            '<div class="admin-toolbar" style="margin-bottom:16px;">' +
              '<div>' +
                '<h2 style="margin:0;font-size:18px;color:#0A1628;">' + (isEdit ? '編輯網誌文章' : '新增網誌文章') + '</h2>' +
                '<p style="margin:4px 0 0;color:#777;font-size:13px;">內容欄位可直接輸入文字；前台會以段落方式呈現。</p>' +
              '</div>' +
              '<button class="btn btn-secondary" onclick="BME_ADMIN.renderPosts()">返回列表</button>' +
            '</div>' +
            '<div class="admin-form">' +
              '<input type="hidden" id="post-id" value="' + BME_ADMIN.escapeHtml(post.id || '') + '">' +
              '<label>Slug <input id="post-slug" class="admin-input" value="' + BME_ADMIN.escapeHtml(post.slug || '') + '" placeholder="例如：how-lamp-work"></label>' +
              '<label>標題 <input id="post-title" class="admin-input" value="' + BME_ADMIN.escapeHtml(post.title || '') + '" placeholder="文章標題"></label>' +
              '<label>分類 <input id="post-category" class="admin-input" value="' + BME_ADMIN.escapeHtml(post.category || '') + '" placeholder="選物筆記"></label>' +
              '<label>摘要 <textarea id="post-excerpt" class="admin-input" rows="3" placeholder="列表卡片顯示的短摘要。">' + BME_ADMIN.escapeHtml(post.excerpt || '') + '</textarea></label>' +
              '<label>封面圖片檔名或 URL <input id="post-cover" class="admin-input" value="' + BME_ADMIN.escapeHtml(post.cover_image || '') + '" placeholder="images/products/article-cover.jpg"></label>' +
              '<div class="admin-field-help">封面會出現在誌頁文章卡。可填 images/products/xxx.jpg，或直接貼完整 https 圖片網址。</div>' +
              '<div id="post-cover-preview" class="admin-image-preview"></div>' +
              '<label>發布日期 <input id="post-date" class="admin-input" type="date" value="' + BME_ADMIN.escapeHtml(post.published_at || '') + '"></label>' +
              '<label>排序 <input id="post-sort" class="admin-input" type="number" value="' + BME_ADMIN.escapeHtml(post.sort_order || 0) + '" placeholder="0"></label>' +
              '<label>狀態 ' +
                '<select id="post-status" class="admin-input">' +
                  '<option value="draft"' + (post.status === 'draft' || !post.status ? ' selected' : '') + '>草稿</option>' +
                  '<option value="published"' + (post.status === 'published' ? ' selected' : '') + '>已發布</option>' +
                  '<option value="archived"' + (post.status === 'archived' ? ' selected' : '') + '>封存</option>' +
                '</select>' +
              '</label>' +
              '<label class="admin-check"><input id="post-featured" type="checkbox"' + (post.featured ? ' checked' : '') + '> 設為精選</label>' +
              '<label>全文內容 <textarea id="post-content" class="admin-input" rows="10" placeholder="每段文字空一行，前台會自動拆段。">' + BME_ADMIN.escapeHtml(post.content || '') + '</textarea></label>' +
              '<div class="admin-form-actions">' +
                '<button id="post-save-btn" class="btn btn-primary" onclick="BME_ADMIN.savePost()">儲存</button>' +
                '<button class="btn btn-secondary" onclick="BME_ADMIN.renderPosts()">取消</button>' +
              '</div>' +
            '</div>' +
          '</div>';
        var coverInput = document.getElementById('post-cover');
        var syncCoverPreview = function() {
          var preview = document.getElementById('post-cover-preview');
          if (!preview) return;
          var value = coverInput ? coverInput.value.trim() : '';
          preview.innerHTML = value
            ? '<figure class="admin-image-preview-item"><img src="' + BME_ADMIN.escapeHtml(BME_ADMIN.imageSrc(value, '../images/products/')) + '" alt="封面預覽" loading="lazy"><figcaption>' + BME_ADMIN.escapeHtml(value) + '</figcaption></figure>'
            : '<div class="admin-image-empty">尚未填寫封面</div>';
        };
        syncCoverPreview();
        if (coverInput) coverInput.oninput = syncCoverPreview;
      });
    });
  },

  savePost: function() {
    if (!this.requirePermission('content:write')) return;
    var postId = document.getElementById('post-id').value.trim();
    var title = document.getElementById('post-title').value.trim();
    var payload = {
      slug: document.getElementById('post-slug').value.trim(),
      title: title,
      category: document.getElementById('post-category').value.trim(),
      excerpt: document.getElementById('post-excerpt').value.trim(),
      cover_image: document.getElementById('post-cover').value.trim(),
      published_at: document.getElementById('post-date').value || new Date().toISOString().split('T')[0],
      sort_order: parseInt(document.getElementById('post-sort').value, 10) || 0,
      status: document.getElementById('post-status').value,
      featured: document.getElementById('post-featured').checked,
      content: document.getElementById('post-content').value.trim(),
      updated_at: new Date().toISOString()
    };

    if (!payload.slug || !title) {
      alert('請填寫 slug 與標題');
      return;
    }

    if (!/^[a-z0-9-]+$/.test(payload.slug)) {
      alert('Slug 只能使用小寫英文、數字與連字號，例如 style-guide-01');
      return;
    }

    if (!payload.excerpt && payload.content) {
      payload.excerpt = payload.content.replace(/\s+/g, ' ').trim().substring(0, 120);
    }

    this.setButtonBusy('post-save-btn', true, '儲存中…');
    initSupabase().then(function(client) {
      var request = postId
        ? client.from('journal_posts').update(payload).eq('id', postId)
        : client.from('journal_posts').insert(payload);

      request.then(function(res) {
        BME_ADMIN.setButtonBusy('post-save-btn', false);
        if (res && res.error) {
          alert('儲存失敗：' + res.error.message);
          return;
        }
        alert('文章已儲存');
        BME_ADMIN.renderPosts();
      }).catch(function(err) {
        BME_ADMIN.setButtonBusy('post-save-btn', false);
        alert('儲存失敗：' + ((err && err.message) ? err.message : '請稍後再試'));
      });
    });
  },

  deletePost: function(postId, title) {
    if (!this.requirePermission('content:write')) return;
    if (!confirm('確認刪除文章「' + title + '」？')) return;
    initSupabase().then(function(client) {
      client.from('journal_posts').delete().eq('id', postId).then(function(res) {
        if (res && res.error) {
          alert('刪除失敗：' + res.error.message);
          return;
        }
        BME_ADMIN.renderPosts();
      });
    });
  },

  getCustomOptionGroupLabel: function(group) {
    return this.customOptionGroups[group] || group || '未分類';
  },

  renderCustomOptions: function() {
    if (!this.requirePermission('content:write')) return;
    var container = document.getElementById('admin-panel-content');
    if (!container) return;
    container.innerHTML = '<div class="skeleton-loading" style="padding:40px;text-align:center;">載入客製選項…</div>';

    initSupabase().then(function(client) {
      Promise.all([
        client.from('custom_options').select('*').order('option_group', { ascending: true }).order('sort_order', { ascending: true }),
        client.from('custom_page_settings').select('*').eq('key', 'custom_page').single()
      ]).then(function(results) {
        var optionsRes = results[0] || {};
        var settingsRes = results[1] || {};
        if (optionsRes.error) {
          container.innerHTML = '<div class="empty-state"><p>客製選項資料表讀取失敗：' + BME_ADMIN.escapeHtml(optionsRes.error.message) + '</p></div>';
          return;
        }
        var options = optionsRes.data || [];
        var settings = settingsRes.data && settingsRes.data.value ? settingsRes.data.value : {};
        var activeCount = options.filter(function(option) { return option.is_active; }).length;
        var styleCount = options.filter(function(option) { return option.option_group === 'style'; }).length;

        var html = '<div class="admin-toolbar">' +
          '<div>' +
            '<h2 style="margin:0;font-size:18px;color:#0A1628;">客製選項管理</h2>' +
            '<p style="margin:4px 0 0;color:#777;font-size:13px;">這裡會直接影響前台客製頁的風格、材質、長度、種類與引導文案。</p>' +
          '</div>' +
          '<button class="btn btn-primary" onclick="BME_ADMIN.showCustomOptionForm()" style="font-size:13px;padding:8px 16px;">＋ 新增選項</button>' +
        '</div>';
        html += BME_ADMIN.renderStatCards([
          { label: '選項總數', value: options.length },
          { label: '啟用中', value: activeCount },
          { label: '風格情境', value: styleCount },
          { label: '規格群組', value: Object.keys(BME_ADMIN.customOptionGroups).length }
        ]);
        html += BME_ADMIN.renderCustomSettingsForm(settings);
        html += BME_ADMIN.renderCustomOptionsTable(options);
        container.innerHTML = html;
      }).catch(function(err) {
        container.innerHTML = '<div class="empty-state"><p>客製選項讀取失敗：' + BME_ADMIN.escapeHtml((err && err.message) ? err.message : '請確認資料表已建立') + '</p></div>';
      });
    });
  },

  renderCustomSettingsForm: function(settings) {
    settings = settings || {};
    return '<section class="admin-settings-card">' +
      '<div class="admin-section-title">' +
        '<div><h3>客製頁文案</h3><p>調整前台客製頁標題、提示與送出後訊息。</p></div>' +
      '</div>' +
      '<div class="admin-option-grid">' +
        '<label>頁面標題 <input id="custom-setting-hero-title" class="admin-input" value="' + this.escapeHtml(settings.heroTitle || '') + '" placeholder="打造你的夢想飾品"></label>' +
        '<label>頁面說明 <textarea id="custom-setting-hero-subtitle" class="admin-input" rows="3" placeholder="選風格、選材質、補需求...">' + this.escapeHtml(settings.heroSubtitle || '') + '</textarea></label>' +
        '<label>參考圖提示 <textarea id="custom-setting-reference-help" class="admin-input" rows="2" placeholder="上傳風格照、手機殼照...">' + this.escapeHtml(settings.referenceHelp || '') + '</textarea></label>' +
        '<label>需求欄位提示 <textarea id="custom-setting-description-placeholder" class="admin-input" rows="3" placeholder="例如：想要更淡一點...">' + this.escapeHtml(settings.descriptionPlaceholder || '') + '</textarea></label>' +
        '<label>送出按鈕文字 <input id="custom-setting-submit-label" class="admin-input" value="' + this.escapeHtml(settings.submitLabel || '') + '" placeholder="送出客製想法"></label>' +
        '<label>成功標題 <input id="custom-setting-success-title" class="admin-input" value="' + this.escapeHtml(settings.successTitle || '') + '" placeholder="客製想法已送出"></label>' +
        '<label>成功訊息 <textarea id="custom-setting-success-body" class="admin-input" rows="2" placeholder="我們會在 1-2 個工作天內聯繫你。">' + this.escapeHtml(settings.successBody || '') + '</textarea></label>' +
      '</div>' +
      '<div class="admin-form-actions">' +
        '<button id="custom-settings-save-btn" class="btn btn-primary" onclick="BME_ADMIN.saveCustomPageSettings()">儲存頁面文案</button>' +
      '</div>' +
    '</section>';
  },

  renderCustomOptionsTable: function(options) {
    var grouped = {};
    Object.keys(this.customOptionGroups).forEach(function(group) { grouped[group] = []; });
    (options || []).forEach(function(option) {
      if (!grouped[option.option_group]) grouped[option.option_group] = [];
      grouped[option.option_group].push(option);
    });

    var html = '<section class="admin-settings-card">' +
      '<div class="admin-section-title"><div><h3>選項列表</h3><p>風格選項會在前台顯示情境圖與三個理解欄位；停用後前台不會出現。</p></div></div>';

    Object.keys(grouped).forEach(function(group) {
      var items = grouped[group];
      html += '<div class="admin-option-group">' +
        '<h4>' + BME_ADMIN.escapeHtml(BME_ADMIN.getCustomOptionGroupLabel(group)) + '</h4>';
      if (items.length === 0) {
        html += '<p class="admin-muted">尚未建立選項。</p>';
      } else {
        html += '<div style="overflow-x:auto;"><table class="admin-table admin-option-table"><thead><tr>' +
          '<th>排序</th><th>名稱</th><th>代碼</th><th>情境圖 / 標記</th><th>描述</th><th>狀態</th><th>操作</th>' +
        '</tr></thead><tbody>';
        items.forEach(function(option) {
          var meta = option.metadata || {};
          var image = option.image_url ? BME_ADMIN.imageSrc(option.image_url, '../') : '';
          var visual = image
            ? '<img src="' + BME_ADMIN.escapeHtml(image) + '" class="admin-thumb" alt="選項圖片">'
            : '<span class="admin-option-token">' + BME_ADMIN.escapeHtml(meta.emoji || meta.feel || '—') + '</span>';
          html += '<tr>' +
            '<td>' + BME_ADMIN.escapeHtml(option.sort_order || 0) + '</td>' +
            '<td>' + BME_ADMIN.escapeHtml(option.label || '—') + '</td>' +
            '<td style="font-family:monospace;font-size:12px;">' + BME_ADMIN.escapeHtml(option.code || '—') + '</td>' +
            '<td>' + visual + '</td>' +
            '<td style="max-width:320px;">' + BME_ADMIN.escapeHtml(option.description || '—') + '</td>' +
            '<td><label class="admin-check"><input type="checkbox" ' + (option.is_active ? 'checked' : '') + ' onchange="BME_ADMIN.toggleCustomOptionActive(\'' + option.id + '\', this.checked)"> 啟用</label></td>' +
            '<td><button class="admin-link-btn" onclick="BME_ADMIN.showCustomOptionForm(\'' + option.id + '\')">編輯</button></td>' +
          '</tr>';
        });
        html += '</tbody></table></div>';
      }
      html += '</div>';
    });

    html += '</section>';
    return html;
  },

  showCustomOptionForm: function(optionId) {
    if (!this.requirePermission('content:write')) return;
    var container = document.getElementById('admin-panel-content');
    var isEdit = !!optionId;
    initSupabase().then(function(client) {
      var load = isEdit ? client.from('custom_options').select('*').eq('id', optionId).single() : Promise.resolve({ data: null });
      load.then(function(res) {
        if (res && res.error) {
          alert('讀取選項失敗：' + res.error.message);
          return;
        }
        var option = res.data || { option_group: 'style', sort_order: 0, is_active: true, metadata: {} };
        var meta = option.metadata || {};
        container.innerHTML =
          '<div class="admin-form-shell">' +
            '<div class="admin-toolbar" style="margin-bottom:16px;">' +
              '<div>' +
                '<h2 style="margin:0;font-size:18px;color:#0A1628;">' + (isEdit ? '編輯客製選項' : '新增客製選項') + '</h2>' +
                '<p style="margin:4px 0 0;color:#777;font-size:13px;">風格選項建議填完整情境圖、場景、穿搭與一眼感受；規格選項可只填名稱與描述。</p>' +
              '</div>' +
              '<button class="btn btn-secondary" onclick="BME_ADMIN.renderCustomOptions()">返回列表</button>' +
            '</div>' +
            '<div class="admin-form">' +
              '<input type="hidden" id="custom-option-id" value="' + BME_ADMIN.escapeHtml(option.id || '') + '">' +
              '<label>群組 <select id="custom-option-group" class="admin-input">' +
                Object.keys(BME_ADMIN.customOptionGroups).map(function(group) {
                  return '<option value="' + group + '"' + (option.option_group === group ? ' selected' : '') + '>' + BME_ADMIN.escapeHtml(BME_ADMIN.customOptionGroups[group]) + '</option>';
                }).join('') +
              '</select></label>' +
              '<label>代碼 <input id="custom-option-code" class="admin-input" value="' + BME_ADMIN.escapeHtml(option.code || '') + '" placeholder="例如：soft_pearl"></label>' +
              '<div class="admin-field-help">代碼會寫入訂單，建議用小寫英文、數字與底線，建立後不要任意更名。</div>' +
              '<label>顯示名稱 <input id="custom-option-label" class="admin-input" value="' + BME_ADMIN.escapeHtml(option.label || '') + '" placeholder="例如：珍珠微光"></label>' +
              '<label>描述 <textarea id="custom-option-description" class="admin-input" rows="3" placeholder="前台選項卡上的短描述。">' + BME_ADMIN.escapeHtml(option.description || '') + '</textarea></label>' +
              '<label>圖片檔名或 URL <input id="custom-option-image" class="admin-input" value="' + BME_ADMIN.escapeHtml(option.image_url || '') + '" placeholder="images/products/BM-T001_main.jpg"></label>' +
              '<div class="admin-field-help">風格情境圖建議用同角度、同光線，只換商品與氛圍。可填 images/products/xxx.jpg 或完整 https 圖片網址。</div>' +
              '<div id="custom-option-image-preview" class="admin-image-preview"></div>' +
              '<div class="admin-option-grid">' +
                '<label>適合場景 <input id="custom-option-scene" class="admin-input" value="' + BME_ADMIN.escapeHtml(meta.scene || '') + '" placeholder="通勤 / 約會 / 送禮"></label>' +
                '<label>適合穿搭 <input id="custom-option-wear" class="admin-input" value="' + BME_ADMIN.escapeHtml(meta.wear || '') + '" placeholder="白襯衫、針織、洋裝"></label>' +
                '<label>一眼感受 <input id="custom-option-feel" class="admin-input" value="' + BME_ADMIN.escapeHtml(meta.feel || '') + '" placeholder="柔和暖調"></label>' +
                '<label>代表商品名 <input id="custom-option-product-name" class="admin-input" value="' + BME_ADMIN.escapeHtml(meta.productName || '') + '" placeholder="晨光序曲"></label>' +
                '<label>色彩標籤 <input id="custom-option-color-label" class="admin-input" value="' + BME_ADMIN.escapeHtml(meta.colorLabel || '') + '" placeholder="透明、淺色系"></label>' +
                '<label>小標記 <input id="custom-option-emoji" class="admin-input" value="' + BME_ADMIN.escapeHtml(meta.emoji || '') + '" placeholder="手機 / 45 / ✦"></label>' +
                '<label>強調色 <input id="custom-option-accent" class="admin-input" value="' + BME_ADMIN.escapeHtml(meta.accent || '') + '" placeholder="#C9956B"></label>' +
                '<label>排序 <input id="custom-option-sort" class="admin-input" type="number" value="' + BME_ADMIN.escapeHtml(option.sort_order || 0) + '"></label>' +
              '</div>' +
              '<label class="admin-check"><input id="custom-option-active" type="checkbox"' + (option.is_active !== false ? ' checked' : '') + '> 啟用這個選項</label>' +
              '<div class="admin-form-actions">' +
                '<button id="custom-option-save-btn" class="btn btn-primary" onclick="BME_ADMIN.saveCustomOption()">儲存選項</button>' +
                '<button class="btn btn-secondary" onclick="BME_ADMIN.renderCustomOptions()">取消</button>' +
              '</div>' +
            '</div>' +
          '</div>';
        var imageInput = document.getElementById('custom-option-image');
        var syncPreview = function() {
          var preview = document.getElementById('custom-option-image-preview');
          if (!preview) return;
          var value = imageInput ? imageInput.value.trim() : '';
          preview.innerHTML = value
            ? '<figure class="admin-image-preview-item"><img src="' + BME_ADMIN.escapeHtml(BME_ADMIN.imageSrc(value, '../')) + '" alt="選項圖片預覽" loading="lazy"><figcaption>' + BME_ADMIN.escapeHtml(value) + '</figcaption></figure>'
            : '<div class="admin-image-empty">尚未填寫圖片</div>';
        };
        syncPreview();
        if (imageInput) imageInput.oninput = syncPreview;
      });
    });
  },

  saveCustomOption: function() {
    if (!this.requirePermission('content:write')) return;
    var optionId = document.getElementById('custom-option-id').value.trim();
    var code = document.getElementById('custom-option-code').value.trim();
    var label = document.getElementById('custom-option-label').value.trim();
    if (!code || !label) {
      alert('請填寫代碼與顯示名稱');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(code)) {
      alert('代碼只能使用小寫英文、數字與底線，例如 soft_pearl');
      return;
    }

    var metadata = {
      scene: document.getElementById('custom-option-scene').value.trim(),
      wear: document.getElementById('custom-option-wear').value.trim(),
      feel: document.getElementById('custom-option-feel').value.trim(),
      productName: document.getElementById('custom-option-product-name').value.trim(),
      colorLabel: document.getElementById('custom-option-color-label').value.trim(),
      emoji: document.getElementById('custom-option-emoji').value.trim(),
      accent: document.getElementById('custom-option-accent').value.trim()
    };

    var payload = {
      option_group: document.getElementById('custom-option-group').value,
      code: code,
      label: label,
      description: document.getElementById('custom-option-description').value.trim(),
      image_url: document.getElementById('custom-option-image').value.trim(),
      metadata: metadata,
      sort_order: parseInt(document.getElementById('custom-option-sort').value, 10) || 0,
      is_active: document.getElementById('custom-option-active').checked,
      updated_at: new Date().toISOString()
    };

    this.setButtonBusy('custom-option-save-btn', true, '儲存中…');
    initSupabase().then(function(client) {
      var request = optionId
        ? client.from('custom_options').update(payload).eq('id', optionId)
        : client.from('custom_options').insert(payload);
      request.then(function(res) {
        BME_ADMIN.setButtonBusy('custom-option-save-btn', false);
        if (res && res.error) {
          alert('儲存失敗：' + res.error.message);
          return;
        }
        alert('客製選項已儲存');
        BME_ADMIN.renderCustomOptions();
      }).catch(function(err) {
        BME_ADMIN.setButtonBusy('custom-option-save-btn', false);
        alert('儲存失敗：' + ((err && err.message) ? err.message : '請稍後再試'));
      });
    });
  },

  saveCustomPageSettings: function() {
    if (!this.requirePermission('content:write')) return;
    var value = {
      heroTitle: document.getElementById('custom-setting-hero-title').value.trim(),
      heroSubtitle: document.getElementById('custom-setting-hero-subtitle').value.trim(),
      referenceHelp: document.getElementById('custom-setting-reference-help').value.trim(),
      descriptionPlaceholder: document.getElementById('custom-setting-description-placeholder').value.trim(),
      submitLabel: document.getElementById('custom-setting-submit-label').value.trim(),
      successTitle: document.getElementById('custom-setting-success-title').value.trim(),
      successBody: document.getElementById('custom-setting-success-body').value.trim()
    };

    this.setButtonBusy('custom-settings-save-btn', true, '儲存中…');
    initSupabase().then(function(client) {
      client.from('custom_page_settings')
        .upsert({ key: 'custom_page', value: value, updated_at: new Date().toISOString() })
        .then(function(res) {
          BME_ADMIN.setButtonBusy('custom-settings-save-btn', false);
          if (res && res.error) {
            alert('儲存失敗：' + res.error.message);
            return;
          }
          alert('客製頁文案已儲存');
          BME_ADMIN.renderCustomOptions();
        }).catch(function(err) {
          BME_ADMIN.setButtonBusy('custom-settings-save-btn', false);
          alert('儲存失敗：' + ((err && err.message) ? err.message : '請稍後再試'));
        });
    });
  },

  toggleCustomOptionActive: function(optionId, active) {
    if (!this.requirePermission('content:write')) return;
    initSupabase().then(function(client) {
      client.from('custom_options').update({ is_active: active, updated_at: new Date().toISOString() }).eq('id', optionId).then(function(res) {
        if (res && res.error) {
          alert('更新失敗：' + res.error.message);
          return;
        }
        BME_ADMIN.renderCustomOptions();
      });
    });
  },

  renderPermissions: function() {
    if (!this.requirePermission('permissions:write')) return;
    var container = document.getElementById('admin-panel-content');
    if (!container) return;
    container.innerHTML = '<div class="skeleton-loading" style="padding:40px;text-align:center;">載入權限資料…</div>';

    initSupabase().then(function(client) {
      client.from('profiles')
        .select('id,nickname,role,created_at,updated_at')
        .order('created_at', { ascending: false })
        .then(function(res) {
          if (res && res.error) {
            container.innerHTML = '<div class="empty-state"><p>權限資料讀取失敗：' + BME_ADMIN.escapeHtml(res.error.message) + '</p></div>';
            return;
          }

          var profiles = res.data || [];
          var counts = profiles.reduce(function(acc, profile) {
            var role = profile.role || 'user';
            acc[role] = (acc[role] || 0) + 1;
            return acc;
          }, {});

          var html = '<div class="admin-toolbar"><div><h2 style="margin:0;font-size:18px;color:#0A1628;">權限設定</h2><p style="margin:4px 0 0;color:#777;font-size:13px;">管理後台角色。真正限制仍以 Supabase RLS 為準。</p></div></div>';
          html += BME_ADMIN.renderStatCards([
            { label: '擁有者', value: counts.owner || 0 },
            { label: '管理員', value: counts.admin || 0 },
            { label: '訂單處理', value: counts.fulfillment || 0 },
            { label: '內容編輯', value: counts.editor || 0 }
          ]);
          html += '<div class="admin-permission-note">' +
            '<strong>角色說明</strong>' +
            '<span>擁有者：可管理權限與全站內容。</span>' +
            '<span>管理員：可管理訂單、商品、文章、客製選項。</span>' +
            '<span>訂單處理：只看與更新一般/客製訂單。</span>' +
            '<span>內容編輯：只管理商品、文章與客製選項。</span>' +
          '</div>';

          if (profiles.length === 0) {
            html += '<div class="empty-state"><p>目前沒有會員資料。</p></div>';
          } else {
            html += '<div style="overflow-x:auto;"><table class="admin-table"><thead><tr><th>暱稱</th><th>User ID</th><th>目前角色</th><th>建立日期</th><th>操作</th></tr></thead><tbody>';
            html += profiles.map(function(profile) {
              var role = profile.role || 'user';
              return '<tr>' +
                '<td>' + BME_ADMIN.escapeHtml(profile.nickname || '未命名會員') + '</td>' +
                '<td style="font-family:monospace;font-size:12px;">' + BME_ADMIN.escapeHtml(profile.id || '—') + '</td>' +
                '<td><span class="admin-role-pill role-' + BME_ADMIN.escapeHtml(role) + '">' + BME_ADMIN.escapeHtml(BME_ADMIN.getRoleLabel(role)) + '</span></td>' +
                '<td>' + BME_ADMIN.formatShortDate(profile.created_at) + '</td>' +
                '<td><select class="admin-status-select" data-profile-id="' + BME_ADMIN.escapeHtml(profile.id) + '" onchange="BME_ADMIN.updateUserRole(this)">' +
                  ['user', 'editor', 'fulfillment', 'admin', 'owner'].map(function(roleOption) {
                    return '<option value="' + roleOption + '"' + (role === roleOption ? ' selected' : '') + '>' + BME_ADMIN.escapeHtml(BME_ADMIN.getRoleLabel(roleOption)) + '</option>';
                  }).join('') +
                '</select></td>' +
              '</tr>';
            }).join('');
            html += '</tbody></table></div>';
          }

          container.innerHTML = html;
        });
    });
  },

  updateUserRole: function(select) {
    if (!this.requirePermission('permissions:write')) return;
    var profileId = select.dataset.profileId;
    var role = select.value;
    if (!profileId) {
      alert('找不到會員 ID');
      return;
    }
    if (['user', 'editor', 'fulfillment', 'admin', 'owner'].indexOf(role) < 0) {
      alert('角色不合法');
      return;
    }
    initSupabase().then(function(client) {
      client.from('profiles')
        .update({ role: role, updated_at: new Date().toISOString() })
        .eq('id', profileId)
        .then(function(res) {
          if (res && res.error) {
            alert('權限更新失敗：' + res.error.message);
            BME_ADMIN.renderPermissions();
            return;
          }
          BME_ADMIN.renderPermissions();
        });
    });
  },

  updateOrderStatus: function(select) {
    if (!this.requirePermission('orders:write')) return;
    var orderId = select.dataset.orderId;
    var status = select.value;
    initSupabase().then(function(client) {
      client.from('orders').update({ status: status, updated_at: new Date().toISOString() }).eq('id', orderId).then(function(res) {
        if (res && res.error) {
          alert('更新失敗');
          return;
        }
        BME_ADMIN.renderOrders();
      });
    });
  },

  updateCustomStatus: function(select) {
    if (!this.requirePermission('orders:write')) return;
    var orderId = select.dataset.orderId;
    var status = select.value;
    initSupabase().then(function(client) {
      client.from('custom_orders').update({ status: status, updated_at: new Date().toISOString() }).eq('id', orderId).then(function(res) {
        if (res && res.error) {
          alert('更新失敗');
          return;
        }
        BME_ADMIN.renderCustomOrders();
      });
    });
  },

  toggleSold: function(productId, checked) {
    if (!this.requirePermission('content:write')) return;
    initSupabase().then(function(client) {
      var updates = { is_sold: checked, updated_at: new Date().toISOString() };
      if (checked) updates.status = '已售出';
      client.from('products').update(updates).eq('id', productId).then(function(res) {
        if (res && res.error) {
          alert('更新失敗');
          return;
        }
        BME_ADMIN.renderProducts();
      });
    });
  }
};

window.BME_ADMIN = BME_ADMIN;
