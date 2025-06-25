"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="w-full flex items-center justify-between py-4 px-8 border-b bg-white">
      {/* LOGO */}
      <div className="font-bold text-xl tracking-widest">ONE PAGE</div>
      {/* 分類選單 */}
      <ul className="hidden md:flex gap-8 text-base font-medium text-black">
        <li className="hover:text-gray-500 cursor-pointer">IN STOCK</li>
        <li className="hover:text-gray-500 cursor-pointer">BEAUTY</li>
        <li className="hover:text-gray-500 cursor-pointer">KOREA</li>
        <li className="hover:text-gray-500 cursor-pointer">TOPS</li>
        <li className="hover:text-gray-500 cursor-pointer">BOTTOMS</li>
        <li className="hover:text-gray-500 cursor-pointer">ONE PIECES</li>
        <li className="hover:text-gray-500 cursor-pointer">ACCESSORIES</li>
        <li className="hover:text-gray-500 cursor-pointer">SALE</li>
        {/* 管理後台（只在非 /admin 路徑顯示，且符合目前風格） */}
        { !pathname.startsWith("/admin") && (
          <li className="hover:text-gray-500 cursor-pointer">
            <Link href="/admin">管理後台</Link>
          </li>
        )}
      </ul>
    </nav>
  );
} 