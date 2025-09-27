// 使用範例：如何在其他頁面添加背景圖片

import PageBackground from './PageBackground';

// 範例 1: 遊戲頁面
export function GamesPageWithBackground() {
  return (
    <PageBackground 
      backgroundImage="/images/backgrounds/games-bg.jpg"
      fallbackGradient="from-blue-100 via-purple-50 to-pink-100"
    >
      {/* 您的遊戲頁面內容 */}
      <div className="container mx-auto px-4 py-8">
        <h1>遊戲頁面</h1>
        {/* 其他內容 */}
      </div>
    </PageBackground>
  );
}

// 範例 2: 購物車頁面
export function CartPageWithBackground() {
  return (
    <PageBackground 
      backgroundImage="/images/backgrounds/cart-bg.jpg"
      fallbackGradient="from-green-100 via-blue-50 to-purple-100"
    >
      {/* 您的購物車頁面內容 */}
      <div className="container mx-auto px-4 py-8">
        <h1>購物車</h1>
        {/* 其他內容 */}
      </div>
    </PageBackground>
  );
}

// 範例 3: 管理後台頁面
export function AdminPageWithBackground() {
  return (
    <PageBackground 
      backgroundImage="/images/backgrounds/admin-bg.jpg"
      fallbackGradient="from-gray-100 via-blue-50 to-indigo-100"
    >
      {/* 您的管理後台內容 */}
      <div className="container mx-auto px-4 py-8">
        <h1>管理後台</h1>
        {/* 其他內容 */}
      </div>
    </PageBackground>
  );
}
