# Bo Mei Er Soft Atelier Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Bo Mei Er into a Soft Atelier boutique experience while adding backend-managed custom-order options.

**Architecture:** Keep the existing static frontend plus Supabase backend. Add small data/config layers for custom options, then restyle existing pages through shared CSS tokens and focused JS helpers without replacing the current deployment or product data flow.

**Tech Stack:** Static HTML/CSS/JavaScript in `public/`, Supabase tables/RLS/migrations, existing Vinext build/deploy pipeline, Browser/IAB validation.

---

## File Structure

- Modify `public/css/style.css`: Soft Atelier tokens, page rhythm, hero, product cards, product controls, custom page, journal/about polish, motion rules.
- Modify `public/js/main.js`: scroll reveal refinements, reduced-motion support, nav scroll behavior.
- Modify `public/index.html`: new Soft Atelier hero and curated latest-product section.
- Modify `public/products.html`: boutique filter/control layout and empty-state copy while preserving IDs consumed by `public/js/products.js`.
- Modify `public/product.html`: detail-page layout hooks only if existing markup needs section classes for visual polish.
- Modify `public/custom.html`: copy and structural hooks for dynamic custom option rendering.
- Modify `public/js/custom.js`: default custom option config, Supabase option/settings loading, dynamic step rendering, fallback behavior.
- Modify `public/admin/orders.html`: add sidebar entry for custom option settings.
- Modify `public/js/admin.js`: render/manage custom options and custom page settings.
- Modify `public/css/admin.css`: admin styling for option-management cards/forms and softer visual system.
- Modify `public/journal.html` and `public/js/journal.js`: magazine-like featured article and lighter list rendering.
- Modify `public/about.html`: reduce opening narrative and improve visual rhythm.
- Create `public/supabase/migrations/20260711143000_custom_options_settings.sql`: `custom_options` and `custom_page_settings` tables, policies, and seed data.

---

### Task 1: Add Soft Atelier Visual Foundation

**Files:**
- Modify: `public/css/style.css`
- Modify: `public/js/main.js`

- [ ] **Step 1: Add Soft Atelier tokens near the existing `:root` block**

Add these variables without removing existing names so old selectors keep working:

```css
:root {
  --atelier-paper: #FBF8F4;
  --atelier-porcelain: #F3ECE4;
  --atelier-ink: #1F1915;
  --atelier-taupe: #7A6A5E;
  --atelier-line: rgba(31, 25, 21, 0.10);
  --atelier-rose: #C9956B;
  --atelier-deep: #171310;
  --atelier-shadow-soft: 0 18px 50px rgba(31, 25, 21, 0.08);
  --atelier-shadow-lift: 0 24px 70px rgba(31, 25, 21, 0.12);
  --atelier-serif: "Noto Serif TC", "Songti TC", serif;
  --atelier-sans: "Noto Sans TC", "Microsoft JhengHei", sans-serif;
  --atelier-display: "Playfair Display", "Georgia", serif;
}
```

- [ ] **Step 2: Replace global background/type defaults with Soft Atelier values**

Update existing `body`, `h1, h2, h3, h4`, `.section`, `.section-alt`, `.section-header`, `.section-subtitle`, `.btn-primary`, `.btn-secondary`, `.nav`, `.nav.scrolled`, and `.nav-links a` styles so they use the new tokens. Keep class names unchanged.

Expected style behavior:

```css
body {
  background: var(--atelier-paper);
  color: var(--atelier-ink);
  font-family: var(--atelier-sans);
}

h1, h2, h3, h4 {
  font-family: var(--atelier-serif);
  font-weight: 600;
  letter-spacing: 0;
}

.section-alt {
  background: linear-gradient(180deg, var(--atelier-paper), var(--atelier-porcelain));
}
```

- [ ] **Step 3: Add motion and reduced-motion rules**

Add one shared reveal system and preserve `.fade-in` compatibility:

```css
.atelier-reveal,
.fade-in {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 900ms ease, transform 900ms ease;
}

.atelier-reveal.visible,
.fade-in.visible {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 4: Update `public/js/main.js` reveal observer**

Change the observer target selector to include `.atelier-reveal`:

```js
const fadeEls = document.querySelectorAll('.fade-in, .atelier-reveal');
```

Before creating the observer, add this guard:

```js
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) {
  fadeEls.forEach(el => el.classList.add('visible'));
} else {
  // existing IntersectionObserver logic stays here
}
```

- [ ] **Step 5: Verify foundation**

Run:

```powershell
node --check public\js\main.js
npm run build
```

Expected: both commands pass. Commit:

```powershell
git add public/css/style.css public/js/main.js
git commit -m "Refine Soft Atelier visual foundation"
```

---

### Task 2: Redesign Homepage, Product Cards, and Catalog Controls

**Files:**
- Modify: `public/index.html`
- Modify: `public/products.html`
- Modify: `public/product.html`
- Modify: `public/css/style.css`
- Modify: `public/js/products.js` only if markup support is needed

- [ ] **Step 1: Replace homepage hero copy and structure**

In `public/index.html`, keep `<section class="hero">` but add a modifier class:

```html
<section class="hero atelier-hero">
```

Use this hero copy:

```html
<p class="subtitle">Bo Mei Er Atelier</p>
<h1>日常裡，安靜發光的配飾</h1>
<p class="description">
  手作琉璃、金屬配件與色彩搭配，替手機鏈與日常小物留下更細緻的表情。
</p>
```

Keep CTA labels:

```html
<a href="products.html#style-guide" class="btn btn-primary">先看風格</a>
<a href="custom.html" class="btn btn-secondary">開始客製</a>
```

- [ ] **Step 2: Add homepage curated section**

Replace the plain `最新商品` block heading with:

```html
<div class="atelier-curation-copy atelier-reveal">
  <span class="atelier-section-label">New Arrivals</span>
  <h2>近期完成的選物</h2>
  <p>每一件都保留琉璃與五金自己的表情，不大量複製，只挑適合日常使用的比例與色調。</p>
</div>
```

Keep `id="product-grid"` and `data-limit="4"` because `BME.renderGrid` depends on them.

- [ ] **Step 3: Restyle product cards globally**

Update `.product-card`, `.product-card-image`, `.product-card-main-img`, `.product-card-hero-img`, `.product-card-body`, `.product-card-name`, `.product-card-price`, `.fav-btn-card`, and `.cart-btn-card`.

Required behavior:

```css
.product-card {
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid var(--atelier-line);
  box-shadow: none;
}

.product-card-image {
  aspect-ratio: 4 / 5;
  background: var(--atelier-porcelain);
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--atelier-shadow-soft);
}

.product-card:hover .product-card-main-img {
  transform: scale(1.035);
}
```

- [ ] **Step 4: Restyle catalog controls**

In `public/products.html`, keep all IDs:

```html
id="product-search"
id="product-type"
id="product-sort"
id="product-result-count"
```

Update CSS so `.filter-bar` and `.product-controls` look like boutique filters:

```css
.product-controls {
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid var(--atelier-line);
  border-radius: 6px;
  box-shadow: none;
}

.filter-btn {
  border-radius: 999px;
  background: transparent;
}
```

- [ ] **Step 5: Polish product detail page**

If `public/product.html` already has layout wrappers, style them only. If it lacks usable hooks, add:

```html
<section class="product-detail-section atelier-product-detail">
```

Do not change IDs consumed by `BME.renderDetail`, including:

```html
id="product-name"
id="product-style"
id="product-material"
id="product-description"
id="product-price"
id="product-status"
id="product-tags"
```

- [ ] **Step 6: Verify catalog behavior**

Run:

```powershell
node --check public\js\products.js
npm run build
```

Browser check:

1. Open `http://127.0.0.1:<port>/index.html`.
2. Confirm hero copy is visible and the next section peeks below first viewport.
3. Open `products.html`.
4. Search `手機鏈`.
5. Select type `phone_strap`.
6. Select sort `price_desc`.
7. Confirm cards update and console has no errors.

Commit:

```powershell
git add public/index.html public/products.html public/product.html public/css/style.css public/js/products.js
git commit -m "Redesign storefront with Soft Atelier catalog polish"
```

---

### Task 3: Add Backend-Managed Custom Options Data Model

**Files:**
- Create: `public/supabase/migrations/20260711143000_custom_options_settings.sql`

- [ ] **Step 1: Create `custom_options` and `custom_page_settings` tables**

Add migration:

```sql
CREATE TABLE IF NOT EXISTS public.custom_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  option_group TEXT NOT NULL CHECK (option_group IN ('style', 'metal', 'length', 'type')),
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(option_group, code)
);

CREATE TABLE IF NOT EXISTS public.custom_page_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

- [ ] **Step 2: Add RLS policies**

Use the same admin allowlist pattern as existing products:

```sql
ALTER TABLE public.custom_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_page_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active custom options"
  ON public.custom_options FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admin full access to custom options"
  ON public.custom_options FOR ALL
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'kuocj1@gmail.com'
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'kuocj1@gmail.com'
  );

CREATE POLICY "Anyone can view custom page settings"
  ON public.custom_page_settings FOR SELECT
  USING (TRUE);

CREATE POLICY "Admin full access to custom page settings"
  ON public.custom_page_settings FOR ALL
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'kuocj1@gmail.com'
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'kuocj1@gmail.com'
  );
```

- [ ] **Step 3: Seed default options**

Seed all current frontend defaults with `ON CONFLICT` so migration is repeatable. Example style seed:

```sql
INSERT INTO public.custom_options (option_group, code, label, description, image_url, metadata, sort_order, is_active)
VALUES
('style', 'romantic_rose', '浪漫復古', '玫瑰金與粉色珠串，偏送禮與約會感。', 'images/products/BM-T007_main.jpg',
 '{"scene":"送禮 / 約會 / 柔和穿搭","wear":"奶茶色、白色、針織、洋裝","feel":"柔和暖調","productName":"櫻花雨","accent":"#D4A574","colorLabel":"玫瑰金、粉嫩色系"}'::jsonb, 10, TRUE)
ON CONFLICT (option_group, code) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  metadata = EXCLUDED.metadata,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
```

Repeat for:

```text
style: clear_pastel, porcelain_blue, sage_natural, midnight_luxury
metal: rose_gold, warm_gold, silver, black
length: choker, medium, long, custom_length
type: phone_strap, earrings, bracelet, necklace, keychain, other
```

- [ ] **Step 4: Seed page settings**

Add:

```sql
INSERT INTO public.custom_page_settings (key, value)
VALUES
('custom_page', '{
  "heroTitle":"打造你的夢想飾品",
  "heroSubtitle":"選風格、選材質、補需求，我們把你的想法整理成可以配戴的日常小物。",
  "referenceHelp":"上傳風格照、手機殼照，或一張你喜歡的配色範例。",
  "descriptionPlaceholder":"例如：想要更淡一點、偏金色一點、希望像送禮款、可接受的長度範圍……",
  "submitLabel":"送出客製想法",
  "successTitle":"客製想法已送出",
  "successBody":"我們會在 1-2 個工作天內透過 IG 私訊你，確認細節。"
}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
```

- [ ] **Step 5: Commit migration**

Run:

```powershell
git add public\supabase\migrations\20260711143000_custom_options_settings.sql
git commit -m "Add configurable custom order options schema"
```

---

### Task 4: Make Custom Page Dynamic and Soft Atelier Styled

**Files:**
- Modify: `public/custom.html`
- Modify: `public/js/custom.js`
- Modify: `public/css/style.css`

- [ ] **Step 1: Add semantic hooks to `custom.html`**

Change the page section:

```html
<section class="section custom-atelier-section">
```

Change header text nodes to elements that can be updated:

```html
<h2 id="custom-page-title">打造你的夢想飾品</h2>
<p class="section-subtitle">Custom Atelier</p>
<p id="custom-page-subtitle" class="custom-page-lead">選風格、選材質、補需求，我們把你的想法整理成可以配戴的日常小物。</p>
```

- [ ] **Step 2: Add default config object to `custom.js`**

Replace hardcoded `styleCards` with grouped default config:

```js
defaultConfig: {
  settings: {
    heroTitle: '打造你的夢想飾品',
    heroSubtitle: '選風格、選材質、補需求，我們把你的想法整理成可以配戴的日常小物。',
    referenceHelp: '上傳風格照、手機殼照，或一張你喜歡的配色範例。',
    descriptionPlaceholder: '例如：想要更淡一點、偏金色一點、希望像送禮款、可接受的長度範圍……',
    submitLabel: '送出客製想法',
    successTitle: '客製想法已送出',
    successBody: '我們會在 1-2 個工作天內透過 IG 私訊你，確認細節。'
  },
  options: {
    style: [],
    metal: [],
    length: [],
    type: []
  }
}
```

Populate each array from current hardcoded values.

- [ ] **Step 3: Load Supabase config before rendering**

Change `init`:

```js
init: async function() {
  await this.loadCustomConfig();
  this.applyPageSettings();
  this.renderStep(this.currentStep);
  this.updateProgress();
  this.setupNavigation();
}
```

Add:

```js
loadCustomConfig: async function() {
  this.config = JSON.parse(JSON.stringify(this.defaultConfig));
  try {
    if (typeof initSupabase !== 'function') return;
    var client = await initSupabase();
    if (!client) return;

    var optionsRes = await client
      .from('custom_options')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (optionsRes.data && optionsRes.data.length) {
      this.config.options = this.normalizeOptions(optionsRes.data);
    }

    var settingsRes = await client
      .from('custom_page_settings')
      .select('value')
      .eq('key', 'custom_page')
      .single();
    if (settingsRes.data && settingsRes.data.value) {
      this.config.settings = Object.assign({}, this.config.settings, settingsRes.data.value);
    }
  } catch (e) {
    console.warn('Custom config fallback active:', e);
  }
}
```

- [ ] **Step 4: Normalize option rows**

Add:

```js
normalizeOptions: function(rows) {
  var grouped = { style: [], metal: [], length: [], type: [] };
  rows.forEach(function(row) {
    var metadata = row.metadata || {};
    if (!grouped[row.option_group]) return;
    grouped[row.option_group].push({
      value: row.code,
      label: row.label,
      desc: row.description || metadata.description || '',
      image: row.image_url || metadata.image || '',
      scene: metadata.scene || '',
      wear: metadata.wear || '',
      feel: metadata.feel || '',
      productName: metadata.productName || '',
      accent: metadata.accent || '#C9956B',
      colorLabel: metadata.colorLabel || '',
      emoji: metadata.emoji || ''
    });
  });
  return grouped;
}
```

- [ ] **Step 5: Rewrite render methods to use config**

Map steps:

```js
var groupMap = { 1: 'style', 2: 'metal', 3: 'length', 4: 'type' };
```

Use `this.config.options.style` in `renderStep1`, `this.config.options.metal` in `renderStep2`, `this.config.options.length` in `renderStep3`, and `this.config.options.type` in `renderStep4`.

Selection keys remain unchanged:

```js
style -> selections.glassColor
metal -> selections.metalType
length -> selections.chainLength
type -> selections.accessoryType
```

- [ ] **Step 6: Use settings in final step and submit button**

In `renderStep5`, use:

```js
var settings = this.config.settings;
```

Then set placeholder:

```html
placeholder="' + this.escapeHtml(settings.descriptionPlaceholder) + '"
```

In `renderStep`, when step is 4:

```js
nextBtn.textContent = this.config.settings.submitLabel || '送出客製想法';
```

- [ ] **Step 7: Add `escapeHtml` helper**

Add to `BME_CUSTOM`:

```js
escapeHtml: function(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

Use it for every dynamic label/description/image URL rendered into HTML.

- [ ] **Step 8: Add Soft Atelier custom styles**

Add CSS:

```css
.custom-atelier-section .section-inner {
  max-width: 1120px;
}

.custom-step-container {
  background: rgba(255, 255, 255, 0.68);
  border: 1px solid var(--atelier-line);
  border-radius: 8px;
  box-shadow: var(--atelier-shadow-soft);
}

.custom-style-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.custom-style-option {
  min-height: 360px;
}

@media (max-width: 760px) {
  .custom-style-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 9: Verify custom page fallback and dynamic behavior**

Run:

```powershell
node --check public\js\custom.js
npm run build
```

Browser check without migration applied:

1. Open `custom.html`.
2. Confirm default options still render.
3. Pick one option per step.
4. Confirm final step renders summary and reference upload.

Commit:

```powershell
git add public/custom.html public/js/custom.js public/css/style.css
git commit -m "Make custom order page configurable"
```

---

### Task 5: Add Admin Custom Option Management

**Files:**
- Modify: `public/admin/orders.html`
- Modify: `public/js/admin.js`
- Modify: `public/css/admin.css`

- [ ] **Step 1: Add sidebar entry**

In `public/admin/orders.html`, add after custom orders:

```html
<button class="admin-nav-btn" data-page="custom-options" onclick="BME_ADMIN.loadPage('custom-options')">🧵 客製選項</button>
```

- [ ] **Step 2: Route admin page**

In `BME_ADMIN.loadPage`, add:

```js
else if (page === 'custom-options') this.renderCustomOptions();
```

- [ ] **Step 3: Add option-group labels**

Add helpers:

```js
customOptionGroups: {
  style: '風格',
  metal: '金屬',
  length: '長度',
  type: '商品類型'
},

getCustomOptionGroupLabel: function(group) {
  return this.customOptionGroups[group] || group;
}
```

- [ ] **Step 4: Render custom options list**

Add `renderCustomOptions`:

```js
renderCustomOptions: function() {
  var container = document.getElementById('admin-panel-content');
  if (!container) return;
  container.innerHTML = '<div class="skeleton-loading" style="padding:40px;text-align:center;">載入客製選項…</div>';

  initSupabase().then(function(client) {
    Promise.all([
      client.from('custom_options').select('*').order('option_group', { ascending: true }).order('sort_order', { ascending: true }),
      client.from('custom_page_settings').select('*').eq('key', 'custom_page').single()
    ]).then(function(results) {
      var options = results[0].data || [];
      var settings = results[1].data && results[1].data.value ? results[1].data.value : {};
      var html = '<div class="admin-toolbar"><div><h2 style="margin:0;font-size:18px;color:#0A1628;">客製選項管理</h2><p style="margin:4px 0 0;color:#777;font-size:13px;">調整前台客製頁的風格、材質、長度與表單提示。</p></div><button class="btn btn-primary" onclick="BME_ADMIN.showCustomOptionForm()">＋ 新增選項</button></div>';
      html += BME_ADMIN.renderCustomSettingsForm(settings);
      html += BME_ADMIN.renderCustomOptionsTable(options);
      container.innerHTML = html;
    }).catch(function(err) {
      container.innerHTML = '<div class="empty-state"><p>客製選項讀取失敗：' + BME_ADMIN.escapeHtml((err && err.message) ? err.message : '請先建立 custom_options 資料表') + '</p></div>';
    });
  });
}
```

- [ ] **Step 5: Render table and forms**

Add `renderCustomOptionsTable(options)` that outputs columns:

```text
類型, 排序, 名稱, 代碼, 說明, 狀態, 操作
```

Each row uses:

```html
<button class="admin-link-btn" onclick="BME_ADMIN.showCustomOptionForm('OPTION_ID')">編輯</button>
<button class="admin-link-btn danger" onclick="BME_ADMIN.toggleCustomOptionActive('OPTION_ID', false)">停用</button>
```

Use `true` for re啟用 when `is_active` is false.

- [ ] **Step 6: Save custom option**

Add `saveCustomOption` that writes:

```js
var payload = {
  option_group: document.getElementById('custom-option-group').value,
  code: document.getElementById('custom-option-code').value.trim(),
  label: document.getElementById('custom-option-label').value.trim(),
  description: document.getElementById('custom-option-description').value.trim(),
  image_url: document.getElementById('custom-option-image').value.trim(),
  metadata: {
    scene: document.getElementById('custom-option-scene').value.trim(),
    wear: document.getElementById('custom-option-wear').value.trim(),
    feel: document.getElementById('custom-option-feel').value.trim(),
    productName: document.getElementById('custom-option-product').value.trim(),
    accent: document.getElementById('custom-option-accent').value.trim(),
    colorLabel: document.getElementById('custom-option-color-label').value.trim(),
    emoji: document.getElementById('custom-option-emoji').value.trim()
  },
  sort_order: parseInt(document.getElementById('custom-option-sort').value, 10) || 0,
  is_active: document.getElementById('custom-option-active').checked,
  updated_at: new Date().toISOString()
};
```

Validation:

```js
if (!payload.code || !payload.label) {
  alert('請填寫代碼與名稱');
  return;
}
if (!/^[a-z0-9_\\-]+$/.test(payload.code)) {
  alert('代碼只能使用小寫英文、數字、底線與連字號');
  return;
}
```

- [ ] **Step 7: Save page settings**

Add `saveCustomPageSettings` that upserts:

```js
{
  key: 'custom_page',
  value: {
    heroTitle: document.getElementById('custom-setting-hero-title').value.trim(),
    heroSubtitle: document.getElementById('custom-setting-hero-subtitle').value.trim(),
    referenceHelp: document.getElementById('custom-setting-reference-help').value.trim(),
    descriptionPlaceholder: document.getElementById('custom-setting-description-placeholder').value.trim(),
    submitLabel: document.getElementById('custom-setting-submit-label').value.trim(),
    successTitle: document.getElementById('custom-setting-success-title').value.trim(),
    successBody: document.getElementById('custom-setting-success-body').value.trim()
  },
  updated_at: new Date().toISOString()
}
```

- [ ] **Step 8: Add admin CSS**

Add:

```css
.admin-settings-card {
  background: #fff;
  border: 1px solid #E7E0DA;
  border-radius: 8px;
  padding: 18px;
  margin-bottom: 18px;
}

.admin-option-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 768px) {
  .admin-option-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 9: Verify admin syntax**

Run:

```powershell
node --check public\js\admin.js
npm run build
```

Manual browser check after migration is available:

1. Login as `kuocj1@gmail.com`.
2. Open `admin/orders.html?page=custom-options`.
3. Confirm options list or helpful database warning.
4. Edit one option label or sort order.
5. Open `custom.html` and confirm frontend reflects the change.

Commit:

```powershell
git add public/admin/orders.html public/js/admin.js public/css/admin.css
git commit -m "Add admin management for custom options"
```

---

### Task 6: Polish Journal, About, and Admin Visual Density

**Files:**
- Modify: `public/journal.html`
- Modify: `public/js/journal.js`
- Modify: `public/about.html`
- Modify: `public/css/style.css`
- Modify: `public/css/admin.css`

- [ ] **Step 1: Add journal featured section hooks**

In `journal.html`, add a target before existing article list:

```html
<div id="journal-featured" class="journal-featured atelier-reveal"></div>
<div id="journal-list" class="journal-list"></div>
```

Do not remove existing article containers until `journal.js` is updated.

- [ ] **Step 2: Render featured article in `journal.js`**

When posts are available, select:

```js
var featured = posts.find(function(post) { return post.featured; }) || posts[0];
var remaining = posts.filter(function(post) { return post !== featured; });
```

Render featured into `#journal-featured`:

```html
<a class="journal-featured-card" href="journal.html?post=SLUG">
  <img src="COVER" alt="TITLE">
  <div>
    <span class="atelier-section-label">Featured Journal</span>
    <h2>TITLE</h2>
    <p>EXCERPT</p>
  </div>
</a>
```

- [ ] **Step 3: Reduce about page opening narrative**

In `about.html`, change the opening body to three brand-position sentences:

```html
<p>鉑魅兒相信，日常小物也可以有被仔細選過的表情。</p>
<p>我們用手作琉璃、金屬配件與色彩比例，讓手機鏈不只是一條繫繩。</p>
<p>它可以是送禮、搭配、或每天低頭時看見的一點光。</p>
```

Keep timeline content after the opening section.

- [ ] **Step 4: Polish admin density**

Update `admin.css`:

```css
.admin-main {
  background: #FBF8F4;
}

.admin-table {
  background: #fff;
  border: 1px solid #E7E0DA;
}

.status-badge {
  border-radius: 999px;
  font-weight: 500;
}
```

- [ ] **Step 5: Verify**

Run:

```powershell
node --check public\js\journal.js
npm run build
```

Browser check:

1. Open `journal.html`, confirm featured card and lighter list.
2. Open `about.html`, confirm top section is shorter.
3. Open admin page, confirm tables remain usable.

Commit:

```powershell
git add public/journal.html public/js/journal.js public/about.html public/css/style.css public/css/admin.css
git commit -m "Polish editorial and admin surfaces"
```

---

### Task 7: Full QA, Deploy, and Public Sync

**Files:**
- No planned source edits unless QA finds issues.

- [ ] **Step 1: Run full static checks**

Run:

```powershell
node --check public\js\main.js
node --check public\js\products.js
node --check public\js\custom.js
node --check public\js\journal.js
node --check public\js\admin.js
npm run build
git diff --check
```

Expected: all pass.

- [ ] **Step 2: Browser QA desktop**

Use the in-app browser first. Test:

```text
index.html -> hero and next-section preview
products.html -> search/filter/sort
product.html?sku=BM-T001 -> detail page image/info/tags
custom.html -> complete steps 1 through 5
journal.html -> featured article/list
about.html -> shortened opening
admin/orders.html?page=custom-options -> loads or shows database warning
```

- [ ] **Step 3: Browser QA mobile**

Set a mobile viewport or use a narrow browser width. Test:

```text
index.html -> nav and hero text do not overlap
products.html -> product controls stack cleanly
custom.html -> style cards and final upload block do not overflow
```

- [ ] **Step 4: Apply fixes from QA**

If a visual issue appears, make the smallest scoped CSS/JS fix, then rerun the relevant command:

```powershell
npm run build
```

Commit fixes:

```powershell
git add public
git commit -m "Fix Soft Atelier QA issues"
```

- [ ] **Step 5: Deploy Sites**

Use existing `.openai/hosting.json` project ID. Package with the Sites helper, save a site version, deploy private production, then poll until succeeded.

Expected deployed URL:

```text
https://bomeier-products.kuocj1972.chatgpt.site
```

- [ ] **Step 6: Push GitHub source and Pages**

Run source push:

```powershell
git push github HEAD:source
```

Then split `public/` to GitHub Pages `main` with `--force-with-lease`.

Expected public URL:

```text
https://kuocj1.github.io/bomeier/index.html
```

- [ ] **Step 7: Verify public URLs**

Fetch or open:

```text
https://kuocj1.github.io/bomeier/products.html
https://kuocj1.github.io/bomeier/custom.html
```

Expected: updated Soft Atelier CSS/classes are present and pages return 200.

---

## Plan Self-Review

Spec coverage:

- Soft Atelier visual language: Task 1 and Task 2.
- Homepage first viewport and curated section: Task 2.
- Catalog and product cards: Task 2.
- Product detail page: Task 2.
- Backend-managed custom options: Task 3, Task 4, Task 5.
- Journal/about/admin polish: Task 6.
- Motion and reduced-motion: Task 1.
- Build, browser QA, Sites and GitHub deployment: Task 7.

Placeholder scan: no placeholder markers or intentionally undefined tasks remain.

Type consistency:

- Database uses `option_group`, `code`, `label`, `description`, `image_url`, `metadata`, `sort_order`, `is_active`.
- Frontend normalized option shape uses `value`, `label`, `desc`, `image`, `scene`, `wear`, `feel`, `productName`, `accent`, `colorLabel`, `emoji`.
- Existing submission keys remain `glassColor`, `metalType`, `chainLength`, and `accessoryType`, so `custom_orders` compatibility is preserved.
