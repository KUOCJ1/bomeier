# 鉑魅兒（Bo Mei Er）官方網站

手作琉璃配飾選物品牌官方網站 — 靜態 HTML 版本。

## 目錄結構

```
website/
  index.html           # 首頁
  products.html        # 全部商品（含風格篩選器）
  product.html         # 商品詳情 (?sku=SKU_CODE 動態載入)
  about.html           # 關於鉑魅兒
  journal.html         # 誌（部落格）
  404.html             # 自訂 404 頁面
  README.md            # 本文件
  css/style.css        # 完整品牌設計系統 CSS
  js/
    main.js            # 導航、動畫、共用功能
    products.js        # 商品資料載入與渲染
  data/
    products.json      # 商品資料庫（20 款 SKU）
  images/
    products/          # 商品圖片（placeholder 3 張待替換）
    brand/             # 品牌圖片（Logo 等待補）
```

## GitHub Pages 部署步驟

### 方案 A：新開一個 repo

1. 在 GitHub 建立新 repo，名稱建議為 bomeier 或 bomeier-website
2. 將 website 資料夾內所有檔案 push 到該 repo 的根目錄
3. 到 repo Settings -> Pages，選擇 Deploy from a branch: main -> / (root)
4. 完成後網址為：https://你的帳號.github.io/bomeier/

### 方案 B：使用者網站 (username.github.io)

1. 如你有 帳號.github.io 的 repo
2. 在該 repo 建立 bomeier 子目錄，將所有檔案放入
3. 網址為：https://你的帳號.github.io/bomeier/

### 方案 C：自訂網域

1. 購買的 domain（如 bomeier.com）指向 GitHub Pages
2. 在 repo Settings -> Pages 填入自訂網域
3. 在 domain 的 DNS 設定中新增 CNAME 記錄指向 你的帳號.github.io

## 日常維護

### 新增商品

1. 開啟 data/products.json
2. 在 products 陣列中新增一筆物件（可複製現有條目修改）
3. 將商品圖片放到 images/products/ 資料夾
4. push 到 GitHub 即可自動更新

### 修改商品

直接編輯 data/products.json 中對應的 SKU 條目即可。

### 每週更新流程（10 個新品/週）

1. 拍攝新商品 5 張照片（依拍攝指南規範）
2. 照片去背處理後放入 images/products/
3. 在 products.json 新增 10 筆商品資料
4. 將 status 設為「上架」
5. push 到 GitHub，網站自動更新

## 第二階段規劃

- 正式 Logo 設計與上線
- 商品圖片全部補齊（替換 placeholder）
- 線上結帳功能（金流串接）
- IG Shopping 整合
- Journal 文章陸續上線