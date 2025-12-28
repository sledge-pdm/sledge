# Explorer Path / Breadcrumb Cases

プラットフォームごとの代表的なパス表記と、Explorerで期待されるパンくず表示・遷移挙動を整理する。
`Status` は現在の実装状態を記載し、問題があればメモ欄で課題を明示する。

| # | Platform | 入力/操作 | 期待パス解釈 | 期待パンくず | Status | メモ |
|---|----------|-----------|--------------|--------------|--------|------|
| 1 | Linux / Unix | `/` を開く | ルートディレクトリ | `['/']` (クリック不可) | ✅ | ルートクリックで`/`を再表示できること |
| 2 | Linux / Unix | `/home` | `/home` | `['/', 'home']` | ✅ | `/` クリックでルートへ戻る |
| 3 | Linux / Unix | `/home/user/projects` | `/home/user/projects` | `['/', 'home', 'user', 'projects']` | ✅ | 前方パンくずクリックでその階層へ移動 |
| 4 | Linux / Unix | `home/user` (先頭 `/` 無し) | 相対→`home/user` | `['home', 'user']` | ⚠️ | プロジェクト起動時の相対パス入力をどう扱うか要検証 |
| 5 | Linux / Unix | `//server/share/photos` (SMB マウント) | `//server/share/photos` | `['//server/share', 'photos']` | ⚠️ | UNC 互換表記の検証が不足 |
| 6 | Windows | `C:` | `C:/` に補完 | `['C:/']` | ✅ | 入力後 Enter でルートへ移動 |
| 7 | Windows | `C:/Users` | `C:/Users` | `['C:/', 'Users']` | ✅ | 親 (`C:/`) → 子 (`Users`) の往復で二重 `Users` にならない |
| 8 | Windows | `C:/Users/Public` | `C:/Users/Public` | `['C:/', 'Users', 'Public']` | ✅ | 中間パンくず (`Users`) をクリックすると `C:/Users` へ |
| 9 | Windows | `\\SERVER\Share` or `//SERVER/Share` | `//SERVER/Share` | `['//SERVER/Share']` | ⚠️ | 末尾スラッシュや大文字小文字の扱いを揃える |
|10 | Windows | `\\SERVER\Share\work\shots` | `//SERVER/Share/work/shots` | `['//SERVER/Share', 'work', 'shots']` | ⚠️ | UNC で `..` 操作が妥当か要検討 |
|11 | 共通 | `.` または `./something` | カレント基準 | `['.', 'something']` または空 | ⚠️ | Explorer では相対パス禁止にする案もある |
|12 | 共通 | 無効パス `/not/found` | 直前の有効パスへロールバック | 直前のパンくずを復元 | ✅ | warning を表示しフォールバックする |
|13 | 共通 | エントリクリック直後に別操作 | パス遷移中でも最新の `currentPath` を使用 | クリック結果が常に一貫 | ✅ | `setPath` の即時更新で解消 |
|14 | 共通 | ドラフト欄で ESC | 入力破棄、表示を `currentPath` に戻す | パンくずは変化なし | ✅ | `skipBlurApply` で制御 |
|15 | 共通 | 末尾 `/` の有無 (例: `/var/`) | 常に末尾スラッシュ無し（ルート/ドライブ除く） | パンくずに余計な空要素が出ない | ✅ | `normalizeDirectoryPath` が統一 |

## 追加で検討すべき観点

- UNC 共有や WSL パスなど、OS 提供 API から返る表記を網羅的に収集してテストケース化する。
- 相対パス (`./foo`, `../bar`) を Explorer が受け入れるべきかを決定し、許容するなら正規化結果とパンくず表示を仕様化する。
- 読み込み中の一時状態(UIが古いエントリを表示している時間)の扱い。ローディングインジケータやクリック抑止の必要性を検討。
