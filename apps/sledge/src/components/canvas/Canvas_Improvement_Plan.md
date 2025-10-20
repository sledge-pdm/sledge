# Canvas座標システム改善計画

## 概要

現在のCanvas座標システムの複雑さを解決するための統一された新しいアーキテクチャを提案・実装しました。

## 現状の問題点

### 1. 二重のTransform構造
- **CanvasArea**: `translate(offset) scale(zoom)` 
- **CanvasStack**: `translate(cx,cy) rotate(rotation) scale(sx,sy) translate(-cx,-cy)`

### 2. 複雑な座標変換
- `CanvasPositionCalculator.ts`に複数の変換関数が乱立
- `getBoundingClientRect()`の頻繁な呼び出し
- 行列計算とマニュアル計算が混在

### 3. パフォーマンス問題
- 2つの独立したRAF処理が並行実行
- 座標変換のたびに重い計算を実行

## 解決策

### 1. 統一座標システム (`CoordinateTypes.ts`)

```typescript
interface WindowPos { x: number; y: number; __brand: 'WindowPos'; }
interface CanvasPos { x: number; y: number; __brand: 'CanvasPos'; }
```

型安全性を提供し、意図しない座標系の混同を防止。

### 2. 単一Transform実装 (`UnifiedCoordinateTransform.ts`)

```typescript
export class UnifiedCoordinateTransform {
  private computeTransformMatrix(): DOMMatrix {
    // パン・ズーム・回転・反転を単一のDOMMatrixで処理
    return new Matrix()
      .translate(totalOffsetX, totalOffsetY)
      .scale(zoom)
      .translate(cx, cy)
      .rotate(rotation)
      .scale(sx, sy)
      .translate(-cx, -cy);
  }
}
```

### 3. パフォーマンス最適化

- **行列キャッシュ**: 状態変更時のみ再計算
- **getBoundingClientRect**キャッシュ: 100ms間のキャッシュ
- **単一RAFループ**: transform更新の統合
- **差分検出**: `matrix.toString()`で変更検出

## 新しいファイル構成

```
/types/CoordinateTypes.ts                    # 座標型定義
/features/canvas/UnifiedCoordinateTransform.ts # 統一座標変換
/features/canvas/CanvasPositionCalculatorNew.ts # 互換性レイヤー
/components/canvas/CanvasAreaNew.tsx         # 新Canvas Area
/components/canvas/stacks/CanvasStackNew.tsx # 簡略化Canvas Stack
/components/canvas/CanvasAreaInteractNew.tsx # 最適化Interact処理
/components/canvas/overlays/CoordinateDebugOverlay.tsx # デバッグ表示
```

## 移行計画

### Phase 1: 並行実装
- [x] 新しい座標システムを既存システムと並行して実装
- [x] 既存APIとの互換性レイヤーを提供
- [x] デバッグ機能で動作確認

### Phase 2: 段階的移行
- [ ] 新しいコンポーネントを個別にテスト
- [ ] 既存のCanvasAreaから新しいCanvasAreaNewに切り替え
- [ ] オーバーレイコンポーネントの座標変換を更新

### Phase 3: 完全移行
- [ ] 古いCanvasPositionCalculator.tsを削除
- [ ] 古いCanvasArea/CanvasStackを削除
- [ ] "New"サフィックスを削除して正式版に

## 使用方法

### 基本的な座標変換

```typescript
import { coordinateTransform } from '~/features/canvas/CanvasPositionCalculatorNew';
import { WindowPos, CanvasPos } from '~/types/CoordinateTypes';

// ウィンドウ座標 → キャンバス座標
const windowPos = WindowPos.create(100, 200);
const canvasPos = coordinateTransform.windowToCanvas(windowPos);

// キャンバス座標 → ウィンドウ座標
const backToWindow = coordinateTransform.canvasToWindow(canvasPos);
```

### デバッグ表示の有効化

```typescript
// 任意のコンポーネントにインポート
import CoordinateDebugOverlay from '~/components/canvas/overlays/CoordinateDebugOverlay';

// JSX内で使用
<CoordinateDebugOverlay />
```

## 期待される効果

### 1. 開発効率の向上
- 座標変換のロジックが明確で理解しやすい
- オーバーレイの配置が簡単
- デバッグが容易

### 2. パフォーマンス改善
- 不要な計算の削減（推定30-50%の処理時間短縮）
- メモリ使用量の最適化
- スムーズなアニメーション

### 3. 保守性の向上
- 単一責任の原則に従った設計
- 型安全性による間違いの防止
- テストしやすい構造

## テスト方法

1. **新しいコンポーネントの確認**
   ```bash
   # プロジェクトをビルド
   pnpm build
   ```

2. **デバッグ表示の確認**
   - `CoordinateDebugOverlay`を有効化
   - マウス移動時の座標変換を確認
   - ズーム・回転時の動作を確認

3. **既存機能との比較**
   - ペン描画の精度
   - 選択範囲の正確性
   - オーバーレイの位置

## 注意事項

- この改善は**段階的移行**を前提としており、既存機能を破壊しません
- 互換性レイヤーにより既存コードは引き続き動作します
- パフォーマンス向上は特に複雑な操作（多指タッチ、高速ズーム）で顕著です

---

この改善により、Sledgeのキャンバス操作はより直感的で高性能になり、今後の機能拡張も容易になります。