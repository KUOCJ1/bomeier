// Bo Mei Er - Admin Dashboard
// 依賴：auth.js, supabase-config.js

var BME_ADMIN = {
  adminEmail: null,
  productEditorId: null,
  postEditorId: null,
  adminEmailAllowlist: ['kuocj1@gmail.com'],

  init: function() {
    var self = this;
    BME_getUser().then(function(user) {
      if (!user) {
        window.location.href = '../login.html?redirect=admin/orders.html';
        return;
      }

      initSupabase().then(function(client) {
        client.from('profiles').select('role').eq('id', user.id).single().then(function(res) {
          var isAdmin = !!(res && res.data && res.data.role === 'admin');
          var isAllowlisted = user && user.email && BME_ADMIN.adminEmailAllowlist.indexOf(user.email.toLowerCase()) >= 0;
          if (isAdmin || isAllowlisted) {
            self.adminEmail = user.email;
            var loading = document.getElementById('admin-loading');
            var content = document.getElementById('admin-content');
            var email = document.getElementById('admin-email');
            if (loading) loading.style.display = 'none';
            if (content) content.style.display = 'block';
            if (email) email.textContent = user.email;
            self.loadPage(self.getPage());
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
    var navBtns = document.querySelectorAll('.admin-nav-btn');
    navBtns.forEach(function(btn) { btn.classList.remove('active'); });
    var active = document.querySelector('.admin-nav-btn[data-page="' + page + '"]');
    if (active) active.classList.add('active');

    if (page === 'orders') this.renderOrders();
    else if (page === 'custom') this.renderCustomOrders();
    else if (page === 'products') this.renderProducts();
    else if (page === 'posts') this.renderPosts();
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

  renderOrders: function() {
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

        var html = '<div style="overflow-x:auto;"><table class="admin-table"><thead><tr>' +
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

        var html = '<div style="overflow-x:auto;"><table class="admin-table"><thead><tr>' +
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
    var container = document.getElementById('admin-panel-content');
    if (!container) return;
    container.innerHTML = '<div class="skeleton-loading" style="padding:40px;text-align:center;">載入商品…</div>';

    initSupabase().then(function(client) {
      client.from('products').select('*').order('date_added', { ascending: false }).then(function(res) {
        var products = res.data || [];
        var statusLabels = { '上架': '上架', '下架': '下架', '已售出': '已售出', '試作中': '試作中', '即將上架': '即將上架' };
        var statusColors = { '上架': '#7BAE7F', '下架': '#999', '已售出': '#C97B6B', '試作中': '#D4A574', '即將上架': '#8FB8C9' };

        var html = '<div class="admin-toolbar">' +
          '<div>' +
            '<h2 style="margin:0;font-size:18px;color:#0A1628;">商品管理</h2>' +
            '<p style="margin:4px 0 0;color:#777;font-size:13px;">可改價格、描述、圖片路徑與上架狀態。</p>' +
          '</div>' +
          '<button class="btn btn-primary" onclick="BME_ADMIN.showProductForm()" style="font-size:13px;padding:8px 16px;">＋ 新增商品</button>' +
        '</div>';

        if (products.length === 0) {
          html += '<div class="empty-state"><p>還沒有商品資料</p></div>';
          container.innerHTML = html;
          return;
        }

        html += '<div style="overflow-x:auto;"><table class="admin-table"><thead><tr>' +
          '<th>圖片</th><th>SKU</th><th>商品名稱</th><th>價格</th><th>風格</th><th>描述</th><th>狀態</th><th>已售</th><th>操作</th></tr></thead><tbody>';

        products.forEach(function(p) {
          var images = Array.isArray(p.images) ? p.images : [];
          var imgSrc = images[0] ? BME_ADMIN.imageSrc(images[0]) : '';
          var imgHtml = imgSrc ? '<img src="' + BME_ADMIN.escapeHtml(imgSrc) + '" style="width:54px;height:54px;object-fit:cover;border-radius:6px;">' : '<div style="width:54px;height:54px;background:#E7E0DA;border-radius:6px;"></div>';
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
      });
    });
  },

  renderPosts: function() {
    var container = document.getElementById('admin-panel-content');
    if (!container) return;
    container.innerHTML = '<div class="skeleton-loading" style="padding:40px;text-align:center;">載入網誌文章…</div>';

    initSupabase().then(function(client) {
      client.from('journal_posts').select('*').order('sort_order', { ascending: true }).order('published_at', { ascending: false }).then(function(res) {
        var posts = res.data || [];
        var statusLabels = { draft: '草稿', published: '已發布', archived: '封存' };
        var statusColors = { draft: '#999', published: '#7BAE7F', archived: '#C97B6B' };

        var html = '<div class="admin-toolbar">' +
          '<div>' +
            '<h2 style="margin:0;font-size:18px;color:#0A1628;">網誌文章管理</h2>' +
            '<p style="margin:4px 0 0;color:#777;font-size:13px;">管理誌頁的標題、摘要、封面與全文內容。</p>' +
          '</div>' +
          '<button class="btn btn-primary" onclick="BME_ADMIN.showPostForm()" style="font-size:13px;padding:8px 16px;">＋ 新增文章</button>' +
        '</div>';

        if (posts.length === 0) {
          html += '<div class="empty-state"><p>還沒有網誌文章</p></div>';
          container.innerHTML = html;
          return;
        }

        html += '<div style="overflow-x:auto;"><table class="admin-table"><thead><tr>' +
          '<th>封面</th><th>標題</th><th>分類</th><th>摘要</th><th>狀態</th><th>發布日</th><th>精選</th><th>操作</th></tr></thead><tbody>';

        posts.forEach(function(post) {
          var cover = BME_ADMIN.imageSrc(post.cover_image, '../images/products/');
          var coverHtml = cover ? '<img src="' + BME_ADMIN.escapeHtml(cover) + '" style="width:54px;height:54px;object-fit:cover;border-radius:6px;">' : '<div style="width:54px;height:54px;background:#E7E0DA;border-radius:6px;"></div>';
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
      }).catch(function(err) {
        container.innerHTML = '<div class="empty-state"><p>文章資料表讀取失敗：' + BME_ADMIN.escapeHtml((err && err.message) ? err.message : '請先建立 journal_posts 資料表') + '</p></div>';
      });
    });
  },

  showProductForm: function(productId) {
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
                '<button class="btn btn-primary" onclick="BME_ADMIN.saveProduct()">儲存</button>' +
                '<button class="btn btn-secondary" onclick="BME_ADMIN.renderProducts()">取消</button>' +
              '</div>' +
            '</div>' +
          '</div>';
      });
    });
  },

  saveProduct: function() {
    var productId = document.getElementById('product-id').value.trim();
    var payload = {
      sku: document.getElementById('product-sku').value.trim(),
      product_name: document.getElementById('product-name').value.trim(),
      price: parseInt(document.getElementById('product-price').value, 10) || 0,
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

    if (!payload.price && payload.price !== 0) {
      alert('請填寫價格');
      return;
    }

    initSupabase().then(function(client) {
      var request = productId
        ? client.from('products').update(payload).eq('id', productId)
        : client.from('products').insert(payload);

      request.then(function(res) {
        if (res && res.error) {
          alert('儲存失敗：' + res.error.message);
          return;
        }
        alert('商品已儲存');
        BME_ADMIN.renderProducts();
      });
    });
  },

  deleteProduct: function(productId, title) {
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
                '<button class="btn btn-primary" onclick="BME_ADMIN.savePost()">儲存</button>' +
                '<button class="btn btn-secondary" onclick="BME_ADMIN.renderPosts()">取消</button>' +
              '</div>' +
            '</div>' +
          '</div>';
      });
    });
  },

  savePost: function() {
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

    if (!payload.excerpt && payload.content) {
      payload.excerpt = payload.content.replace(/\s+/g, ' ').trim().substring(0, 120);
    }

    initSupabase().then(function(client) {
      var request = postId
        ? client.from('journal_posts').update(payload).eq('id', postId)
        : client.from('journal_posts').insert(payload);

      request.then(function(res) {
        if (res && res.error) {
          alert('儲存失敗：' + res.error.message);
          return;
        }
        alert('文章已儲存');
        BME_ADMIN.renderPosts();
      });
    });
  },

  deletePost: function(postId, title) {
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

  updateOrderStatus: function(select) {
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
