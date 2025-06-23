"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "admin324") {
      localStorage.setItem("admin_login", "1");
      router.push("/admin/products");
    } else {
      setError("帳號或密碼錯誤");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow max-w-xs w-full space-y-4 border">
        <h1 className="text-2xl font-bold mb-4 text-center">後台登入</h1>
        <div>
          <label className="block mb-1">帳號</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block mb-1">密碼</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        {error && <div className="text-red-500 text-sm mb-2 text-center">{error}</div>}
        <button type="submit" className="w-full py-2 bg-black text-white rounded font-bold">登入</button>
      </form>
    </div>
  );
} 