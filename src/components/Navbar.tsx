import { Button } from "../components/ui/button";
import Link from "next/link";

export default function Navbar() {
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
      </ul>
      {/* 右側功能區 */}
      <div className="flex gap-4 items-center">
        {/* 搜尋 */}
        <Button variant="ghost" size="icon" className="rounded-full">
          <span className="material-symbols-outlined">search</span>
        </Button>
        {/* 會員 */}
        <Button variant="ghost" size="icon" className="rounded-full">
          <span className="material-symbols-outlined">person</span>
        </Button>
        {/* 購物車 */}
        <Button variant="ghost" size="icon" className="rounded-full" asChild>
          <Link href="/cart">
            <span className="material-symbols-outlined">shopping_bag</span>
          </Link>
        </Button>
      </div>
    </nav>
  );
} 