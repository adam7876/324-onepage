import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../../../firebase/firestore';

type Member = {
  id?: string;
  name?: string;
  email: string;
  phone?: string;
  status?: 'active' | 'inactive' | 'vip' | 'suspended';
  joinDate?: string;
  updatedAt?: string;
  gameHistory?: { lastPlayed?: any; totalPlays?: number };
  [key: string]: any;
};

function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

function toDate(value: any): Date | null {
  try {
    if (!value) return null;
    if (typeof value === 'string') return new Date(value);
    if (typeof value.toDate === 'function') return value.toDate();
    return null;
  } catch {
    return null;
  }
}

export async function POST(_req: NextRequest) {
  try {
    const snap = await getDocs(collection(db, 'members'));
    const groups = new Map<string, Array<{ id: string; data: Member }>>();

    snap.forEach((d) => {
      const data = d.data() as Member;
      const email = normalizeEmail(data.email || '');
      if (!email) return;
      const arr = groups.get(email) || [];
      arr.push({ id: d.id, data });
      groups.set(email, arr);
    });

    let checked = 0;
    let merged = 0;
    let removed = 0;

    for (const [email, docs] of groups.entries()) {
      checked += docs.length;
      if (docs.length === 1) continue;

      // 合併策略：
      // - name/phone/status 取「較新的 updatedAt」或第一個非空
      // - joinDate 取最早
      // - gameHistory.totalPlays 相加；lastPlayed 取最大
      let latest: { id: string; data: Member } | null = null;
      let oldestJoin: Date | null = null;
      let oldestJoinStr: string | undefined = undefined;
      let totalPlays = 0;
      let lastPlayed: Date | null = null;

      for (const item of docs) {
        const ua = toDate(item.data.updatedAt);
        if (!latest || (ua && toDate(latest.data.updatedAt) && ua > toDate(latest.data.updatedAt)!)) {
          latest = item;
        }
        const jd = toDate(item.data.joinDate);
        if (!oldestJoin || (jd && oldestJoin && jd < oldestJoin) || (!oldestJoin && jd)) {
          oldestJoin = jd;
          oldestJoinStr = item.data.joinDate;
        }
        const gh = item.data.gameHistory || {};
        totalPlays += Number(gh.totalPlays || 0);
        const lp = toDate(gh.lastPlayed);
        if (!lastPlayed || (lp && lastPlayed && lp > lastPlayed)) lastPlayed = lp;
      }

      const canonicalId = email; // 規範：以 emailLower 當 docId
      const canonical = docs.find((d) => d.id === canonicalId) || latest || docs[0];

      const mergedData: Member = {
        id: canonicalId,
        email,
        name: canonical.data.name,
        phone: canonical.data.phone || '',
        status: canonical.data.status || 'active',
        joinDate: oldestJoinStr || canonical.data.joinDate,
        updatedAt: new Date().toISOString(),
        gameHistory: {
          totalPlays,
          lastPlayed: lastPlayed ? lastPlayed.toISOString() : (canonical.data.gameHistory?.lastPlayed || null)
        },
        syncedFromSheets: true,
        mergedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'members', canonicalId), mergedData, { merge: true });
      merged++;

      // 刪除其他重複文件
      for (const item of docs) {
        if (item.id === canonicalId) continue;
        await deleteDoc(doc(db, 'members', item.id));
        removed++;
      }
    }

    return NextResponse.json({ success: true, checked, merged, removed });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '清理失敗' });
  }
}


