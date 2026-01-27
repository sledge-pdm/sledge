# history recon

## 概略
- そもそもHistoryActionにはImagePoolPropsとSelection変化が実装されていない
- ただしその前に複数操作の複合履歴をcommandの組み合わせで表現できるようにする
- 基盤は既に構築済み(HistoryEntry/HistoryCommand)。実用例については`layer/actions.ts`(単体command利用)、`io/clipboard/ClipboardActions.tsx`(Cut+Paste undo/redo順序指定あり)を参照

- projectHistoryControllerはhistoryManagerに移行
- HistoryActionは事が済んだら完全に削除
- テストは順次記述(test/unit/features/history/)
- (!) contextはHistoryActionのany仕様であっても現状ほぼsections/history/History.tsxで使うためのものでしかない。アイコンと説明だけあればよさげなのでそうする(HistoryContext)