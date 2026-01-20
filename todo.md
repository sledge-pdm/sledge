## frasco移行

### 機能todo

- browser modeでの動作が可能になったので、unit/e2eテストを書いていく　frasco移行箇所だけでなく全機能に対して書いていく

- エラーハンドリングの改善(特にプロジェクト読み込み時　`apps\sledge\src\routes\editor\load_error_handling.md`も参照)

- ImagePoolにおける命名がひどい(RuntimeImage - PersistedImage　なんのことだかわからない)ので構造から何とかするべき

### パフォーマンスtodo

- Snapshotは基本的にプロジェクトそのものと同じサイズとみなせるので、2MBのプロジェクトで10回スナップショットを取ると22MBになる(多分。もっとひどいか、もしくはもっと軽い可能性はあるが)。
  これ自体(project in project)にほぼ異存はないのだが、以下の点で疑問が残る
  1. 現状ProjectがMsgpackを使っているが、snapshot自体にもMsgpackをかけるべきかもしれない。
     project.snapshots[i]の内容が親のprojectのmsgpack packing一回でpackedされたことになっているのか疑問が残る。
  2. 読み込み時にsnapshot全体を取得する必要が今のところない。thumbnailとかの情報は入っており、canvasサイズなどのproject内部情報にしてもsnapshot.snapshotから出すか、内部内容を持ち出すにしてもロード時に必要な情報を読みだせたらsnapshotの内容はオンメモリからは捨てても問題ないような気がする