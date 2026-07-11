// Bo Mei Er — Favorites Module
// 依賴：auth.js, supabase-config.js

// ========================================
// 我的最愛 API
// ========================================

async function BME_getFavorites() {
  const user = await BME_getUser();
  if (!user) return [];
  
  const client = await initSupabase();
  if (!client) return [];
  
  const { data } = await client
    .from('favorites')
    .select('sku, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  return data || [];
}

async function BME_isFavorited(sku) {
  const favs = await BME_getFavorites();
  return favs.some(f => f.sku === sku);
}

async function BME_toggleFavorite(sku) {
  const user = await BME_getUser();
  if (!user) {
    // 未登入，導到登入頁
    const currentPage = window.location.pathname.split('/').pop() + window.location.search;
    window.location.href = 'login.html?redirect=' + encodeURIComponent(currentPage);
    return;
  }

  const client = await initSupabase();
  if (!client) return;

  const isFav = await BME_isFavorited(sku);
  
  if (isFav) {
    await client
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('sku', sku);
  } else {
    await client
      .from('favorites')
      .insert({ user_id: user.id, sku });
  }
  
  // 更新 UI
  updateFavButton(sku);
}

function updateFavButton(sku) {
  const btn = document.querySelector(`.fav-btn[data-sku="${sku}"]`);
  if (!btn) return;
  
  BME_isFavorited(sku).then(isFav => {
    btn.classList.toggle('fav-active', isFav);
    btn.setAttribute('aria-label', isFav ? '取消收藏' : '加入收藏');
  });
}

// ========================================
// 渲染我的最愛頁面
// ========================================

function renderFavoritesList() {
  const container = document.getElementById('favorites-grid');
  if (!container) return;
  
  container.innerHTML = '<div class="skeleton-loading"><div class="skeleton-card"><div class="skeleton-img"></div><div class="skeleton-body"><div class="skeleton-line"></div><div class="skeleton-line"></div></div></div></div>';
  
  BME_getFavorites().then(async favs => {
    if (favs.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>你還沒有收藏任何商品</p>
          <a href="products.html" class="btn btn-primary" style="margin-top:16px;">去逛逛</a>
        </div>
      `;
      return;
    }
    
    // 載入商品資料來取得完整資訊，與商品頁使用同一套後台同步資料。
    if (typeof BME !== 'undefined' && BME.init) {
      await BME.init();
    }
    const allProducts = (typeof BME !== 'undefined' && BME.products) ? BME.products : [];
    
    const favoritedProducts = favs
      .map(f => allProducts.find(p => p.sku === f.sku))
      .filter(Boolean);
    
    if (favoritedProducts.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>收藏的商品已下架或不存在</p>
          <a href="products.html" class="btn btn-primary" style="margin-top:16px;">去逛逛</a>
        </div>
      `;
      return;
    }
    
    const favSkus = favs.map(f => f.sku);
    
    // 使用 BME.createCard 來保持風格一致
    if (typeof BME !== 'undefined' && BME.createCard) {
      container.innerHTML = favoritedProducts.map(p => {
        const cardHtml = BME.createCard(p);
        // 在卡片上追加最愛按鈕
        return cardHtml.replace('</a>', 
          `<button class="fav-btn fav-btn-card fav-active" data-sku="${p.sku}" onclick="event.preventDefault();BME_toggleFavorite('${p.sku}')" aria-label="取消收藏">❤</button></a>`
        );
      }).join('');
    } else {
      // Fallback 簡易渲染
      container.innerHTML = favoritedProducts.map(p => `
        <a href="product.html?sku=${p.sku}" class="product-card${p.style_profile ? ' style-bg-' + p.style_profile : ''}" data-sku="${p.sku}">
          <div class="product-card-image">
            <img src="${typeof BME !== 'undefined' && BME.resolveProductImage ? BME.resolveProductImage(p.images?.[0] || 'placeholder_01.jpg') : 'images/products/' + (p.images?.[0] || 'placeholder_01.jpg')}" alt="${p.product_name}" class="product-card-main-img" loading="lazy">
          </div>
          <div class="product-card-body">
            <div class="product-card-name">${p.product_name}</div>
            <div class="product-card-price">${p.price}</div>
          </div>
          <button class="fav-btn fav-btn-card fav-active" onclick="event.preventDefault();BME_toggleFavorite('${p.sku}')" aria-label="取消收藏">❤</button>
        </a>
      `).join('');
    }
    
    // 通知 badge 更新
    if (typeof updateFavBadge === 'function') updateFavBadge();
  }).catch(() => {
    container.innerHTML = '<p style="text-align:center;color:#888;padding:48px;">無法載入收藏清單，請稍後再試。</p>';
  });
}

// ========================================
// 最愛數量 badge
// ========================================

async function updateFavBadge() {
  const favs = await BME_getFavorites();
  const badge = document.getElementById('fav-badge');
  if (!badge) return;
  if (favs.length > 0) {
    badge.textContent = favs.length;
    badge.style.display = 'inline';
  } else {
    badge.style.display = 'none';
  }
}
