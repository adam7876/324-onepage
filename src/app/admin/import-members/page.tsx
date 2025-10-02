"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../firebase/firestore';
import { User, getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../../../firebase/firebaseConfig';

interface ImportMember {
  name: string;
  email: string;
  phone?: string;
  status?: 'active' | 'inactive' | 'vip' | 'suspended';
}

interface ImportResult {
  success: number;
  duplicate: number;
  error: number;
  details: string[];
}

export default function ImportMembersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<ImportMember[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [existingEmails, setExistingEmails] = useState<Set<string>>(new Set());
  const router = useRouter();

  // 權限檢查
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/admin/login');
        return;
      }
      setUser(user);
      setAuthChecked(true);
      loadExistingEmails();
    });

    return () => unsubscribe();
  }, [router]);

  // 載入現有會員Email列表
  const loadExistingEmails = async () => {
    try {
      const membersRef = collection(db, 'members');
      const snapshot = await getDocs(membersRef);
      const emails = new Set<string>();
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.email) {
          emails.add(data.email.toLowerCase());
        }
      });
      
      setExistingEmails(emails);
      console.log(`已載入 ${emails.size} 個現有會員Email`);
    } catch (error) {
      console.error('載入現有會員失敗:', error);
    }
  };

  // 處理CSV文件
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      // 跳過標題行，解析CSV
      const data: ImportMember[] = lines.slice(1).map(line => {
        const [name, email, phone, status] = line.split(',').map(item => item.trim());
        return {
          name: name || '',
          email: email || '',
          phone: phone || '',
          status: (status as any) || 'active'
        };
      }).filter(member => member.name && member.email);

      setImportData(data);
      console.log(`解析到 ${data.length} 個會員資料`);
    };
    
    reader.readAsText(file);
  };

  // 執行導入
  const executeImport = async () => {
    if (importData.length === 0) return;

    setLoading(true);
    const result: ImportResult = {
      success: 0,
      duplicate: 0,
      error: 0,
      details: []
    };

    for (const member of importData) {
      try {
        const email = member.email.toLowerCase();
        
        // 檢查是否已存在
        if (existingEmails.has(email)) {
          result.duplicate++;
          result.details.push(`重複：${member.name} (${member.email})`);
          continue;
        }

        // 創建新會員
        const memberId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const memberData = {
          id: memberId,
          name: member.name,
          email: member.email,
          phone: member.phone || '',
          status: member.status || 'active',
          joinDate: new Date().toISOString(),
          gameHistory: {
            lastPlayed: null,
            totalPlays: 0
          },
          updatedAt: new Date().toISOString(),
          addedBy: user?.email || 'import',
          addedAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'members', memberId), memberData);
        
        // 更新現有Email列表
        existingEmails.add(email);
        
        result.success++;
        result.details.push(`成功：${member.name} (${member.email})`);
        
        console.log(`已導入會員：${member.name}`);
      } catch (error) {
        result.error++;
        result.details.push(`錯誤：${member.name} (${member.email}) - ${error}`);
        console.error(`導入會員失敗：${member.name}`, error);
      }
    }

    setImportResult(result);
    setLoading(false);
  };

  if (!authChecked) {
    return <div className="flex items-center justify-center min-h-screen">載入中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">會員批量導入</h1>
          <p className="text-gray-600">上傳CSV文件批量新增會員，系統會自動檢查重複</p>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📁 文件上傳</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CSV文件格式：姓名,Email,電話,狀態
              </label>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="w-full"
              />
            </div>
            
            {importData.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800">
                  已解析 {importData.length} 個會員資料
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  現有會員：{existingEmails.size} 個
                </p>
              </div>
            )}
          </div>
        </Card>

        {importData.length > 0 && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">📊 導入預覽</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {importData.slice(0, 10).map((member, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{member.name}</span>
                    <span className="text-gray-500 ml-2">({member.email})</span>
                  </div>
                  <div className="text-sm">
                    {existingEmails.has(member.email.toLowerCase()) ? (
                      <span className="text-orange-600">重複</span>
                    ) : (
                      <span className="text-green-600">新增</span>
                    )}
                  </div>
                </div>
              ))}
              {importData.length > 10 && (
                <p className="text-gray-500 text-sm">... 還有 {importData.length - 10} 個會員</p>
              )}
            </div>
          </Card>
        )}

        {importData.length > 0 && (
          <div className="flex space-x-4">
            <Button
              onClick={executeImport}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? '導入中...' : '開始導入'}
            </Button>
            <Button
              onClick={() => {
                setImportData([]);
                setImportFile(null);
                setImportResult(null);
              }}
              variant="outline"
            >
              重新選擇
            </Button>
          </div>
        )}

        {importResult && (
          <Card className="p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">📈 導入結果</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                <div className="text-sm text-green-800">成功新增</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{importResult.duplicate}</div>
                <div className="text-sm text-orange-800">重複跳過</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{importResult.error}</div>
                <div className="text-sm text-red-800">導入失敗</div>
              </div>
            </div>
            
            <div className="max-h-60 overflow-y-auto">
              <h3 className="font-semibold mb-2">詳細結果：</h3>
              {importResult.details.map((detail, index) => (
                <div key={index} className="text-sm py-1 border-b border-gray-100">
                  {detail}
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ 注意事項</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• CSV文件格式：姓名,Email,電話,狀態</li>
            <li>• 系統會自動檢查Email重複，重複的會員不會被導入</li>
            <li>• 建議分批導入，每次不超過500個會員</li>
            <li>• 導入前請確保CSV文件格式正確</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
