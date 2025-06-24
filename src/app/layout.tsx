import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import { CartProvider } from "../components/CartContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ONE PAGE",
  description: "一頁式時尚銷售網站",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-black`}
      >
        <CartProvider>
          <Navbar />
          <nav className="absolute top-4 right-4">
            <a href="/admin/products" className="text-sm text-blue-600 hover:underline font-bold">管理後台</a>
          </nav>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
