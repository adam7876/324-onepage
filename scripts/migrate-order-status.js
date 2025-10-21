/**
 * 訂單狀態遷移腳本
 * 將「待匯款」狀態統一為「待付款」
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc, doc } = require('firebase/firestore');

// Firebase 配置
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

async function migrateOrderStatus() {
  try {
    console.log('🚀 開始訂單狀態遷移...');
    
    // 初始化 Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // 查詢所有「待匯款」的訂單
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('status', '==', '待匯款'));
    const querySnapshot = await getDocs(q);
    
    console.log(`📊 找到 ${querySnapshot.size} 筆「待匯款」訂單`);
    
    if (querySnapshot.size === 0) {
      console.log('✅ 沒有需要遷移的訂單');
      return;
    }
    
    // 批量更新訂單狀態
    const updatePromises = [];
    querySnapshot.forEach((orderDoc) => {
      console.log(`🔄 更新訂單 ${orderDoc.id}: 待匯款 → 待付款`);
      updatePromises.push(
        updateDoc(doc(db, 'orders', orderDoc.id), {
          status: '待付款'
        })
      );
    });
    
    await Promise.all(updatePromises);
    
    console.log('✅ 訂單狀態遷移完成！');
    console.log(`📊 成功更新 ${querySnapshot.size} 筆訂單`);
    
  } catch (error) {
    console.error('❌ 遷移失敗:', error);
    process.exit(1);
  }
}

// 執行遷移
migrateOrderStatus();
