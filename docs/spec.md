# 📄 **要件定義書（Bun100% チャットアプリ）**

---

## ■ **1. アプリケーション概要**

Bun ランタイムだけで完結する **リアルタイムチャットアプリ**を開発する。
サーバーは `Bun.serve`、リアルタイム通信は WebSocket、DB は `bun:sqlite`。
フロントエンドは React / Preact を使わず、**Bun の JSX と独自 h(), render(), useState(), useEffect() を使用**する。

---

## ■ **2. スコープ**

### ● スコープ外

* 標準的なユーザー認証（メール、OAuth）：**なし**
* 大規模スケール（水平スケールなし）：**fly.io Free Tier 前提**
* 長期ロギングや大量データの扱い：**当日分のみ保持**
* React / Preact / Vue / Svelte など：**一切使用しない**

### ● スコープ内

* 軽量なリアルタイムチャット
* 名前のみの簡易認証（localStorage）
* SQLite に当日のチャットログ 5 件のみ保存・取得
* WebSocket によるリアルタイム更新
* Bun によるサーバー、DB、Routing、バンドル
* JSX（独自 h 実装）による UI

---

## ■ **3. 対象ユーザー**

* 小規模チーム／個人
* 軽量チャットを試したい開発者
* Bun の学習用途

---

## ■ **4. 画面要件**

---

### ### **4.1 トップページ `/`**

#### **機能**

* 名前入力欄（テキスト）
* 入室者数の表示（現在 WebSocket 接続数）
* 入室ボタン（クリックで `/chat` へ遷移）

#### **UI 要件**

* Tailwind CSS を使用してシンプルデザイン
* localStorage に以下保存：

  * `chat_name`: 入室時の名前

#### **イベント**

* 入室ボタン押下時：

  * 名前が空 → エラー表示（JSXで反映）
  * 名前を localStorage に保存
  * `/chat` へ遷移

---

### ### **4.2 チャットページ `/chat`**

#### **初期表示**

* DB から取得した **直近 5 件**のメッセージを表示
* UI スタイルは ChatGPT / LINE 風気泡 UI

#### **送信機能**

* メッセージ入力欄
* 送信ボタン or Enter キー

#### **WebSocket**

* 接続開始：ユーザー数がサーバー側で更新され、全員へ配信
* 新規メッセージ受信：

  * JSX の状態を書き換え、画面更新

#### **UI表示例**

* 左側：他ユーザーのメッセージ
* 右側：自分のメッセージ
* 名前＋メッセージ

---

## ■ **5. データベース要件（bun:sqlite）**

### ● テーブル：`messages`

| カラム名    | 型                                 | 備考             |
| ------- | --------------------------------- | -------------- |
| id      | INTEGER PRIMARY KEY AUTOINCREMENT | 一意ID           |
| name    | TEXT                              | 投稿者名           |
| message | TEXT                              | 本文             |
| ts      | INTEGER                           | UNIX timestamp |

### ● 制約・運用

* 保存は **当日分のみ**
  → 起動時または一定周期に **昨日分を削除**
* 最新5件のみ取得クエリ：

```sql
SELECT * FROM messages ORDER BY ts DESC LIMIT 5;
```

---

## ■ **6. サーバー要件（Bun.serve）**

---

### ● 6.1 HTTP Routes

| HTTPメソッド | パス              | 内容              |
| -------- | --------------- | --------------- |
| GET      | `/`             | トップページ          |
| GET      | `/chat`         | チャットルーム         |
| GET      | `/api/messages` | DB から最新5件取得     |
| POST     | `/api/messages` | 新規投稿をDBに保存      |
| 静的       | `/static/*`     | JS, CSS, assets |

Bun が HTML を Entry Point として bundling して配信。

---

### ● 6.2 WebSocket Routes

* `/ws`

  * 接続数管理
  * message 受信 → 全員へ broadcast
  * DB へ保存

#### メッセージ形式

```json
{
  "type": "chat",
  "name": "Alice",
  "message": "こんにちは"
}
```

#### broadcast例

```json
{
  "type": "chat",
  "payload": {
    "name": "Alice",
    "message": "こんにちは",
    "ts": 1710000000
  }
}
```

---

### ● 6.3 WebSocket サーバー内部状態

* `clients: Set<WebSocket>`
* `broadcast(fn)` で全員に配信

---

## ■ **7. フロントエンド要件（JSX + 独自フレームワーク）**

---

### ● 7.1 h() の要件

* JSX → `{ type, props, children }` の仮想DOMに変換
* class, id, onclick, value など一般属性に対応

---

### ● 7.2 render() の仕様

* 仮想DOMを再帰的に HTML に変換
* 新規ノードのみ append（差分計算なし）
* 初回描画のみ対応すれば可

将来的に必要なら diff を検討。

---

### ● 7.3 useState()

* 値変更 → 依存 effect を再実行
* 再レンダリングは effect 内で `render(App())` する設計を許容

---

### ● 7.4 useEffect()

* 依存トラッキング（簡易）
* 副作用（WebSocket接続など）を実行

---

### ● 7.5 ChatPage.jsx 内の必要ステート

* `messages`: useState([])
* `input`: useState("")
* `ws`: WebSocket インスタンス
* `username`: localStorage の値

---

## ■ **8. 非機能要件**

---

### ● 8.1 パフォーマンス

* fly.io free tier の 256MB メモリで動作可能
* DB クエリは軽量（5件取得のみ）
* WebSocket接続数は5〜10人程度までを想定

---

### ● 8.2 セキュリティ

* 認証なし
* XSS対策として:

  * message はエスケープして表示
* WebSocket 接続の Origin チェック

---

### ● 8.3 運用・保守

* ログはサーバー側へ標準出力のみ
* fly.io restart 時に DB が初期化されても問題ない（当日分だけのため）

---

## ■ **9. デプロイ要件（fly.io）**

---

### ● 9.1 Dockerfile（例）

* `bun` 公式イメージをベースに
* `bun install` → `bun run` → `bun bun build`
* `/data/app.db` に SQLite を配置（永続ボリューム）

### ● 9.2 Fly 設定

* `flyctl launch`
* 永続ボリューム `1GB`（当日ログだけなので十分）
* ポート 8080 で Bun を bind

---

## ■ **10. 補足：開発補助ツール**

* ESLint（Bun向け設定）
* bun test（チャット利用部分のユニットテスト）
* 通常のCSS
