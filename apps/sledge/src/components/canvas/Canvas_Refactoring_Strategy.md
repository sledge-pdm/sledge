# Canvas_Refactoring_Strategy

## 現状
* 現行のキャンバス表示および操作は以下の方法で行われています。

### コンポーネント
#### CanvasArea
* キャンバスをはじめ、キャンバス横のサイドバー領域までここで確保している。理由として、領域を下に図示すると、

> |canvas-area      |canvas-stack        |               |
> |canvas-area      |canvas-overlay-root |               |
> |s-section   |sections-between-area        |s-section  |

のようになっており、CanvasArea全域自体はそもそもズームパンのインタラクト対称ではあるものの、その両横にサイドセクションが来たらその間の部分=sections-between-areaがユーザーに見える操作可能領域となる。この領域(初期ズームや回転中心などを取る際非常に有用)をdivで得るために、サイドセクションを内包する形となっている。
* CanvasAreaInteract.tsxはこのCanvasAreaのwrapper div、もしくはwindow自体(ストロークがストローク不可の所に行っても続けられたり、キー操作がどこからでもできるようにする)にたいしてリスナーを付与し、マウス、タッチにおけるズーム、パン、ピンチは主にここで処理される。また、タッチ操作のRotationはTouchRotationSnapperにより、ある程度丸め処理をすることで操作感を向上している。

* ここで、CanvasArea自体にTransformが適用されることはなく、基本的にウィンドウサイズ依存。
* CanvasAreaではここでCanvasStack(InteractCanvas => OverlaySVG => WebGLCanvas)全体に以下のtransformをかける。※ここでRAF処理。60fps。それまでの値の更新は遅延なく書き込まれ続ける。60fpsごとに最終値を更新する。ただし、更新までの間に依存する要素の大きさなどが即時リアクティブなどで変わるとちょっと面倒になる可能性もある。
* ```ts
  canvasStack.style.transform = `translate(${currentOffsetX}px, ${currentOffsetY}px) scale(${currentZoom})`;
  ```
  CanvasStack全体にオフセットとズームをかけ、ここでパン/ズーム/ローテーションのうちパンとズームが実現できたことになる。

#### CanvasStack
* CanvasStack側は「キャンバスと重なっていることに意義がある」コンポーネントの集合
  WebGLCanvasを本体として、ペンなどの描画操作をつかさどるInteractCanvas、またキャンバスの枠線や選択範囲などを表示するCanvasOverlaySVGが積層している。
* 先述したtransformはこれら全体にかかっている。そして、CanvasStack側はrotationを含めた謎の式でtransformを更新する。※ここでRAF処理。60fps。それまでの値の更新は遅延なく書き込まれ続ける。60fpsごとに最終値を更新する。ただし、更新までの間に依存する要素の大きさなどが即時リアクティブなどで変わるとちょっと面倒になる可能性もある。
```ts
        // translate -> rotate -> scale -> translate back
        orientationRef.style.transform = `translate(${cx}px, ${cy}px) rotate(${rot}deg) scale(${sx}, ${sy}) translate(${-cx}px, ${-cy}px)`;
        orientationRef.style.transformOrigin = '0 0';
```
* 注目したいのは、CanvasStackのcssサイズは「完全にキャンバスのピクセルサイズと一致している」という点。これにより、座標系の扱いは簡単になっているともいえるし、複雑化しているともいえる。
* ともかく、1000x1000のキャンバスのCanvasStackは1000px x 1000pxの要素として作られる。適切な初期ズームを決めるため、これはfeatures/canvas/service.tsのreferenceLengthやgetReferenceZoomなどで初期ズームを決定している。具体的にはsections-between-areaの領域に対しての長辺が、全体の85%の長さになるようなズームの値(referenceZoom)を決定している。このとき、referenceZoom=initialZoomは基準であり、referenceの実際のズームがx3.1143などだった場合でも、ズームのUI表示ではこれをx1として表示する(zoom / initialZoom)。

### 現状の問題点
* transformを多層に呼ぶ関係上、座標系がかなり複雑になっている。
* 座標のロジックが複雑すぎて、細かい操作やベクトル操作に対応しきれない。今、一応CanvasPositionCalculatorにそれを入れているが、ここまでしないと変換できない。
* ロジックの中で不要な計算が起きている可能性がかなりある。例えばgetBoundingClientRectは実際の位置とキャンバス座標との変換などで使われているが、これ自体にもっと良い計算方法があったり、呼び出しの頻度を減らす工夫が可能だと思われる。


### 提案(または展望)
* (クリティカル) そもそものtransformの順序ややり方の妥当性を考え、別のパンズームローテーションの実装方法を考える。
* 座標系を明確にし、Vec2をWindowPosとCanvasPosに分け、Vec2型から両者を分離する。PhysicalPositionとLogicalPositionのような感じ。
* それぞれの座標をデバッグ表示で画面上に入れる。ContextMenuListBuilder.tsxが参考になると思われる。

* (展望) パフォーマンスの向上、直感的なオーバーレイやタッチ操作の実装がしやすくなる(スケーリングや回転状況の処理で悩まない)