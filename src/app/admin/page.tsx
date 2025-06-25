"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { app } from "@/firebase/firebaseConfig";
import { Button } from "@/components/ui/button";
import type { User } from "firebase/auth";

export default function AdminDashboard() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) router.replace("/admin/login");
      setUser(user);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, [router]);

  if (!authChecked) {
    return <div className="text-center py-24 text-lg">權限驗證中...</div>;
  }

  return (
    <section className="max-w-xl mx-auto px-4 py-16">
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <h1 className="text-2xl font-bold mb-4 tracking-widest">後台主控台</h1>
        <div className="mb-4 text-gray-600">{user?.email}，歡迎登入！</div>
        <div className="flex flex-col gap-4 mb-8">
          <Button className="w-full" onClick={() => router.push("/admin/products")}>商品管理</Button>
          <Button className="w-full" onClick={() => router.push("/admin/orders")}>訂單管理</Button>
        </div>
        <Button variant="outline" className="w-full" onClick={async () => { await signOut(getAuth(app)); router.replace("/admin/login"); }}>登出</Button>
      </div>
    </section>
  );
} 