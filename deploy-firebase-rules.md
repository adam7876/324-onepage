# Firebase 安全規則部署指令

## 方法一：使用 Firebase CLI（推薦）

1. 安裝 Firebase CLI：
```bash
npm install -g firebase-tools
```

2. 登入 Firebase：
```bash
firebase login
```

3. 初始化 Firebase 項目：
```bash
firebase init firestore
```

4. 部署安全規則：
```bash
firebase deploy --only firestore:rules
```

## 方法二：通過 Firebase Console 手動部署

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 選擇您的項目
3. 進入 Firestore Database
4. 點擊「規則」標籤
5. 將 `firestore.rules` 文件的內容複製貼上
6. 點擊「發布」

## 重要說明

- 安全規則需要部署到 Firebase 項目才能生效
- 部署後需要等待幾分鐘才能完全生效
- 建議先測試規則是否正確，再部署到生產環境
