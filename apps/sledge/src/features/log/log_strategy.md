# ロギング案

* 現状、あらゆる箇所でまちまちにsetBottomBarやconsole.warn/errorなどを呼んでおり一貫性がない

## 前提

* console.* の代わりに `@tauri-apps/plugin-log` の info/warn/error を使用し、tauri 側のログと DevTools の両方で追えるようにする。
* 直接 plugin-log を呼ぶのではなく、`features/log/service.ts` に集約したログ API を経由する。API は tauri ログ、BottomBar 表示、debugOnly フラグなどを一括制御する。
* `debugLog` は `logSystemMessage` に統合され、DEV ビルドのみ出力される。

## 機能追加

* BottomBar の kind に `persistent` (ツール説明などの定常表示・色=`color.muted`) と `info` (ユーザー通知用の濃色=`color.onBackground`)、`success` (色=`color.enabled`) などを揃え、用途ごとに色味を分けた。
* `logUserInfo/logUserSuccess/logUserWarn/logUserError` … BottomBar+tauri ログをまとめて送るユーザー向け API。`duration` / `persistent` で表示時間を制御可能。
* `logSystemInfo/logSystemWarn/logSystemError` … tauri ログのみを扱う内部向け API。`debugOnly` をオンにすると DEV ビルドのみ出力。
* すべてのログ API は `{ label, details }` を受け取り、tauri 側の文字列に自動整形される。

## ログを行う箇所

* 重要度としては、現状の考えではBottomBar+tauriログ > tauriログのみ > ログなし(BottomBar定常) にわかれる

## 1. BottomBar+tauriログ

* ツール操作(主に終了後 / ToolBehaviorでそれっぽい実装があるが、だいぶ古いため適当である可能性大)
* エラー発生時(非アクティブレイヤーに触れた場合(実装済)など。成功ではロギングなしの操作でも特に失敗したことをユーザーに伝える場合はbottombarに表示するべき。)
* 保存 / エクスポート(成功でも失敗でもキャンセルでも。)

## 2. tauriログのみ

* ユーザーに見せるまでもないログ(webglcanvasのタイル更新数など。)
* 量が多くなるログ(主にgitには載せないその場のデバッグとして、マウス位置などを連続表示する場合など)
  * `logSystemInfo(..., { debugOnly: true })` を使うと、DEV ビルドだけ console.log 相当の出力を維持できる。

## 3. ログなし

* 現状も行っているが、普段はアクティブなツールのショートカットを表示しておく。

## 実装状況メモ

* service.ts で `logUser*/logSystem*` を提供済み。`setBottomBarText*` は内部的にのみ利用し、基本は新 API を利用する。
* BottomBar は `persistent`/`info` で色を切り替え、`success` なども含めたフィードバックに対応済み。
* 主要な I/O / 操作系 (レイヤー操作、ツール、クリップボード、エクスポート、プロジェクト save/load 等) は `logUser*` 経由で BottomBar+tauri ログに統一済み。
* `DebugLogger` は内部で `logSystemMessage(..., { debugOnly: true })` を呼び出すようになったため、今まで通り `logger.debugLog` が使える。
* Vitest では `@tauri-apps/plugin-log` をモックすることでユニットテストからも import できるようにしている。

## 補足

* デバッグ時のみ表示するかに関しては `debugOnly` を使用。ユーザー向けログで `debugOnly` を指定するケースは基本的に無し、システムログでは `debugOnly` をセットすれば DEV ビルドだけに出る。
* 追加でドメイン固有のラッパーが必要な場合は service.ts を直接 import し、`logUser*` を包む小さな関数を各機能モジュールに置く形にする（例: `logExportResult` など）。
