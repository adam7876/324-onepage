#!/usr/bin/env node

/**
 * Firebase 資料庫清理腳本
 * 使用方法：node scripts/cleanup-database.js
 * 
 * 這個腳本會清理：
 * 1. 過期的 email 驗證記錄
 * 2. 已使用的舊驗證記錄
 * 3. 過期的遊戲令牌
 * 4. 已使用的舊遊戲令牌
 * 5. 90天前的遊戲歷史記錄
 */

const admin = require('firebase-admin');
const path = require('path');

// 初始化 Firebase Admin SDK
// 您需要在 Firebase Console 下載服務帳戶金鑰並放在適當位置
try {
  const serviceAccount = require('../firebase-admin-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch (error) {
  console.error('❌ 請確保已下載 Firebase 服務帳戶金鑰到 firebase-admin-key.json');
  console.error('📖 設定指南：https://firebase.google.com/docs/admin/setup#add-sdk');
  process.exit(1);
}

const db = admin.firestore();

async function cleanupDatabase() {
  console.log('🧹 開始資料庫清理作業...\n');
  
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  
  let totalCleaned = 0;

  try {
    // 1. 清理過期的 email 驗證記錄
    console.log('📧 清理過期的 email 驗證記錄...');
    const expiredEmailQuery = db.collection('emailVerifications')
      .where('expiresAt', '<', admin.firestore.Timestamp.fromDate(now));
    
    const expiredEmailSnapshot = await expiredEmailQuery.get();
    const batch1 = db.batch();
    expiredEmailSnapshot.docs.forEach(doc => {
      batch1.delete(doc.ref);
    });
    if (expiredEmailSnapshot.size > 0) {
      await batch1.commit();
      console.log(`   ✅ 清理了 ${expiredEmailSnapshot.size} 筆過期驗證記錄`);
      totalCleaned += expiredEmailSnapshot.size;
    }

    // 2. 清理已使用的舊 email 驗證記錄
    console.log('📧 清理已使用的舊 email 驗證記錄...');
    const usedEmailQuery = db.collection('emailVerifications')
      .where('used', '==', true)
      .where('createdAt', '<', admin.firestore.Timestamp.fromDate(oneDayAgo));
    
    const usedEmailSnapshot = await usedEmailQuery.get();
    const batch2 = db.batch();
    usedEmailSnapshot.docs.forEach(doc => {
      batch2.delete(doc.ref);
    });
    if (usedEmailSnapshot.size > 0) {
      await batch2.commit();
      console.log(`   ✅ 清理了 ${usedEmailSnapshot.size} 筆已使用驗證記錄`);
      totalCleaned += usedEmailSnapshot.size;
    }

    // 3. 清理過期的遊戲令牌
    console.log('🎟️ 清理過期的遊戲令牌...');
    const expiredTokenQuery = db.collection('gameTokens')
      .where('expiresAt', '<', admin.firestore.Timestamp.fromDate(now));
    
    const expiredTokenSnapshot = await expiredTokenQuery.get();
    const batch3 = db.batch();
    expiredTokenSnapshot.docs.forEach(doc => {
      batch3.delete(doc.ref);
    });
    if (expiredTokenSnapshot.size > 0) {
      await batch3.commit();
      console.log(`   ✅ 清理了 ${expiredTokenSnapshot.size} 筆過期令牌`);
      totalCleaned += expiredTokenSnapshot.size;
    }

    // 4. 清理已使用的舊遊戲令牌
    console.log('🎟️ 清理已使用的舊遊戲令牌...');
    const usedTokenQuery = db.collection('gameTokens')
      .where('used', '==', true)
      .where('createdAt', '<', admin.firestore.Timestamp.fromDate(oneDayAgo));
    
    const usedTokenSnapshot = await usedTokenQuery.get();
    const batch4 = db.batch();
    usedTokenSnapshot.docs.forEach(doc => {
      batch4.delete(doc.ref);
    });
    if (usedTokenSnapshot.size > 0) {
      await batch4.commit();
      console.log(`   ✅ 清理了 ${usedTokenSnapshot.size} 筆已使用令牌`);
      totalCleaned += usedTokenSnapshot.size;
    }

    // 5. 清理90天前的遊戲歷史記錄
    console.log('📈 清理90天前的遊戲歷史記錄...');
    const oldHistoryQuery = db.collection('gameHistory')
      .where('playedAt', '<', admin.firestore.Timestamp.fromDate(ninetyDaysAgo));
    
    const oldHistorySnapshot = await oldHistoryQuery.get();
    const batch5 = db.batch();
    oldHistorySnapshot.docs.forEach(doc => {
      batch5.delete(doc.ref);
    });
    if (oldHistorySnapshot.size > 0) {
      await batch5.commit();
      console.log(`   ✅ 清理了 ${oldHistorySnapshot.size} 筆舊遊戲記錄`);
      totalCleaned += oldHistorySnapshot.size;
    }

    console.log(`\n🎉 清理完成！總共清理了 ${totalCleaned} 筆記錄`);
    
    if (totalCleaned === 0) {
      console.log('✨ 資料庫很乾淨，沒有需要清理的資料');
    }

  } catch (error) {
    console.error('❌ 清理過程中發生錯誤:', error);
  }
}

// 檢查需要清理的資料量
async function checkCleanupNeeded() {
  console.log('🔍 檢查需要清理的資料量...\n');
  
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  try {
    const expiredEmail = await db.collection('emailVerifications')
      .where('expiresAt', '<', admin.firestore.Timestamp.fromDate(now)).get();
    
    const usedEmail = await db.collection('emailVerifications')
      .where('used', '==', true)
      .where('createdAt', '<', admin.firestore.Timestamp.fromDate(oneDayAgo)).get();
    
    const expiredToken = await db.collection('gameTokens')
      .where('expiresAt', '<', admin.firestore.Timestamp.fromDate(now)).get();
    
    const usedToken = await db.collection('gameTokens')
      .where('used', '==', true)
      .where('createdAt', '<', admin.firestore.Timestamp.fromDate(oneDayAgo)).get();
    
    const oldHistory = await db.collection('gameHistory')
      .where('playedAt', '<', admin.firestore.Timestamp.fromDate(ninetyDaysAgo)).get();

    console.log('📊 待清理資料統計：');
    console.log(`   📧 過期 email 驗證：${expiredEmail.size} 筆`);
    console.log(`   📧 已使用 email 驗證：${usedEmail.size} 筆`);
    console.log(`   🎟️ 過期遊戲令牌：${expiredToken.size} 筆`);
    console.log(`   🎟️ 已使用遊戲令牌：${usedToken.size} 筆`);
    console.log(`   📈 舊遊戲歷史：${oldHistory.size} 筆`);
    
    const total = expiredEmail.size + usedEmail.size + expiredToken.size + usedToken.size + oldHistory.size;
    console.log(`   🎯 總計：${total} 筆記錄需要清理\n`);
    
    return total > 0;
  } catch (error) {
    console.error('❌ 檢查資料時發生錯誤:', error);
    return false;
  }
}

// 主程式
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--check')) {
    await checkCleanupNeeded();
  } else if (args.includes('--clean')) {
    const needCleanup = await checkCleanupNeeded();
    if (needCleanup) {
      console.log('⚠️  即將開始清理，5秒後開始...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      await cleanupDatabase();
    }
  } else {
    console.log('📖 使用方法：');
    console.log('   node scripts/cleanup-database.js --check   # 檢查需要清理的資料');
    console.log('   node scripts/cleanup-database.js --clean   # 執行清理作業');
  }
  
  process.exit(0);
}

main().catch(console.error);
