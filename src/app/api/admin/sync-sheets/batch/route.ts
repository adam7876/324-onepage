import { NextRequest, NextResponse } from 'next/server';
import { doc, setDoc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../../../firebase/firestore';

interface SheetsMember {
  name: string;
  email: string;
  phone?: string;
  status?: 'active' | 'inactive' | 'vip' | 'suspended';
}

function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

async function fetchAndParseMembers(sheetsUrl: string): Promise<{ lines: string[]; members: SheetsMember[] }>{
  // 轉 CSV 匯出連結
  let csvUrl = sheetsUrl.trim();
  if (csvUrl.includes('/edit')) {
    csvUrl = csvUrl.replace('?usp=sharing', '').replace('/edit', '/export?format=csv');
  } else if (!csvUrl.includes('/export')) {
    csvUrl = csvUrl + (csvUrl.includes('?') ? '&' : '?') + 'format=csv';
  }

  const response = await fetch(csvUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    cache: 'no-store'
  });
  if (!response.ok) {
    throw new Error(`下載 CSV 失敗：HTTP ${response.status}`);
  }
  const text = await response.text();
  if (text.includes('<html') || text.includes('<!DOCTYPE')) {
    throw new Error('權限不足，請確認 Google Sheets 設為「知道連結的任何人都可以檢視」');
  }

  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return { lines, members: [] };

  const result: SheetsMember[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i].trim());
    if (cols.length >= 2) {
      const name = (cols[0] || '').trim();
      const email = normalizeEmail(cols[1] || '');
      if (name && email) {
        result.push({
          name,
          email,
          phone: (cols[2] || '').trim(),
          status: ((cols[3] || 'active').trim() as 'active' | 'inactive' | 'vip' | 'suspended')
        });
      }
    }
  }
  return { lines, members: result };
}

function parseCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQ = !inQ;
    else if (ch === ',' && !inQ) { out.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  out.push(cur.trim());
  return out.map(x => x.startsWith('"') && x.endsWith('"') ? x.slice(1, -1) : x);
}

// 讀取/寫入同步游標（已處理到的 CSV 行索引）
async function getSyncMeta() {
  const metaRef = doc(db, 'gameSettings', 'syncMeta');
  const snap = await getDoc(metaRef);
  return snap.exists() ? snap.data() as { lastLineIndex?: number; totalRows?: number } : {};
}

async function setSyncMeta(update: { lastLineIndex: number; totalRows: number }) {
  const metaRef = doc(db, 'gameSettings', 'syncMeta');
  await setDoc(metaRef, { ...update, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function POST(request: NextRequest) {
  try {
    const { sheetsUrl, offset = 0, limit = 200, startRow } = await request.json();
    if (!sheetsUrl) {
      return NextResponse.json({ success: false, error: '缺少 sheetsUrl' });
    }

    const parsed = await fetchAndParseMembers(sheetsUrl);
    const lines = parsed.lines; // 含標題行
    const totalRows = Math.max(0, lines.length - 1); // 不含標題的資料列數

    // 同步游標（CSV 行索引，從 1 開始代表標題行）
    const meta = await getSyncMeta();
    const lastLineIndex = typeof meta.lastLineIndex === 'number' ? meta.lastLineIndex : 1; // 預設只處理完標題行

    // 允許前端覆寫起始資料列（1-based，指資料列，不含標題）
    const startDataRow = typeof startRow === 'number' && startRow > 0 ? startRow : undefined;
    // 對應到 CSV 行索引（含標題）：資料第1列 = 行索引2
    const startLineIndex = startDataRow ? (1 + startDataRow) : (lastLineIndex + 1);

    // 若同時也給了 offset/limit，優先以游標切片後再偏移
    const effectiveStartLine = Math.max(2, startLineIndex + Number(offset || 0));
    const effectiveEndLine = Math.min(lines.length, effectiveStartLine + (Number(limit) || 200));

    // 解析這段範圍
    const slice: SheetsMember[] = [];
    for (let i = effectiveStartLine; i < effectiveEndLine; i++) {
      const cols = parseCSVLine(lines[i].trim());
      if (cols.length >= 2) {
        const name = (cols[0] || '').trim();
        const email = normalizeEmail(cols[1] || '');
        if (name && email) {
          slice.push({
            name,
            email,
            phone: (cols[2] || '').trim(),
            status: ((cols[3] || 'active').trim() as 'active' | 'inactive' | 'vip' | 'suspended')
          });
        }
      }
    }

    let added = 0; let updated = 0;

    for (const m of slice) {
      const email = normalizeEmail(m.email);
      if (!email) continue;
      // 先以 Email 查詢既有文件（舊資料可能是隨機 id）
      const membersRef = collection(db, 'members');
      const qy = query(membersRef, where('email', '==', m.email));
      const qs = await getDocs(qy);
      if (!qs.empty) {
        const existingRef = qs.docs[0].ref;
        await setDoc(existingRef, {
          name: m.name,
          phone: m.phone || '',
          status: m.status || 'active',
          updatedAt: new Date().toISOString(),
          syncedFromSheets: true,
          syncedAt: new Date().toISOString()
        }, { merge: true });
        updated++;
      } else {
        // 若未存在，改用 emailLower 作為 docId 新增（之後就走可冪等）
        const docId = email;
        await setDoc(doc(db, 'members', docId), {
          id: docId,
          name: m.name,
          email: m.email,
          phone: m.phone || '',
          status: m.status || 'active',
          joinDate: new Date().toISOString(),
          gameHistory: { lastPlayed: null, totalPlays: 0 },
          updatedAt: new Date().toISOString(),
          addedBy: 'google-sheets-batch-sync',
          addedAt: new Date().toISOString(),
          syncedFromSheets: true,
          syncedAt: new Date().toISOString()
        }, { merge: true });
        added++;
      }
    }

    // 更新游標：此次處理到的最後 CSV 行
    const newLastLineIndex = Math.max(1, effectiveEndLine - 1);
    await setSyncMeta({ lastLineIndex: newLastLineIndex, totalRows });

    return NextResponse.json({
      success: true,
      total: totalRows,
      processed: slice.length,
      range: { startLine: effectiveStartLine, endLine: effectiveEndLine - 1 },
      added,
      updated,
      meta: { lastLineIndex: newLastLineIndex, totalRows }
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '批次同步失敗' }, { headers: { 'Cache-Control': 'no-store' } });
  }
}


