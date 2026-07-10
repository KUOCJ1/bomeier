// Bo Mei Er — Authentication Module
// 依賴：supabase-config.js, Supabase JS SDK (v2)

let BME_AUTH = null;
let supabaseClient = null;

// 初始化 Supabase 客戶端（需先載入 supabase-config.js）
async function initSupabase() {
  if (supabaseClient) return supabaseClient;
  if (typeof BME_SUPABASE_CONFIG === 'undefined') {
    console.warn('⚠️ supabase-config.js 尚未設定。請先填寫 Supabase URL 與 Anon Key。');
    return null;
  }
  if (typeof supabase === 'undefined') {
    // 動態載入 Supabase JS SDK
    await loadSupabaseSDK();
  }
  const { createClient } = supabase;
  supabaseClient = createClient(BME_SUPABASE_CONFIG.url, BME_SUPABASE_CONFIG.anonKey);
  return supabaseClient;
}

function loadSupabaseSDK() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// ========================================
// Auth API
// ========================================

async function BME_register(email, password, nickname) {
  const client = await initSupabase();
  if (!client) throw new Error('Supabase 尚未設定');
  
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: { nickname }
    }
  });
  if (error) {
    // 避免直接顯示 Supabase 原始錯誤（如 500 時的 '{}'）
    var errMsg = error.message;
    if (!errMsg || errMsg === '{}' || errMsg === '[object Object]' || error.status === 500) {
      errMsg = '伺服器暫時無法回應，請稍後再試。若持續發生請聯繫我們。';
    }
    throw new Error(errMsg);
  }
  return data;
}

async function BME_login(email, password) {
  const client = await initSupabase();
  if (!client) throw new Error('Supabase 尚未設定');
  
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    // 避免直接顯示 Supabase 原始錯誤（如 500 時的 '{}'）
    var errMsg = error.message;
    if (!errMsg || errMsg === '{}' || errMsg === '[object Object]' || error.status === 500) {
      errMsg = '伺服器暫時無法回應，請稍後再試。若持續發生請聯繫我們。';
    }
    throw new Error(errMsg);
  }
  return data;
}

async function BME_logout() {
  const client = await initSupabase();
  if (!client) return;
  await client.auth.signOut();
  updateAuthNav();
}

async function BME_getSession() {
  const client = await initSupabase();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session;
}

async function BME_getUser() {
  const session = await BME_getSession();
  if (!session) return null;
  return session.user;
}

async function BME_getProfile() {
  const user = await BME_getUser();
  if (!user) return null;
  const client = await initSupabase();
  if (!client) return null;
  
  const { data } = await client
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  return data;
}

// ========================================
// Navigation 更新（共用於所有頁面）
// ========================================

function updateAuthNav() {
  const container = document.getElementById('auth-nav-items');
  if (!container) return;

  BME_getUser().then(user => {
    if (user) {
      // 已登入
      BME_getProfile().then(profile => {
        const nickname = profile?.nickname || '會員';
        container.innerHTML = `
          <a href="favorites.html" class="nav-auth-link nav-fav-link">❤️ 我的最愛</a>
          <span class="nav-greeting">${nickname}</span>
          <a href="#" class="nav-auth-link" id="nav-logout-btn" onclick="BME_logout();return false;">登出</a>
        `;
      });
    } else {
      // 未登入
      container.innerHTML = `
        <a href="register.html" class="nav-auth-link">註冊</a>
        <a href="login.html" class="nav-auth-link">登入</a>
      `;
    }
  }).catch(() => {
    container.innerHTML = `
      <a href="register.html" class="nav-auth-link">註冊</a>
      <a href="login.html" class="nav-auth-link">登入</a>
    `;
  });
}

// 頁面載入時初始化 auth
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('auth-nav-items');
  if (container) {
    updateAuthNav();
  }
});


