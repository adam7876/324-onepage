"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/firestore';
import { User, getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../../../firebase/firebaseConfig';

interface Member {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'vip' | 'suspended';
  joinDate: string;
  gameHistory: {
    lastPlayed: string | null;
    totalPlays: number;
  };
  updatedAt: string;
  addedBy?: string;
  addedAt?: string;
}

export default function MembersPage() {
  const [, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '' });
  const [addingMember, setAddingMember] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [updatingMember, setUpdatingMember] = useState<string | null>(null);
  const [syncingFromSheets, setSyncingFromSheets] = useState(false);
  const [sheetsUrl, setSheetsUrl] = useState('https://docs.google.com/spreadsheets/d/1lDbJBg8UDCJdN8TfX9-O07Bw5bsNjER2gBxol2re-4k/edit?usp=sharing');
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
    });

    return () => unsubscribe();
  }, [router]);

  // 載入會員列表
  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const membersSnapshot = await getDocs(collection(db, 'members'));
      const membersList: Member[] = [];
      
      membersSnapshot.docs.forEach(doc => {
        membersList.push({
          id: doc.id,
          ...doc.data()
        } as Member);
      });
      
      // 按加入日期排序
      membersList.sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime());
      
      setMembers(membersList);
    } catch (error) {
      console.error('載入會員失敗:', error);
      setMessage('載入會員失敗');
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (authChecked) {
      loadMembers();
    }
  }, [authChecked]);

  // 新增會員
  const addMember = async () => {
    if (!newMember.name.trim() || !newMember.email.trim()) {
      setMessage('請填寫完整資訊');
      return;
    }

    setAddingMember(true);
    try {
      const normalizedEmail = newMember.email.toLowerCase().trim();
      const docId = normalizedEmail.replace(/[.@]/g, '_');
      
      // 檢查是否已存在
      const existingDoc = await getDoc(doc(db, 'members', docId));
      
      if (existingDoc.exists()) {
        setMessage('此 Email 已存在');
        setAddingMember(false);
        return;
      }
      
      // 新增會員資料
      const memberData: Omit<Member, 'id'> = {
        name: newMember.name.trim(),
        email: normalizedEmail,
        status: 'active',
        joinDate: new Date().toISOString().split('T')[0],
        gameHistory: {
          lastPlayed: null,
          totalPlays: 0
        },
        updatedAt: new Date().toISOString(),
        addedBy: 'admin',
        addedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'members', docId), memberData);
      
      setMessage(`成功新增會員: ${memberData.name}`);
      setNewMember({ name: '', email: '' });
      
      // 重新載入會員列表
      await loadMembers();
      
    } catch (error) {
      console.error('新增會員失敗:', error);
      setMessage('新增會員失敗');
    } finally {
      setAddingMember(false);
    }
  };

  // 更新會員狀態
  const updateMemberStatus = async (memberId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    setUpdatingMember(memberId);
    try {
      const memberRef = doc(db, 'members', memberId);
      await setDoc(memberRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setMessage(`會員狀態已更新為: ${newStatus === 'active' ? '啟用' : newStatus === 'inactive' ? '停用' : '暫停'}`);
      
      // 重新載入會員列表
      await loadMembers();
      
    } catch (error) {
      console.error('更新會員狀態失敗:', error);
      setMessage('更新會員狀態失敗');
    } finally {
      setUpdatingMember(null);
    }
  };

  // 測試 Google Sheets 網址
  const testSheetsUrl = async () => {
    try {
      setMessage('正在測試網址...');
      
      // 處理網址格式
      let testUrl = sheetsUrl.trim();
      if (testUrl.includes('/edit')) {
        testUrl = testUrl.replace('?usp=sharing', '').replace('/edit', '/export?format=csv');
      }
      
      console.log('🧪 測試網址:', testUrl);
      const response = await fetch(testUrl);
      
      if (response.ok) {
        const text = await response.text();
        if (text.includes('<html') || text.includes('<!DOCTYPE')) {
          setMessage('❌ 網址無法訪問，請確認 Google Sheets 權限設定為「知道連結的任何人都可以檢視」');
        } else {
          setMessage('✅ 網址測試成功，可以進行同步');
        }
      } else {
        setMessage(`❌ 網址測試失敗：HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('測試失敗:', error);
      setMessage('❌ 網址測試失敗，請檢查網址格式');
    }
  };

  // 從 Google Sheets 同步數據
  const syncFromGoogleSheets = async () => {
    if (!sheetsUrl.trim()) {
      setMessage('請輸入 Google Sheets 網址');
      return;
    }

    setSyncingFromSheets(true);
    try {
      const response = await fetch('/api/admin/sync-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sheetsUrl: sheetsUrl.trim() }),
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage(`同步成功！新增 ${result.added} 個會員，更新 ${result.updated} 個會員`);
        loadMembers(); // 重新載入會員列表
      } else {
        setMessage(`同步失敗：${result.error}`);
      }
    } catch (error) {
      console.error('同步失敗:', error);
      setMessage('同步失敗，請檢查網址是否正確');
    } finally {
      setSyncingFromSheets(false);
    }
  };

  // 搜尋會員
  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!authChecked) {
    return <div className="text-center py-24 text-lg">權限驗證中...</div>;
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">👥 會員管理</h1>
          <Button variant="outline" onClick={() => router.back()}>
            返回
          </Button>
        </div>

        {/* 新增會員 */}
        <Card className="p-6 mb-8 bg-green-50 border-green-200">
          <h2 className="text-xl font-bold mb-4 text-green-800">➕ 新增會員</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Input
              placeholder="會員姓名"
              value={newMember.name}
              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
            />
            <Input
              placeholder="Email 地址"
              type="email"
              value={newMember.email}
              onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
            />
            <Button 
              onClick={addMember} 
              disabled={addingMember}
              className="bg-green-600 hover:bg-green-700"
            >
              {addingMember ? '新增中...' : '新增會員'}
            </Button>
          </div>
        </Card>

        {/* Google Sheets 同步 */}
        <Card className="p-6 mb-8 bg-blue-50 border-blue-200">
          <h2 className="text-xl font-bold mb-4 text-blue-800">📊 Google Sheets 同步</h2>
          <div className="space-y-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>已設定 Google Sheets 網址：</strong><br/>
                <span className="text-xs break-all">{sheetsUrl}</span>
              </p>
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={testSheetsUrl}
                disabled={syncingFromSheets}
                className="bg-green-600 hover:bg-green-700"
              >
                🧪 測試網址
              </Button>
              <Button
                onClick={syncFromGoogleSheets}
                disabled={syncingFromSheets}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {syncingFromSheets ? '同步中...' : '🔄 同步數據'}
              </Button>
            </div>
            <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded-lg">
              <strong>📋 同步說明：</strong>
              <ul className="mt-2 space-y-1">
                <li>• 已預設您的 Google Sheets 網址</li>
                <li>• 系統會根據 Email 比對，避免重複新增</li>
                <li>• 新會員會自動新增，現有會員會更新資料</li>
                <li>• 建議先備份現有數據再進行同步</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* 訊息顯示 */}
        {message && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
            {message}
          </div>
        )}

        {/* 搜尋 */}
        <div className="mb-6">
          <Input
            placeholder="搜尋會員姓名或 Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* 會員統計 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{members.length}</div>
            <div className="text-sm text-gray-600">總會員數</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {members.filter(m => m.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">啟用會員</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {members.filter(m => m.gameHistory.totalPlays > 0).length}
            </div>
            <div className="text-sm text-gray-600">已玩過遊戲</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {members.filter(m => {
                if (!m.gameHistory.lastPlayed) return false;
                
                // 處理不同類型的 lastPlayed
                let lastPlayed: Date;
                if (typeof m.gameHistory.lastPlayed === 'string') {
                  lastPlayed = new Date(m.gameHistory.lastPlayed);
                } else if (m.gameHistory.lastPlayed && typeof m.gameHistory.lastPlayed === 'object' && 'toDate' in m.gameHistory.lastPlayed) {
                  lastPlayed = (m.gameHistory.lastPlayed as { toDate: () => Date }).toDate();
                } else {
                  return false;
                }
                
                const today = new Date();
                
                // 檢查是否為今天（台灣時區）
                const taiwanOffset = 8 * 60; // 台灣時區偏移（分鐘）
                const lastPlayedTaiwan = new Date(lastPlayed.getTime() + taiwanOffset * 60 * 1000);
                const todayTaiwan = new Date(today.getTime() + taiwanOffset * 60 * 1000);
                
                return lastPlayedTaiwan.getUTCDate() === todayTaiwan.getUTCDate() &&
                       lastPlayedTaiwan.getUTCMonth() === todayTaiwan.getUTCMonth() &&
                       lastPlayedTaiwan.getUTCFullYear() === todayTaiwan.getUTCFullYear();
              }).length}
            </div>
            <div className="text-sm text-gray-600">今日已玩</div>
          </Card>
        </div>

        {/* 會員列表 */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">📋 會員列表</h2>
          
          {loadingMembers ? (
            <div className="text-center py-8">載入中...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">姓名</th>
                    <th className="text-left py-2">Email</th>
                    <th className="text-left py-2">狀態</th>
                    <th className="text-left py-2">加入日期</th>
                    <th className="text-left py-2">遊戲次數</th>
                    <th className="text-left py-2">最後遊戲</th>
                    <th className="text-left py-2">新增方式</th>
                    <th className="text-left py-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="border-b hover:bg-gray-50">
                      <td className="py-2">{member.name}</td>
                      <td className="py-2">{member.email}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          member.status === 'active' ? 'bg-green-100 text-green-800' :
                          member.status === 'vip' ? 'bg-purple-100 text-purple-800' :
                          member.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {member.status === 'active' ? '啟用' :
                           member.status === 'vip' ? 'VIP' :
                           member.status === 'inactive' ? '停用' : '暫停'}
                        </span>
                      </td>
                      <td className="py-2">{member.joinDate}</td>
                      <td className="py-2">{member.gameHistory.totalPlays}</td>
                      <td className="py-2">
                        {member.gameHistory.lastPlayed ? 
                          (() => {
                            try {
                              let lastPlayed: Date;
                              if (typeof member.gameHistory.lastPlayed === 'string') {
                                lastPlayed = new Date(member.gameHistory.lastPlayed);
                              } else if (member.gameHistory.lastPlayed && typeof member.gameHistory.lastPlayed === 'object' && 'toDate' in member.gameHistory.lastPlayed) {
                                lastPlayed = (member.gameHistory.lastPlayed as { toDate: () => Date }).toDate();
                              } else {
                                return '格式錯誤';
                              }
                              return lastPlayed.toLocaleDateString('zh-TW');
                            } catch {
                              return '日期錯誤';
                            }
                          })() : 
                          '未玩過'
                        }
                      </td>
                      <td className="py-2">
                        {member.addedBy === 'manual' ? '手動新增' : 
                         member.addedBy === 'admin' ? '管理員新增' : '匯入'}
                      </td>
                      <td className="py-2">
                        <div className="flex gap-1">
                          {member.status !== 'active' && (
                            <button
                              onClick={() => updateMemberStatus(member.id, 'active')}
                              disabled={updatingMember === member.id}
                              className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs hover:bg-green-200 disabled:opacity-50"
                            >
                              {updatingMember === member.id ? '更新中...' : '啟用'}
                            </button>
                          )}
                          {member.status !== 'inactive' && (
                            <button
                              onClick={() => updateMemberStatus(member.id, 'inactive')}
                              disabled={updatingMember === member.id}
                              className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs hover:bg-gray-200 disabled:opacity-50"
                            >
                              {updatingMember === member.id ? '更新中...' : '停用'}
                            </button>
                          )}
                          {member.status !== 'suspended' && (
                            <button
                              onClick={() => updateMemberStatus(member.id, 'suspended')}
                              disabled={updatingMember === member.id}
                              className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs hover:bg-red-200 disabled:opacity-50"
                            >
                              {updatingMember === member.id ? '更新中...' : '暫停'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredMembers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? '找不到符合條件的會員' : '沒有會員資料'}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
