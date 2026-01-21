### 機能todo

- browser modeでの動作が可能になったので、unit/e2eテストを書いていく　frasco移行箇所だけでなく全機能に対して書いていく

- ImagePoolにおける命名がひどい(RuntimeImage - PersistedImage　なんのことだかわからない)ので構造から何とかするべき

- 書き込んだLayerがdisposedな時など、書き込めなくなる状態において自動的にレンダーを再開したい（もし再開すらできなければエラーを出したい > 関連:エラーハンドリングの改善）

- ProjectLoaderのnew/image系ロードで、既存のRuntimeProject（imagePool/snapshots/historyなど）がどこまで初期化されるのか不透明で、状態漏れの印象がある

- Snapshotロード時のsnapshots退避/復帰が配列のスプレッドに見えていて、順序や構造が崩れる可能性がありそうで要確認

- autosave/backupの保持ポリシーが実質無制限に見えるため、長期運用でディスクを食い続ける懸念（世代数/容量上限の設計が必要）

- FrascoRendererがMAX_LAYERS=16で黙って切り捨てる構造なので、層数が増えたときのUI/警告/代替描画が不足している印象

- exportのper-layer保存がlayer.nameをそのままファイル名に使っていて、OS的にNG文字や同名衝突が起きやすそう

- Clipboardのレイヤーコピーが「layerIdのテキスト」を書き込む設計で、他アプリ/他ウィンドウとの整合が不明確（フォーマット定義が欲しい）

- eventBus購読の解除がコンポーネントごとに一貫しておらず（CanvasAreaなど）、ホットリロード/複数ウィンドウでハンドラ増殖しそう

- WindowUtilsのalreadyShownErrorsがグローバルで、複数ウィンドウ/複数エラーの扱いが不透明（抑止の副作用が気になる）

- config/editor_stateのJSONにバージョン管理やschema検証がなく、壊れた設定が静かに上書きされる可能性がある

- cutFreeze/merge/selectionの状態遷移が複雑で、UI上の期待と内部状態がズレやすい印象（Undo/Redo含めて整合の再点検）

- platform抽象化外のwindow/document依存が点在しており、browser modeやテスト環境での再利用性が低い

### パフォーマンスtodo

- Snapshotは基本的にプロジェクトそのものと同じサイズとみなせるので、2MBのプロジェクトで10回スナップショットを取ると22MBになる(多分。もっとひどいか、もしくはもっと軽い可能性はあるが)。
  これ自体(project in project)にほぼ異存はないのだが、以下の点で疑問が残る
  1. 現状ProjectがMsgpackを使っているが、snapshot自体にもMsgpackをかけるべきかもしれない。
     project.snapshots[i]の内容が親のprojectのmsgpack packing一回でpackedされたことになっているのか疑問が残る。
  2. 読み込み時にsnapshot全体を取得する必要が今のところない。thumbnailとかの情報は入っており、canvasサイズなどのproject内部情報にしてもsnapshot.snapshotから出すか、内部内容を持ち出すにしてもロード時に必要な情報を読みだせたらsnapshotの内容はオンメモリからは捨てても問題ないような気がする

- AutoSnapshotManagerがsetInterval+async保存でロック/スロットリングが無く、重いプロジェクトだと保存の重なりやI/O詰まりが起きそう

- Export/thumbnail/mergeなどでreadPixels→2D変換が多発しており、大きいキャンバスでメインスレッドが止まりやすい構造に見える

- selection/move周りでフルサイズのバッファ複製が頻発していて、メモリスパイクが出やすい（タイル化や部分更新の余地）

- historyのスタックが「件数上限のみ」で容量の視点が弱く、巨大レイヤー/画像操作でメモリが急増しそう

- CanvasAreaのtransform更新が常時RAFで走っており、アイドル時にも無駄に回る設計に見える（イベント駆動に寄せたい）
