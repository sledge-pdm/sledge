# history recon

## 概略
- そもそもHistoryActionにはImagePoolPropsとSelection変化が実装されていない
- ただしその前に複数操作の複合履歴をcommandの組み合わせで表現できるようにする
- 基盤は既に構築済み(HistoryEntry/HistoryCommand)。実用例については`layer/actions.ts`(単体command利用)、`io/clipboard/ClipboardActions.ts`(Cut+Paste undo/redo順序指定あり)を参照

- projectHistoryControllerはhistoryManagerに移行
- HistoryActionは事が済んだら完全に削除
- テストは順次記述(test/unit/features/history/)
- (!) contextはHistoryActionのany仕様であっても現状ほぼsections/history/History.tsxで使うためのものでしかない。アイコンと説明だけあればよさげなのでそうする(HistoryContext)

## TODO
1. 新規Command実装（~~imagepoolprops~~, selection）
2. ~~シリアライズ、デシリアライズ検討~~
  - ~~command系にも固有typeはあるのでpropsと合わせて復元は可能~~
  - ~~ただしProjectHistoryControllerではdeserializeにすべてのactionをハードコードしていた。それぞれのcommandファイルからfactoryを登録する、というようにもう少し頑張りたい。また現状Commandはpropsをメンバにスプレッドしてしまっているところが多いが、props: XXXPropsはそのままメンバで持ったほうがシリアライズ時にgetPropsから直接復元用Propsを持ってこれるので楽なはず（特にコンストラクタのみの情報で済むときはpropsだけで完全復元。snapshotなどを後から取得するものは使うので`serializeProps: { ...props, ...otherLateValues }`。みたいにする必要はあるが、HistoryActionではそうしているようにそのotherLateValuesもundefined-ableでpropsに定義することで初期値流し込みができて完全復元が可能。~~
3. ~~frasco側履歴のエクスポート、復元方法検討~~
  - ~~これに伴いFrascoLayerの履歴のシリアライズはオンメモリではfrasco側に命令するだけのタイミングラッパなので、ここからシリアライズするときは履歴実態をfrasco layerから持ってくる必要がある。履歴をID管理してエクスポート、シリアライズする必要があると思われる　効率的なやり方とシンプルなやり取りが理想。~~
  - 復元の方法が他のActionとは異なる。外部からlayerに履歴を直接流し込める経路が必要。
4. Selection系の実装検討（あとでいい）
  - 全体的にSelection系がわけわからない。Previewだのなんだのでcommitやらなんやらしているが、もっと簡潔に済ませられるはず。
  - 大きくいってしまえば可読性が低く、アーキテクチャも多分非効率。もっと率直に選択範囲(bitmask)を考えればfragmentだとかなんだとかも必要ないはず。
  - 今回の件ではSelectionの履歴とは「追加した」「削除した」などの分類はなく前回の履歴状態→次の履歴状態へのswapスナップショットで済むべき。
