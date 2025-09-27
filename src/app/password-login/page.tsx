"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { verifyPassword } from '../../lib/password-service';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';

export default function PasswordLoginPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('請輸入密碼');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const isValid = await verifyPassword(password);
      if (isValid) {
        // 密碼正確，儲存到 sessionStorage 並跳轉
        sessionStorage.setItem('gamePasswordVerified', 'true');
        router.push('/games');
      } else {
        setError('正確密碼才能入園遊玩');
      }
    } catch (error) {
      console.error('密碼驗證失敗:', error);
      setError('系統錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: 'url(/images/backgrounds/password-login-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* 背景裝飾 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 text-6xl">🎠</div>
        <div className="absolute top-40 right-20 text-5xl">🎡</div>
        <div className="absolute bottom-32 left-1/4 text-4xl">🎪</div>
        <div className="absolute bottom-20 right-1/3 text-5xl">🎯</div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-8xl">🎪</div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* 標題 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              324遊樂園
            </h1>
            <p className="text-lg text-gray-600">
              請輸入密碼進入遊樂園
            </p>
          </div>

          {/* 密碼輸入表單 */}
          <Card className="p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  遊樂園密碼
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="請輸入密碼"
                  className="w-full"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                disabled={loading}
              >
                {loading ? '驗證中...' : '進入遊樂園'}
              </Button>
            </form>
          </Card>

        </div>
      </div>
    </div>
  );
}
