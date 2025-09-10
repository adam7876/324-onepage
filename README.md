This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# One Page 專案進度紀錄

## 進度符號說明
- o：已完成
- v：已驗證（可選）
- x：不做或要刪除
- [ ]：尚未完成

## 目前進度
- o Next.js + TypeScript + Tailwind CSS 初始化
- o Firebase 初始化（Auth、Firestore、Storage）
- o 專案資料夾結構規劃（components、modules、admin、utils...）
- o 商品列表（ProductList）
- o 商品詳情（支援尺寸、顏色、數量選擇，x：Firestore 讀取規格不做，將改用自建後台管理商品規格）
- o 商品詳情多圖輪播（支援滑動/箭頭切換，Swiper 導入，數字同步，UI/UX 完善）
- o 商品詳情「編號官網下單」連結（後台可設定，前台自動顯示/隱藏）
- o 商品詳情 SEO 標題、Open Graph 標題/描述動態化
- o 購物車（Cart）
- o 結帳流程（Checkout，含訂單送出，已修正首次載入無法送出訂單的 bug）
- o 後台登入/權限管理（Firebase Auth）
- o 後台商品管理（CRUD）
- o Vercel 自動部署設定
- o 程式碼型別安全、linter error 排查與修正
- o 商品詳情頁 linter error 全數消除
- [ ] 金流串接（如綠界、藍新、Line Pay）
- [ ] 訂單查詢
- [ ] 物流串接（如黑貓、7-11、全家）
- [ ] 後台訂單管理/多條件搜尋/細分
- [ ] 會員管理
- [ ] 內容管理（Banner、FAQ...）
- [ ] UI/UX 設計細節優化（如分頁點、動畫速度、RWD 微調等）

## 建議的開發步驟（模組化流程）

### 1. 專案基礎架構
- o Next.js + TypeScript + Tailwind CSS 初始化
- o Firebase 初始化（Auth、Firestore、Storage）
- o 專案資料夾結構規劃（components、modules、admin、utils...）

### 2. UI/UX 設計
- [ ] 選定 UI 套件（如 shadcn/ui、Radix UI、Tailwind UI）
- [ ] 設計首頁、商品區塊、購物車、結帳、登入、後台管理等 wireframe

### 3. 前台功能模組
- o 商品列表（ProductList）
- o 商品詳情（支援尺寸、顏色、數量選擇，x：Firestore 讀取規格不做，將改用自建後台管理商品規格）
- o 購物車（Cart）
- o 結帳流程（Checkout，含訂單送出，已修正首次載入無法送出訂單的 bug）
- [ ] 金流串接（如綠界、藍新、Line Pay）
- [ ] 訂單查詢

### 4. 後台管理模組
- o 登入/權限管理（Firebase Auth）
- o 商品管理（CRUD）
- [ ] 訂單管理
- [ ] 會員管理
- [ ] 內容管理（Banner、FAQ...）

### 5. 物流串接
- [ ] 串接物流 API（如黑貓、7-11、全家）

### 6. 部署與測試
- o 設定自動部署（Vercel）
- o 每次功能完成自動部署，直接雲端測試

---

## 重要修正紀錄
- 2025/07/07：修正首次載入無法送出訂單的問題，原因為 Firebase 初始化與資料驗證時序，現已徹底解決。
- 2025/07/08：商品詳情頁多圖輪播改用 Swiper，支援滑動/箭頭切換，數字同步，UI/UX 完善。
- 2025/07/08：商品詳情頁「官網下單」連結模組化，後台可設定，前台自動顯示。
- 2025/07/08：SEO/OG 標題描述動態化，社群分享預覽優化。
- 2025/07/08：linter error 全數修正，程式碼型別安全。

---

## 進度追蹤說明
- 每完成一個功能模組，請標記 o。
- 若已驗證可用，可標記 v。
- 若決定不做或要刪除，請標記 x。
- 若有新需求或調整，請直接補充在本文件。
- 重要架構或決策也可記錄於此，方便團隊或個人後續追蹤。

---

## 下一步建議
1. 實作購物車（Cart）功能，讓使用者可將商品加入購物車。
2. 設計結帳流程（Checkout），串接表單與 Firestore 訂單。
3. 後台管理模組與會員系統。
4. 完成前台購物流程後，再進行金流、物流串接。

---

## 專案架構
- 使用 Next.js (App Router, src/ 目錄)
- UI 框架：Tailwind CSS
- 資料夾結構：
  - src/components：前端元件
  - src/firebase：Firebase 設定與操作
  - src/utils：共用工具
  - src/app：Next.js 路由

## 下一步
- 在 src/firebase 建立 firebaseConfig.ts，填入 Firebase 專案資訊
- 串接 Firestore、Auth 等功能
- 開始實作第一個功能模組（商品列表 ProductList）

## Firebase 專案資訊
- Project ID: one-page-bec86
