"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  // 判斷是否為商品詳情頁
  const isProductDetail = /^\/product\//.test(pathname);

  return (
    <nav className="w-full flex items-center justify-between py-4 px-8 border-b bg-white">
      {/* LOGO */}
      <div className="font-bold text-xl tracking-widest">324.SAMiSA</div>
      {/* 分類選單 */}
      <ul className="hidden md:flex gap-8 text-base font-medium text-black">
        {/*
        <li className="hover:text-gray-500 cursor-pointer">IN STOCK</li>
        <li className="hover:text-gray-500 cursor-pointer">BEAUTY</li>
        <li className="hover:text-gray-500 cursor-pointer">KOREA</li>
        <li className="hover:text-gray-500 cursor-pointer">TOPS</li>
        <li className="hover:text-gray-500 cursor-pointer">BOTTOMS</li>
        <li className="hover:text-gray-500 cursor-pointer">ONE PIECES</li>
        <li className="hover:text-gray-500 cursor-pointer">ACCESSORIES</li>
        <li className="hover:text-gray-500 cursor-pointer">SALE</li>
        */}
        {/* 只保留管理後台（只在非 /admin 路徑且非商品詳情頁顯示） */}
        { !pathname.startsWith("/admin") && !isProductDetail && (
          <li className="hover:text-gray-500 cursor-pointer">
            <Link href="/admin/login">管理後台</Link>
          </li>
        )}
      </ul>
    </nav>
  );
} 