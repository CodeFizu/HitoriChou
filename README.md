# 💰 ひとり帳 – 家計簿アプリ | Personal Finance Tracker Web App

「ひとり帳」は、個人の財務管理を簡単に行うためのウェブアプリケーションです。  
ひとり一人が収支を視覚的に把握できるように、グラフや集計機能を搭載しています。

**ひとり帳** is a simple and visual web app for tracking personal income, expenses, and savings.  
It uses charts and summaries to make finance management intuitive.

---

## 🌟 機能 | Features

### 🏠 ホームページ (Home)
- 今月の「収入・支出・貯金」合計を表示  
- カテゴリ別の円グラフ（Chart.js）で内訳を表示  
- 総貯金額の視覚表示  
- 「一覧」「取引」「設定」へのナビゲーション付き  

### 📊 ダッシュボード (Dashboard)
- 年・月選択のドロップダウンでフィルター  
- 選択した月の収支をリアルタイム表示  
- 合計貯金額は常時表示  
- 収支の変化をグラフで可視化  

### 🧾 取引ページ (Transactions)
- 年・月単位で取引をフィルタリング  
- 取引の追加（カテゴリ、金額、日付）  
- 取引の削除も可能  
- Firebaseに保存 

### ⚙️ 設定ページ (Settings)
- ユーザー登録・ログイン・ログアウト機能  
- 「ログイン」「サインアップ」「ログアウト」ボタン

### 🧪 実行方法 | Run Locally
- リポジトリをクローン
- git clone https://github.com/your-username/hitori-cho.git

- firebase-config.js を設定（サンプルを参考に）

- ブラウザで index.html を開く
- または VS Code の Live Server を使って実行

---

## 🔐 Firebase 設定 | Firebase Setup

このアプリでは Firebase を使用して認証とデータ保存を行います。  
Firebase credentials are hidden for security.

### 🔧 セットアップ手順 | Setup Steps

1. `firebase-config.sample.js` をコピーして `firebase-config.js` に変えて  
2. 以下のように Firebase の設定情報を入力します：

```js
// firebase-config.js
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your:appid:here",
  measurementId: "G-XXXXXXX"
};
