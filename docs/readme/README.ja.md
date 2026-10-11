<h1 align="center">
  <img src="../../assets/app-icon.png" alt="Thoughtline app icon" width="96" height="96" valign="middle" /> 晾念头 · Thoughtline
</h1>

<p align="center">
  <a href="https://github.com/NocodeMrLi/thoughtline/stargazers"><img src="badges/stars.svg" alt="GitHub stars: 0" /></a>
  <a href="https://github.com/NocodeMrLi/thoughtline/releases"><img src="badges/downloads.svg" alt="Release asset downloads: 30" /></a>
  <a href="#license"><img src="badges/license.svg" alt="License: UNLICENSED" /></a>
  <a href="https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.22"><img src="badges/preview.svg" alt="Version: 0.0.22" /></a>
  <a href="https://github.com/NocodeMrLi/thoughtline/issues"><img src="badges/feedback.svg" alt="Feedback on GitHub" /></a>
  <a href="https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.22"><img src="badges/platforms.svg" alt="Platforms: macOS and Windows" /></a>
</p>

<p align="center">
  <sub><a href="../../README.md">中文</a> · <a href="../../docs/readme/README.en.md">English</a> · <a href="../../docs/readme/README.ja.md">日本語</a> · <a href="../../docs/readme/README.ko.md">한국어</a> · <a href="../../docs/readme/README.es.md">Español</a> · <a href="../../docs/readme/README.fr.md">Français</a> · <a href="../../docs/readme/README.pt.md">Português</a></sub>
</p>

<p align="center">
  <strong>思いつきを吊るして、ひらめきを身近に。</strong><br />
  一本のロープとクリップ、紙で日々のアイデアを残します。
</p>

<h2 align="center"><a href="https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.22"><ins>Thoughtline をダウンロード</ins></a></h2>

<p align="center"><sub>macOS Apple Silicon · Windows x64 · 0.0.22</sub></p>

Thoughtline は macOS と Windows 向けの軽量なデスクトップメモアプリです。画面上端からメモを呼び出し、思いつきを書き留めて作業に戻れます。

## 機能

- ショートカットでタイトル、本文、分類を記録し、未完成のメモを下書きに保存。
- デスクトップにはロープ、クリップ、紙だけを表示。新しいメモは「通用」に分類。
- カレンダー → その他 → ストレージと設定でクリップを4／6／8個から選択できます。初期値は6個。紙は画面に合わせて縦横比を保って調整し、4個でも過度に拡大しません。ロープが満杯のときに新しく保存したメモは、空きができると新しい順に掛かります。以前の未表示メモや手動でしまったメモは自動で戻りません。
- クリップ全体を移動し、紙を一枚取り出せます。右クリックの **Merge（結合）** で互換クリップを選び、**Split（分離）** で現在の一枚を分離。必要に応じて間隔を整え、自動整理は左右の順序を保ちます。整理は取り消せます。
- 詳細画面やカレンダー内で直接編集。短い入力停止後に自動保存し、ページを即座に切り替え。
- 日・月・年で振り返り、検索や状態フィルターで収納済みのメモも表示。
- 削除したメモは「最近削除した項目」から復元。プロジェクト削除でも本文は保持。
- 本文をコピー、またはプレーンテキストとしてドラッグ。元のメモを保持し、自動送信しません。
- データをローカル保存し、実際のフォルダー表示、移動、独立したバックアップ出力に対応。
- 最初の画面から中国語／Englishとライト／ダークを切り替え、システムにも連動できます。紙は柔らかく読みやすい質感を保ちます。
- ロープが満杯でも保存するか、同じ画面の **Swap onto line** で入れ替えられます。元のメモは収納して保持。カレンダーから掛け直すとすぐ表示され、その他メニューはマウスを離すと閉じます。

- タイトルまたは本文があれば保存できます。ベルで一度だけのリマインダーを設定し、カレンダーにも表示します。システム通知には許可が必要です。完全終了中は通知できず、再起動時に未通知分をまとめます。 システム通知が利用できない場合は、画面上部の小さなリマインダーで補います。フォーカスを奪わず、クリックでメモを開けます。

<p align="center"><img src="images/thought-calendar.png" alt="合成データを使ったメモカレンダーの例。" width="740" /><br /><sub>合成データを使ったメモカレンダーの例。</sub></p>

## ダウンロードとインストール

リポジトリへのアクセス権を持つメンバーがダウンロードできます。Releases にパッケージ、分離起動スクリプト、SHA256SUMS、ビルド情報があります。 [Releases](https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.22).

| Platform | Package |
|---|---|
| macOS · Apple Silicon | arm64 · DMG |
| Windows | x64 · EXE (NSIS) |

更新前に正常終了してデータをバックアップしてください。商用署名証明書や公証は予定していません。Mac はローカルの ad-hoc 署名を維持し、Windows は未署名です。ユーザーが通常のシステム確認に従って信頼を選択し、インストールします。署名の有無は製品の成熟度とは別です。自動更新はありません。

## 使い始める

1. Control + Alt + N（Mac は ⌃ + ⌥ + N）で新規メモを開きます。設定で変更できます。
2. Enter は改行。Mac は ⌘ + Enter、Windows は Ctrl + Enter で確定。Esc は下書きを保存して閉じます。
3. ポインターを画面上端へ動かしてロープを表示し、紙を開いて閲覧・コピー・編集・収納します。
4. カレンダーで収納済みメモを探し、最近削除した項目から復元できます。

ラベルは用途・相手・ツールを表します。生活のアイデア、仕事のメモ、直属の上司、同僚、Codex のほか、日報や設計案、顧客などを追加できます。新規インストールには6個の簡潔なラベルを用意し、既存のラベルと色は保持します。日付一覧は「すべて／ロープ上／ロープ外」で絞り込み、保存のみ・収納済み・容量超過の過去のメモを探せます。他のアプリには自分でコピーまたはドラッグします。実際の入力欄での受け取りは個別に検証します。

## データとバックアップ

カレンダー設定に実際の保存先を表示します。移動はコピーと検証の後に切り替え、元のデータを残します。バックアップ出力では現在の保存先を変えません。 [Data / 备份说明](../ROUND1-DATA-SAFETY.md).

現在の形式は schema3 です。0.0.16-preview.6 は直接読み取れません。新データを保持し、更新前バックアップを別フォルダーで確認してから戻してください。更新後の変更はそのバックアップに含まれません。

## 開発

Node.js 24.19.0 以上の 24.x を使用します。verify は型検査、単体テスト、ビルドを実行。パッケージは対象OSで作成します。Electron、React、TypeScript、Vite を使用しています。

```bash
npm ci
npm run dev
```

```bash
npm run verify
npm run package:mac
npm run package:win
```

適用可能な自動検査とパッケージ検証は完了しています。実機の入力方式、DPI、複数画面、フォーカス、WeChat・Doubao・WorkBuddy の実際の入力欄は独立テスト待ちです。アプリ画面は中国語とEnglishに対応します。入力・詳細・カレンダーの右上で言語とライト／ダークを直接切り替え、設定でシステム連動に戻せます。上の7言語リンクはREADMEの翻訳で、アプリの対応言語数ではありません。

## フィードバック

不具合や提案は Issues へ。バージョン、再現手順、期待結果と実際の結果、個人情報を除いた証拠を添えてください。実際のメモや個人データをアップロードしないでください。 [Issues](https://github.com/NocodeMrLi/thoughtline/issues).

Starとダウンロード数は2026-10-10のAPIスナップショットです。ダウンロード数はリリース資産の取得回数です。

<a id="license"></a>
## ライセンスと謝辞

現在は UNLICENSED で、オープンソースの利用許諾は付与されていません。将来の公開時にライセンスと貢献方法を定めます。同梱コードのライセンスは第三者声明を参照してください。 [Third-party notices](../../THIRD_PARTY_NOTICES.md).

0.0.22 title-only thoughts and reminder fields require the updated reader. Before downgrading, retain current data and use a pre-upgrade backup in a separate directory.
