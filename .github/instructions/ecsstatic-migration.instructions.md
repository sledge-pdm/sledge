---
applyTo: '**/*'
---

# ecsstatic Migration Instructions

## 背景と目的

現在、Sledgeプロジェクトではスタイル定義にvanilla-extractとstyle propsを使用していますが、以下の問題が発生しています：

1. **vanilla-extractのSolid対応問題**: vanilla-extractがSolidJSに対する明確なサポートを宣言していないため、パフォーマンス悪化の懸念がある
2. **style propsのパフォーマンス問題**: style propsでの定義が毎回のレンダーでobject→styleへの変換を行うため、パフォーマンス低下を引き起こす
3. **ファイル数の増加**: スタイルファイルの個別作成により、余計なファイル数の増加が発生している

これらの問題を解決するため、**ecsstatic**によるTSX内でのスタイル定義への一本化を行います。

## 移行の実証結果

packages/ui内のスタイルを試験的にecsstaticに移行した結果：
- ✅ 全体のパフォーマンスに影響なし（むしろ軽量化を実感）
- ✅ テーマ変更への追従など、既存機能の動作に問題なし
- ✅ ファイル数の削減を実現

## 移行方針

### 対象範囲
- `apps/sledge`本体のスタイル定義を優先的に移行
- vanilla-extract（`.css.ts`ファイル）からecsstaticへの移行
- インラインstyle propsからecsstaticへの移行

### 移行手順
1. **既存スタイルファイルの特定**: vanilla-extractで定義された`.css.ts`ファイルを特定
2. **ecsstatic化**: TSX内でecsstaticを使用したスタイル定義に変換
3. **style propsの置換**: インラインstyle propsをecsstaticクラスに置換
4. **テーマトークンの維持**: `packages/theme`からのトークン使用を継続
5. **テスト**: 移行後の動作確認とパフォーマンステスト

### 技術的指針

#### ecsstaticの使用パターン
```tsx
// Before (vanilla-extract)
import { myStyle } from './Component.css.ts';

// After (ecsstatic)
import { css } from '@acab/ecsstatic';

const myStyle = css`
  // スタイル定義
`;
```

#### style propsからの移行
```tsx
// Before (style props)
<div style={{ color: 'red', padding: '8px' }}>

// After (ecsstatic)
const dynamicStyle = css`
  color: red;
  padding: 8px;
`;
<div class={dynamicStyle}>
```

### ファイル構成の変更
- 独立した`.css.ts`ファイルを削除
- TSX内でのスタイル定義に一本化
- `packages/theme`のトークンシステムは継続使用

## 注意事項
- テーマシステム（`packages/theme`）との互換性を維持
- 既存のコンポーネントAPIは変更しない
- パフォーマンステストを各移行段階で実施
- 継承について、css`${継承元} ...`では行うことができません。それぞれを定義したうえで、jsx側でclass={clsx(a, b)}を用いてください。
- クラスを複数利用する場合も同様にclsx(a, b)を使って連結し、テンプレートリテラルの使用は避けてください。
- solidJSのstoreやsignalによるリアクティビティが適用されているstyle propsについてはそのまま残してください。
- vars.xxx.yyyはvanilla-extract依存のcss変数であり、撤廃すべきです。ecsstaticの移行への際、これらは以下の対応でpureなcss変数に置き換えが可能です。
  
  - vars.color.camelCase = var(--color-snake-case) ※color以外でも同様
  - Consts.zIndex.camelCase = var(--zindex-snake-case)

- font-familyについては、vanilla-extractと同名での定義をcssで行っています(ZFB09 = ZFB09, PM12 = PM12)。font名についてはvar()ではなく、そのままフォント変数名をcss内に記述できます。この際、font-family: ${font}ではなくfont-family: fontのように記述してください。
- 同名同様のスタイルが複数のコンポーネントにまたがっている場合は、XXStyles.tsのようなファイルを作成し、共通スタイルをexport const someStyle = css`...`のような形でexportすることも検討してください。ただし、部分的に共通している部分がある場合は共通化せず、全く同一のスタイルである場合のみこれを行ってください。

- flexRow, flexCol, w100, h100, wh100といったスニペットクラスはvanilla-extract定義のクラスなので、基本的にこれらは撤廃し、個別に定義したcss内部にdisplay:flex等の内容をそのまま記述してください。flexRowやflexColという名前のcss変数を作成することは避けてください。
- vanilla-extract(css.ts)からの移行と同時に、不要なjsx内でのstyle props(style={{...}})の定義がある場合、適切な名前を付けてecsstaticのcssに抽出してください。

## 移行状況
- [x] packages/ui - 完了（試験移行）
- [ ] apps/sledge - 進行中

この移行により、スタイル定義の一本化とパフォーマンス向上を実現し、開発体験の改善を図ります。