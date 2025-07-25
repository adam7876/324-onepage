"use client";
import { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "@/firebase/firebaseConfig"; // 你的 firebase 初始化
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const auth = getAuth(app);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("登入成功！");
      router.push("/admin");
    } catch (err) {
      setError("登入失敗：" + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow max-w-xs w-full space-y-4 border">
        <h1 className="text-2xl font-bold mb-4 text-center">後台登入</h1>
        <div>
          <label className="block mb-1">Email</label>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block mb-1">密碼</label>
          <input
            type="password"
            placeholder="密碼"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        {error && <div className="text-red-500 text-sm mb-2 text-center">{error}</div>}
        <button type="submit" className="w-full py-2 bg-black text-white rounded font-bold">登入</button>
        <Link href="/" className="block w-full mt-2 py-2 text-center rounded bg-gray-100 text-black font-bold hover:bg-gray-200">回首頁</Link>
      </form>
    </div>
  );
} 