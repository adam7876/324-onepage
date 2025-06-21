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

## 目前進度
- 已完成 Next.js + TypeScript + Tailwind CSS 專案初始化
- 已安裝 Firebase SDK
- 已建立 src/components、src/firebase、src/utils 資料夾
- 專案已正確串接 Firebase（待填入 firebaseConfig.ts）

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
