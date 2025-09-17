# 🧹 資料庫維護指南

## 📊 Firebase 資料結構與清理需求

### 🗂️ 集合說明

| 集合名稱 | 內容 | 清理需求 | 保留期間 |
|---------|------|---------|----------|
| `emailVerifications` | Email 驗證碼 | ⚠️ 高優先級 | 過期後/使用後24小時 |
| `gameTokens` | 遊戲訪問令牌 | ⚠️ 高優先級 | 過期後/使用後24小時 |
| `gameHistory` | 遊戲歷史記錄 | 🟡 中優先級 | 90天 |
| `gameConfig` | 遊戲配置 | ✅ 無需清理 | 永久保留 |

### 📈 資料增長模式

- **每次發送驗證碼** → +1 `emailVerifications` 記錄
- **每次開始遊戲** → +1 `gameTokens` 記錄  
- **每次完成遊戲** → +1 `gameHistory` 記錄

**假設每日100位用戶遊戲：**
- 每日新增：~300筆記錄
- 每月累積：~9,000筆記錄
- 每年累積：~109,000筆記錄

## 🛠️ 清理方案

### 方案一：網頁管理介面（推薦）

1. **進入管理後台**
   ```
   https://your-domain.vercel.app/admin/maintenance
   ```

2. **檢查資料量**
   - 點擊「🔍 檢查資料量」
   - 查看各類型待清理資料數量

3. **執行清理**
   - 點擊「🧹 執行清理」
   - 確認清理操作

### 方案二：命令行腳本

1. **安裝依賴**
   ```bash
   npm install firebase-admin
   ```

2. **設定服務帳戶**
   - 在 Firebase Console 下載服務帳戶金鑰
   - 重命名為 `firebase-admin-key.json`
   - 放在專案根目錄

3. **執行腳本**
   ```bash
   # 檢查需要清理的資料
   node scripts/cleanup-database.js --check
   
   # 執行清理
   node scripts/cleanup-database.js --clean
   ```

### 方案三：Firebase Functions（未來考慮）

可設定定期自動執行的雲函數：

```javascript
// 每天凌晨2點自動清理
exports.scheduledCleanup = functions.pubsub
  .schedule('0 2 * * *')
  .onRun(cleanupDatabase);
```

## 📅 建議維護頻率

### 🔄 定期維護

| 使用量級別 | 建議頻率 | 說明 |
|-----------|---------|------|
| 低（<50/天） | 每月1次 | 資料增長緩慢 |
| 中（50-200/天） | 每週1次 | 保持資料庫效能 |
| 高（>200/天） | 每3天1次 | 防止資料累積過多 |

### 🚨 緊急清理時機

- Firebase 查詢變慢
- 達到 Firestore 免費額度上限
- 資料庫大小超過預期

## 💰 成本考量

### Firestore 定價（以寫入操作計算）

- **清理操作**：每筆刪除 = 1次寫入操作
- **清理1000筆記錄**：約 $0.0018 USD
- **月度清理成本**：通常 < $1 USD

### 不清理的後果

- 查詢效能下降
- 儲存成本增加
- 達到免費額度上限

## 🔧 技術實現

### 清理邏輯

```typescript
// 清理過期的 email 驗證記錄
const expiredQuery = query(
  collection(db, 'emailVerifications'),
  where('expiresAt', '<', Timestamp.fromDate(now))
);

// 清理已使用的舊記錄
const usedQuery = query(
  collection(db, 'emailVerifications'),
  where('used', '==', true),
  where('createdAt', '<', Timestamp.fromDate(oneDayAgo))
);
```

### 安全措施

- 管理員身份驗證
- 操作確認機制
- 詳細的清理日誌
- 分批次刪除避免超時

## 🔍 監控與警示

### 關鍵指標

- 各集合的記錄數量
- 清理頻率和效果
- Firebase 使用量統計

### 建議監控

```javascript
// 檢查各集合大小
const emailVerificationsCount = await collection('emailVerifications').count().get();
const gameTokensCount = await collection('gameTokens').count().get();
const gameHistoryCount = await collection('gameHistory').count().get();
```

## 📞 支援

如果遇到清理問題：

1. 檢查 Firebase 權限設定
2. 確認網路連線穩定
3. 查看瀏覽器開發者工具的錯誤訊息
4. 聯繫技術支援

---

**最後更新**：2024年9月  
**版本**：v1.0
