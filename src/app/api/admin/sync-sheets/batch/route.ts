import { NextRequest, NextResponse } from 'next/server';
import { doc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
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

async function fetchAndParseMembers(sheetsUrl: string): Promise<SheetsMember[]> {
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
  if (lines.length < 2) return [];

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
  return result;
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

async function getExistingEmailsSet(): Promise<Set<string>> {
  const ref = collection(db, 'members');
  const snap = await getDocs(ref);
  const set = new Set<string>();
  snap.forEach(d => { const e = d.data().email; if (e) set.add(normalizeEmail(e)); });
  return set;
}

export async function POST(request: NextRequest) {
  try {
    const { sheetsUrl, offset = 0, limit = 200 } = await request.json();
    if (!sheetsUrl) {
      return NextResponse.json({ success: false, error: '缺少 sheetsUrl' });
    }

    const allMembers = await fetchAndParseMembers(sheetsUrl);
    const total = allMembers.length;
    const start = Math.max(0, Number(offset) || 0);
    const end = Math.min(total, start + (Number(limit) || 200));
    const slice = allMembers.slice(start, end);

    const existing = await getExistingEmailsSet();
    let added = 0; let updated = 0;

    for (const m of slice) {
      const email = normalizeEmail(m.email);
      if (!email) continue;
      if (existing.has(email)) {
        const membersRef = collection(db, 'members');
        const qy = query(membersRef, where('email', '==', m.email));
        const qs = await getDocs(qy);
        if (!qs.empty) {
          const ex = qs.docs[0];
          await setDoc(ex.ref, {
            name: m.name,
            phone: m.phone || '',
            status: m.status || 'active',
            updatedAt: new Date().toISOString(),
            syncedFromSheets: true,
            syncedAt: new Date().toISOString()
          }, { merge: true });
          updated++;
        }
      } else {
        const memberId = `member_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
        await setDoc(doc(db, 'members', memberId), {
          id: memberId,
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
        });
        existing.add(email);
        added++;
      }
    }

    return NextResponse.json({
      success: true,
      total,
      processed: slice.length,
      range: { start, end: end - 1 },
      added,
      updated
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '批次同步失敗' }, { headers: { 'Cache-Control': 'no-store' } });
  }
}


