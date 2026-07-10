// Bo Mei Er — Admin Dashboard
// 依賴：auth.js, supabase-config.js

var BME_ADMIN = {
  adminEmail: null,

  init: function() {
    var self = this;
    BME_getUser().then(function(user) {
      if (!user) {
        window.location.href = '../login.html?redirect=admin/orders.html';
        return;
      }
      // Check admin role
      initSupabase().then(function(client) {
        client.from('profiles').select('role').eq('id', user.id).single().then(function(res) {
          if (res.data && res.data.role === 'admin') {
            self.adminEmail = user.email;
            document.getElementById('admin-loading').style.display = 'none';
            document.getElementById('admin-content').style.display = 'block';
            document.getElementById('admin-email').textContent = user.email;
            var page = self.getPage();
            self.loadPage(page);
          } else {
            document.getElementById('admin-loading').innerHTML = '<p style="color:#C97B6B;">你沒有管理員權限。</p><a href="../index.html" class="btn btn-secondary" style="margin-top:12px;">回首頁</a>';
          }
        });
      });
    });
  },

  getPage: function() {
    var p = new URLSearchParams(window.location.search).get('page') || 'orders';
    return p;
  },

  loadPage: function(page) {
    var navBtns = document.querySelectorAll('.admin-nav-btn');
    navBtns.forEach(function(b) { b.classList.remove('active'); });
    var activeBtn = document.querySelector('.admin-nav-btn[data-page="' + page + '"]');
    if (activeBtn) activeBtn.classList.add('active');

    if (page === 'orders') this.renderOrders();
    else if (page === 'custom') this.renderCustomOrders();
    else if (page === 'products') this.renderProducts();
  },

  renderOrders: function() {
    var container = document.getElementById('admin-panel-content');
    if (!container) return;
    container.innerHTML = '<div class="skeleton-loading" style="padding:40px;text-align:center;">載入訂單…</div>';

    var self = this;
    initSupabase().then(function(client) {
      client.from('orders').select('*').order('created_at', { ascending: false }).then(function(res) {
        var orders = res.data || [];
        if (orders.length === 0) {
          container.innerHTML = '<div class="empty-state"><p>還沒有訂單記錄</p></div>';
          return;
        }
        var statusLabels = { pending: '待確認', confirmed: '已確認', shipped: '已出貨', completed: '已完成', cancelled: '已取消', refunded: '已退款' };
        var statusColors = { pending: '#D4A574', confirmed: '#8FB8C9', shipped: '#7BAE7F', completed: '#0A1628', cancelled: '#C97B6B', refunded: '#999' };

        container.innerHTML = '<div style="overflow-x:auto;"><table class="admin-table"><thead><tr>' +
          '<th>日期</th><th>商品</th><th>數量</th><th>金額</th><th>客戶</th><th>聯絡方式</th><th>狀態</th><th>操作</th></tr></thead><tbody>' +
          orders.map(function(o) {
            var date = new Date(o.created_at).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' });
            return '<tr>' +
              '<td>' + date + '</td>' +
              '<td>' + (o.sku || '—') + '</td>' +
              '<td>' + o.quantity + '</td>' +
              '<td>NT$ ' + (o.amount || '—') + '</td>' +
              '<td>' + (o.customer_name || '—') + '</td>' +
              '<td>' + (o.contact_method || '—') + '</td>' +
              '<td><span class="status-badge" style="background:' + (statusColors[o.status] || '#999') + ';">' + (statusLabels[o.status] || o.status) + '</span></td>' +
              '<td><select class="admin-status-select" data-order-id="' + o.id + '" onchange="BME_ADMIN.updateOrderStatus(this)">' +
                Object.keys(statusLabels).map(function(k) {
                  return '<option value="' + k + '"' + (o.status === k ? ' selected' : '') + '>' + statusLabels[k] + '</option>';
                }).join('') +
              '</select></td>' +
            '</tr>';
          }).join('') + '</tbody></table></div>';
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
          container.innerHTML = '<div class="empty-state"><p>還沒有客製化訂單</p></div>';
          return;
        }
        container.innerHTML = '<div style="overflow-x:auto;"><table class="admin-table"><thead><tr>' +
          '<th>日期</th><th>客戶</th><th>色系</th><th>金屬</th><th>長度</th><th>類型</th><th>描述</th><th>狀態</th><th>操作</th></tr></thead><tbody>' +
          orders.map(function(o) {
            var date = new Date(o.created_at).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' });
            return '<tr>' +
              '<td>' + date + '</td>' +
              '<td>' + (o.customer_name || '—') + '</td>' +
              '<td>' + (styleLabels[o.glass_color] || o.glass_color) + '</td>' +
              '<td>' + (metalLabels[o.metal_type] || o.metal_type) + '</td>' +
              '<td>' + (lengthLabels[o.chain_length] || o.chain_length) + '</td>' +
              '<td>' + (typeLabels[o.accessory_type] || o.accessory_type) + '</td>' +
              '<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + (o.description || '') + '">' + (o.description?.substring(0,30) || '—') + '</td>' +
              '<td><span class="status-badge" style="background:' + (statusColors[o.status] || '#999') + ';">' + (statusLabels[o.status] || o.status) + '</span></td>' +
              '<td><select class="admin-status-select" data-order-id="' + o.id + '" data-type="custom" onchange="BME_ADMIN.updateCustomStatus(this)">' +
                Object.keys(statusLabels).map(function(k) {
                  return '<option value="' + k + '"' + (o.status === k ? ' selected' : '') + '>' + statusLabels[k] + '</option>';
                }).join('') +
              '</select></td>' +
            '</tr>';
          }).join('') + '</tbody></table></div>';
      });
    });
  },

  updateOrderStatus: function(select) {
    var orderId = select.dataset.orderId;
    var status = select.value;
    initSupabase().then(function(client) {
      client.from('orders').update({ status: status, updated_at: new Date().toISOString() }).eq('id', orderId).then(function(res) {
        if (res.error) { alert('更新失敗'); return; }
        BME_ADMIN.renderOrders();
      });
    });
  },

  updateCustomStatus: function(select) {
    var orderId = select.dataset.orderId;
    var status = select.value;
    initSupabase().then(function(client) {
      client.from('custom_orders').update({ status: status, updated_at: new Date().toISOString() }).eq('id', orderId).then(function(res) {
        if (res.error) { alert('更新失敗'); return; }
        BME_ADMIN.renderCustomOrders();
      });
    });
  }

  renderProducts: function() {
    var container = document.getElementById('admin-panel-content');
    if (!container) return;
    container.innerHTML = '<div class="skeleton-loading" style="padding:40px;text-align:center;">載入商品…</div>';

    var self = this;
    initSupabase().then(function(client) {
      client.from('products').select('*').order('date_added', { ascending: false }).then(function(res) {
        var products = res.data || [];
        var statusLabels = { '上架': '上架', '下架': '下架', '已售出': '已售出', '試作中': '試作中', '即將上架': '即將上架' };
        var statusColors = { '上架': '#7BAE7F', '下架': '#999', '已售出': '#C97B6B', '試作中': '#D4A574', '即將上架': '#8FB8C9' };

        var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
          '<h2 style="margin:0;font-size:18px;color:#0A1628;">商品管理</h2>' +
          '<button class="btn btn-primary" onclick="BME_ADMIN.showAddProductForm()" style="font-size:13px;padding:8px 16px;">＋ 新增商品</button>' +
          '</div>';

        if (products.length === 0) {
          html += '<div class="empty-state"><p>還沒有商品資料</p></div>';
          container.innerHTML = html;
          return;
        }

        html += '<div style="overflow-x:auto;"><table class="admin-table"><thead><tr>' +
          '<th>圖片</th><th>SKU</th><th>商品名稱</th><th>價格</th><th>風格</th><th>材質</th><th>狀態</th><th>已售出</th><th>上架日期</th><th>操作</th></tr></thead><tbody>';

        for (var i = 0; i < products.length; i++) {
          var p = products[i];
          var imgSrc = p.images && p.images[0] ? '../images/products/' + p.images[0] : '';
          var imgHtml = imgSrc ? '<img src="' + imgSrc + '" style="width:48px;height:48px;object-fit:cover;border-radius:4px;">' : '<div style="width:48px;height:48px;background:#E7E0DA;border-radius:4px;"></div>';
          var soldIcon = p.is_sold ? '🔴 已售' : '⚪ 未售';
          var dateStr = p.date_added || '\u2014';

          html += '<tr>' +
            '<td>' + imgHtml + '</td>' +
            '<td style="font-family:monospace;font-size:12px;">' + p.sku + '</td>' +
            '<td>' + p.product_name + '</td>' +
            '<td>NT$ ' + p.price + '</td>' +
            '<td style="font-size:12px;">' + (p.style || '\u2014') + '</td>' +
            '<td style="font-size:12px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + (p.material || '') + '">' + (p.material ? p.material.substring(0,15) + '\u2026' : '\u2014') + '</td>' +
            '<td><span class="status-badge" style="background:' + (statusColors[p.status] || '#999') + ';">' + (statusLabels[p.status] || p.status) + '</span></td>' +
            '<td style="font-size:12px;">' + soldIcon + '</td>' +
            '<td style="font-size:12px;">' + dateStr + '</td>' +
            '<td>' +
              '<select class="admin-status-select" data-product-id="' + p.id + '" onchange="BME_ADMIN.updateProductStatus(this)">' +
                Object.keys(statusLabels).map(function(k) {
                  return '<option value="' + k + '"' + (p.status === k ? ' selected' : '') + '>' + statusLabels[k] + '</option>';
                }).join('') +
              '</select>' +
              '<br>' +
              '<label style="font-size:11px;color:#666;cursor:pointer;margin-top:4px;display:inline-block;">' +
                '<input type="checkbox" ' + (p.is_sold ? 'checked' : '') + ' onchange="BME_ADMIN.toggleSold(\'' + p.id + '\', this.checked)"> 已售出' +
              '</label>' +
            '</td>' +
          '</tr>';
        }

        html += '</tbody></table></div>';
        container.innerHTML = html;
      });
    });
  },

  showAddProductForm: function() {
    var container = document.getElementById('admin-panel-content');
    container.innerHTML =
      '<div style="max-width:600px;margin:0 auto;">' +
      '<h2 style="font-size:18px;color:#0A1628;margin-bottom:12px;">新增商品</h2>' +
      '<div class="admin-form">' +
        '<label>商品名稱 <input id="new-name" class="admin-input" placeholder="例如：蝶舞玫瑰"></label>' +
        '<label>SKU <input id="new-sku" class="admin-input" placeholder="例如：BM-R001"></label>' +
        '<label>價格 (NT$) <input id="new-price" class="admin-input" type="number" placeholder="299"></label>' +
        '<label>風格 <input id="new-style" class="admin-input" placeholder="浪漫復古"></label>' +
        '<label>風格代碼 ' +
          '<select id="new-style-profile" class="admin-input">' +
            '<option value="romantic_rose">浪漫復古</option>' +
            '<option value="clear_pastel">清透日常</option>' +
            '<option value="porcelain_blue">霧藍瓷感</option>' +
            '<option value="sage_natural">自然清新</option>' +
            '<option value="midnight_luxury">午夜精品</option>' +
          '</select>' +
        '</label>' +
        '<label>材質 <textarea id="new-material" class="admin-input" rows="2" placeholder="琉璃珠、金色配件"></textarea></label>' +
        '<label>特色一句話 <input id="new-feature" class="admin-input" placeholder="玫瑰與蝴蝶交錯的復古甜感"></label>' +
        '<label>描述 <textarea id="new-desc" class="admin-input" rows="4" placeholder="商品詳細描述…"></textarea></label>' +
        '<label>標籤（逗號分隔）<input id="new-tags" class="admin-input" placeholder="手機鏈,玫瑰,復古"></label>' +
        '<label>狀態 ' +
          '<select id="new-status" class="admin-input">' +
            '<option value="上架">上架</option>' +
            '<option value="即將上架">即將上架</option>' +
            '<option value="試作中">試作中</option>' +
            '<option value="下架">下架</option>' +
          '</select>' +
        '</label>' +
        '<div style="display:flex;gap:8px;margin-top:16px;">' +
          '<button class="btn btn-primary" onclick="BME_ADMIN.saveNewProduct()">儲存商品</button>' +
          '<button class="btn btn-secondary" onclick="BME_ADMIN.renderProducts()">取消</button>' +
        '</div>' +
      '</div></div>';
  },

  saveNewProduct: function() {
    var name = document.getElementById('new-name').value.trim();
    var sku = document.getElementById('new-sku').value.trim();
    var price = parseInt(document.getElementById('new-price').value) || 0;
    var style = document.getElementById('new-style').value.trim();
    var styleProfile = document.getElementById('new-style-profile').value;
    var material = document.getElementById('new-material').value.trim();
    var feature = document.getElementById('new-feature').value.trim();
    var desc = document.getElementById('new-desc').value.trim();
    var tagsStr = document.getElementById('new-tags').value.trim();
    var status = document.getElementById('new-status').value;

    if (!name || !sku) { alert('請填寫商品名稱和 SKU'); return; }
    if (!price) { alert('請填寫價格'); return; }

    initSupabase().then(function(client) {
      client.from('products').insert({
        sku: sku,
        product_name: name,
        price: price,
        style: style || styleProfile,
        style_profile: styleProfile,
        material: material,
        feature: feature,
        description: desc,
        tags: tagsStr ? tagsStr.split(',').map(function(t) { return t.trim(); }).filter(function(t) { return t; }) : [],
        status: status,
        date_added: new Date().toISOString().split('T')[0],
        images: [],
        is_sold: false
      }).then(function(res) {
        if (res.error) { alert('新增失敗：' + res.error.message); return; }
        alert('商品已新增！');
        BME_ADMIN.renderProducts();
      });
    });
  },

  updateProductStatus: function(select) {
    var productId = select.dataset.productId;
    var status = select.value;
    initSupabase().then(function(client) {
      client.from('products').update({ status: status, updated_at: new Date().toISOString() }).eq('id', productId).then(function(res) {
        if (res.error) { alert('更新失敗'); return; }
        BME_ADMIN.renderProducts();
      });
    });
  },

  toggleSold: function(productId, checked) {
    initSupabase().then(function(client) {
      var updates = { is_sold: checked, updated_at: new Date().toISOString() };
      if (checked) updates.status = '已售出';
      client.from('products').update(updates).eq('id', productId).then(function(res) {
        if (res.error) { alert('更新失敗'); return; }
        BME_ADMIN.renderProducts();
      });
    });
  }

};

