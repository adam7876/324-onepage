"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  // 判斷是否為商品詳情頁
  const isProductDetail = /^\/product\//.test(pathname);
  
  // 判斷是否為遊戲相關頁面（需要隱藏導航列）
  const isGamePage = pathname === '/games' || 
                     pathname === '/password-login' || 
                     /^\/play\//.test(pathname);

  // 處理遊戲連結點擊
  const handleGameClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // 檢查密碼驗證狀態
    const isPasswordVerified = sessionStorage.getItem('gamePasswordVerified') === 'true';
    
    if (!isPasswordVerified) {
      // 如果沒有密碼驗證，直接跳轉到密碼登入頁面
      router.push('/password-login');
    } else {
      // 如果已驗證，跳轉到遊戲頁面
      router.push('/games');
    }
  };

  // 如果是遊戲相關頁面，不顯示導航列
  if (isGamePage) {
    return null;
  }

  return (
    <nav className="w-full flex items-center justify-between py-4 px-8 border-b bg-white">
      {/* LOGO */}
      <div className="font-bold text-xl tracking-widest">324.SAMiSA</div>
      {/* 分類選單 */}
      <ul className="hidden md:flex gap-8 text-base font-medium text-black">
        {/* 主要導航 */}
        {!pathname.startsWith("/admin") && !pathname.startsWith("/play") && !pathname.startsWith("/games") && !isProductDetail && (
          <>
            <li className="hover:text-gray-500 cursor-pointer">
              <Link href="/" className={pathname === "/" ? "text-purple-600 font-semibold" : ""}>
                商品列表
              </Link>
            </li>
            <li className="hover:text-gray-500 cursor-pointer">
              <button 
                onClick={handleGameClick}
                className={`flex items-center gap-1 ${pathname === "/games" || pathname === "/password-login" ? "text-purple-600 font-semibold" : ""}`}
              >
                🎮 遊戲
              </button>
            </li>
            <li className="hover:text-gray-500 cursor-pointer">
              <Link href="/cart" className={pathname === "/cart" ? "text-purple-600 font-semibold" : ""}>
                購物車
              </Link>
            </li>
          </>
        )}
        
        {/* 管理後台連結（只在非 /admin 路徑且非商品詳情頁顯示） */}
        { !pathname.startsWith("/admin") && !pathname.startsWith("/play") && !pathname.startsWith("/games") && !isProductDetail && (
          <li className="hover:text-gray-500 cursor-pointer">
            <Link href="/admin/login">管理後台</Link>
          </li>
        )}
      </ul>
    </nav>
  );
} 