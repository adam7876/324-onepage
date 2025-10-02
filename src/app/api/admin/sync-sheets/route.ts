import { NextRequest, NextResponse } from 'next/server';
import { doc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../../firebase/firestore';

interface SheetsMember {
  name: string;
  email: string;
  phone?: string;
  status?: 'active' | 'inactive' | 'vip' | 'suspended';
}

interface SyncResult {
  success: boolean;
  added: number;
  updated: number;
  error?: string;
  details: string[];
}

// 從 Google Sheets 獲取數據
async function fetchGoogleSheetsData(sheetsUrl: string): Promise<SheetsMember[]> {
  try {
    // 處理不同的 Google Sheets 網址格式
    let csvUrl = sheetsUrl;
    
    // 如果是編輯模式，轉換為導出模式
    if (sheetsUrl.includes('/edit')) {
      // 移除 ?usp=sharing 參數
      csvUrl = sheetsUrl.replace('?usp=sharing', '').replace('/edit', '/export?format=csv');
    } else if (sheetsUrl.includes('/edit#gid=')) {
      // 處理帶有 gid 的網址
      const gidMatch = sheetsUrl.match(/\/edit#gid=(\d+)/);
      if (gidMatch) {
        const gid = gidMatch[1];
        csvUrl = sheetsUrl.replace('/edit#gid=' + gid, `/export?format=csv&gid=${gid}`);
      } else {
        csvUrl = sheetsUrl.replace('/edit', '/export?format=csv');
      }
    } else if (!sheetsUrl.includes('/export')) {
      // 如果沒有 export 參數，添加
      csvUrl = sheetsUrl + (sheetsUrl.includes('?') ? '&' : '?') + 'format=csv';
    }
    
    console.log('📊 原始網址:', sheetsUrl);
    console.log('📊 轉換後網址:', csvUrl);
    
    const response = await fetch(csvUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.error('❌ HTTP 錯誤:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    
    const csvText = await response.text();
    console.log('📄 CSV 數據長度:', csvText.length);
    console.log('📄 CSV 前100字符:', csvText.substring(0, 100));
    
    // 檢查是否為 HTML 錯誤頁面
    if (csvText.includes('<html') || csvText.includes('<!DOCTYPE')) {
      console.error('❌ 收到 HTML 響應，可能是權限問題');
      throw new Error('無法訪問 Google Sheets，請確認權限設定為「知道連結的任何人都可以檢視」');
    }
    
    // 解析 CSV 數據
    const lines = csvText.split('\n').filter(line => line.trim());
    console.log('📊 解析到行數:', lines.length);
    
    if (lines.length < 2) {
      throw new Error('CSV 數據不足，至少需要標題行和一行數據');
    }
    
    // 跳過標題行，解析數據
    const members: SheetsMember[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // 解析 CSV 行（處理逗號分隔和引號）
      const columns = parseCSVLine(line);
      console.log(`📊 解析第 ${i} 行:`, columns);
      
      if (columns.length >= 2) {
        const member: SheetsMember = {
          name: columns[0]?.trim() || '',
          email: columns[1]?.trim() || '',
          phone: columns[2]?.trim() || '', // 電話欄位可選
          status: (columns[3]?.trim() as 'active' | 'inactive' | 'vip' | 'suspended') || 'active' // 狀態欄位可選
        };
        
        if (member.name && member.email) {
          members.push(member);
          console.log(`✅ 解析會員: ${member.name} (${member.email})`);
        } else {
          console.log(`⚠️ 跳過無效行: 姓名=${member.name}, Email=${member.email}`);
        }
      } else {
        console.log(`⚠️ 跳過欄位不足的行: ${line}`);
      }
    }
    
    console.log(`✅ 成功解析 ${members.length} 個會員數據`);
    return members;
  } catch (error) {
    console.error('❌ 獲取 Google Sheets 數據失敗:', error);
    throw error;
  }
}

// 解析 CSV 行（處理引號和逗號）
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  
  // 清理引號
  return result.map(item => {
    if (item.startsWith('"') && item.endsWith('"')) {
      return item.slice(1, -1);
    }
    return item;
  });
}

// 獲取現有會員 Email 列表
async function getExistingEmails(): Promise<Set<string>> {
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
    
    console.log(`📧 載入 ${emails.size} 個現有會員 Email`);
    return emails;
  } catch (error) {
    console.error('❌ 載入現有會員失敗:', error);
    return new Set();
  }
}

// 同步會員數據
async function syncMembers(sheetsMembers: SheetsMember[]): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    added: 0,
    updated: 0,
    details: []
  };
  
  try {
    const existingEmails = await getExistingEmails();
    
    for (const member of sheetsMembers) {
      try {
        const email = member.email.toLowerCase();
        const memberId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        if (existingEmails.has(email)) {
          // 更新現有會員
          const membersRef = collection(db, 'members');
          const q = query(membersRef, where('email', '==', member.email));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const existingDoc = querySnapshot.docs[0];
            await setDoc(existingDoc.ref, {
              name: member.name,
              phone: member.phone || '',
              status: member.status || 'active',
              updatedAt: new Date().toISOString(),
              syncedFromSheets: true,
              syncedAt: new Date().toISOString()
            }, { merge: true });
            
            result.updated++;
            result.details.push(`更新：${member.name} (${member.email})`);
            console.log(`🔄 更新會員：${member.name}`);
          }
        } else {
          // 新增新會員
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
            addedBy: 'google-sheets-sync',
            addedAt: new Date().toISOString(),
            syncedFromSheets: true,
            syncedAt: new Date().toISOString()
          };
          
          await setDoc(doc(db, 'members', memberId), memberData);
          
          // 更新現有 Email 列表
          existingEmails.add(email);
          
          result.added++;
          result.details.push(`新增：${member.name} (${member.email})`);
          console.log(`➕ 新增會員：${member.name}`);
        }
      } catch (error) {
        console.error(`❌ 處理會員失敗：${member.name}`, error);
        result.details.push(`錯誤：${member.name} (${member.email}) - ${error}`);
      }
    }
    
    console.log(`✅ 同步完成：新增 ${result.added} 個，更新 ${result.updated} 個`);
  } catch (error) {
    console.error('❌ 同步過程失敗:', error);
    result.success = false;
    result.error = error instanceof Error ? error.message : '未知錯誤';
  }
  
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const { sheetsUrl } = await request.json();
    
    if (!sheetsUrl) {
      return NextResponse.json({
        success: false,
        error: '請提供 Google Sheets 網址'
      });
    }
    
    console.log('🔄 開始同步 Google Sheets 數據...');
    console.log('📊 輸入網址:', sheetsUrl);
    
    // 獲取 Google Sheets 數據
    const sheetsMembers = await fetchGoogleSheetsData(sheetsUrl);
    
    if (sheetsMembers.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Google Sheets 中沒有找到有效的會員數據'
      });
    }
    
    // 同步會員數據
    const syncResult = await syncMembers(sheetsMembers);
    
    return NextResponse.json({
      success: syncResult.success,
      added: syncResult.added,
      updated: syncResult.updated,
      error: syncResult.error,
      details: syncResult.details.slice(0, 10) // 只返回前10個詳細記錄
    });
    
  } catch (error) {
    console.error('❌ Google Sheets 同步失敗:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '同步失敗'
    });
  }
}
