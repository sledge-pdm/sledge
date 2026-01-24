### 機能todo

- browser modeでの動作が可能になったので、unit/e2eテストを書いていく　frasco移行箇所だけでなく全機能に対して書いていく

- 書き込んだLayerがdisposedな時など、書き込めなくなる状態において自動的にレンダーを再開したい（もし再開すらできなければエラーを出したい > 関連:エラーハンドリングの改善）

- autosave/backupの保持ポリシーが実質無制限に見えるため、長期運用でディスクを食い続ける懸念（世代数/容量上限の設計が必要）

- FrascoRendererがMAX_LAYERS=16で黙って切り捨てる構造なので、層数が増えたときのUI/警告/代替描画が不足している印象

- exportのper-layer保存がlayer.nameをそのままファイル名に使っていて、OS的にNG文字や同名衝突が起きやすそう

- Clipboardのレイヤーコピーが「layerIdのテキスト」を書き込む設計で、他アプリ/他ウィンドウとの整合が不明確（フォーマット定義が欲しい）

- config/editor_stateのJSONにバージョン管理やschema検証がなく、壊れた設定が静かに上書きされる可能性がある

- cutFreeze/merge/selectionの状態遷移が複雑で、UI上の期待と内部状態がズレやすい印象（Undo/Redo含めて整合の再点検）

- platform抽象化外のwindow/document依存が点在しており、browser modeやテスト環境での再利用性が低い

### パフォーマンスtodo

- AutoSnapshotManagerがsetInterval+async保存でロック/スロットリングが無く、重いプロジェクトだと保存の重なりやI/O詰まりが起きそう

- Export/thumbnail/mergeなどでreadPixels→2D変換が多発しており、大きいキャンバスでメインスレッドが止まりやすい構造に見える

- selection/move周りでフルサイズのバッファ複製が頻発していて、メモリスパイクが出やすい（タイル化や部分更新の余地）

- historyのスタックが「件数上限のみ」で容量の視点が弱く、巨大レイヤー/画像操作でメモリが急増しそう

- CanvasAreaのtransform更新が常時RAFで走っており、アイドル時にも無駄に回る設計に見える（イベント駆動に寄せたい）
