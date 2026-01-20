# load error handling

* startupロード時のエラーハンドリング方法をまとめる　ややこしすぎる
* ウィンドウの状態はややこしいのでここには書かない　成功したときも書かないので以下は失敗したときの話であると理解すること

## 基本方針

* コードの複雑化を防ぐためデバッグ時とユーザーが見るエラーの差は極力なくす(devtoolsへの流し+alertなどはOKだが、"デバッグ時のみ表示される警告"はそれ自体が果たしてユーザーに表示されるものかが見ただけではわからず、本番環境でのUX整合がとりづらい。可能な限り本番環境とデバッグ環境でのエラーハンドリングは合わせる。)
* ウィンドウをむやみに出さない(デバッグ性/本番のUX両方の面で最悪。可能な限り一つのウィンドウで済ませ、その中でどういう流れで読み込み、結果どうなったかを説明したい。)
* 既存のエラーハンドリングを尊重する必要はない。第一に見たときのわかりやすさ、第二にコードの簡潔さを優先して書き換えていく。
* カバレッジがわかりやすいように実装する。以下のケース列挙を改善していき、コードの構造としてもそれに準拠して実装していく。

## 凡例

- `CONFIG`(GlobalConfigの読み込み処理)
- `EDITOR_STATE`(EditorStateの読み込み処理)
- `NEW`(新規プロジェクトの読み込み処理)
- `PROJECT`(既存プロジェクト(.sledge)の読み込み処理)
- `IMG_PROJECT`(既存プロジェクト(画像)の読み込み処理)
- `CLIPBOARD_IMAGE`(クリップボード画像からの読み込み処理)

- (o)...succeeded
- (x)...failed
- (!)...file not exists
- [XXX] > OK(YYY)...XXXというメッセージを出し、OKが押されたらYYYする

```
  (x)PROJECT -> (x)NEW: [Failed to load last project({path}). Tried to load new project but failed.] > OK(close window)
```

## 1. プロジェクト以外

- (o)CONFIG -> (o)EDITOR_STATE: *Go to 2.*

- (x)CONFIG -> ... -> (o)2.: [Failed to load config, fallback-ed (w/ details)] > OK(nothing)
- ... -> (x)EDITOR_STATE -> (o)2.: [Failed to load editor state, fallback-ed (w/ details)] > OK(nothing)

- (x)CONFIG -> ... -> (x)2.: *show nothing in 1.*
- ... -> (x)EDITOR_STATE -> (x)2.: *show nothing in 1.*

## 2. プロジェクト

### `NEW`(globalConfig.default.open === 'new')

-  (o)`NEW`: *nothing(succeeded)*
-  (x)`NEW`: [Failed to load new project.] > OK(close window)

### `PROJECT`(globalConfig.default.open === 'last' && loc.name?.endsWith('.sledge'))

-  (!)`PROJECT` -> (o)`NEW`; [Last project file({path}) not found. Opened new project.] > OK(nothing),"Open Containing Folder"(Open Containing Folder)
-  (!)`PROJECT` -> (x)`NEW`; [Last project file({path}) not found. Opened new project.] > OK(close window),"Open Containing Folder"(Open Containing Folder)

-  (o)`PROJECT`: *nothing(succeeded)*
-  (x)`PROJECT` -> (o)`NEW`: [Failed to load last project({path}). Opened new project.] > OK(nothing)
-  (x)`PROJECT` -> (x)`NEW`: [Failed to load last project({path}). Tried to load new project but failed.] > OK(close window)

### `IMG_PROJECT`(globalConfig.default.open === 'last' && !loc.name?.endsWith('.sledge'))

-  (!)`IMG_PROJECT` -> (o)`NEW`; [Last project file({path}) not found. Opened new project.] > OK(nothing),"Open Containing Folder"(Open Containing Folder)
-  (!)`IMG_PROJECT` -> (x)`NEW`; [Last project file({path}) not found. Opened new project.] > OK(close window),"Open Containing Folder"(Open Containing Folder)

-  (o)`IMG_PROJECT`: *nothing(succeeded)*
-  (x)`IMG_PROJECT` -> (o)`NEW`: [Failed to load last project({path}). Opened new project.] > OK(nothing)
-  (x)`IMG_PROJECT` -> (x)`NEW`: [Failed to load last project({path}). Tried to load new project but failed.] > OK(close window)

### `CLIPBOARD_IMAGE`(clipboard=true)

-  (o)`CLIPBOARD_IMAGE`: *nothing(succeeded)*
-  (x)`CLIPBOARD_IMAGE` -> (o)`NEW`: [Failed to load project from clipboard. Opened new project.] > OK(nothing)
-  (x)`CLIPBOARD_IMAGE` -> (x)`NEW`: [Failed to load project from clipboard. Tried to load new project but failed.] > OK(close window)
