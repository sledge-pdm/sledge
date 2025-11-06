## バカややこしいのできっちり整理 it's sooo dull then go make it simple

## 略語凡例
選択範囲/レイヤー = SEL/LAY
コピー/貼り付け/切り取り = C/V/X

### COPY (C)
#### 対象 target
* SEL available? => yes:SEL / no:LAY
#### 実行方法 ways
* [From Key] Ctrl+C OK
* [From UI] SEL: C from contextmenu / LAY:not in contextmenu (should add) / TopMenuBar: C from Edit menu
#### 処理 aftermath
* self-implemented text data
* [ex:SEL] SLEDGE:{"app":"sledge","v":1,"type":"selection","canvas":{"width":1024,"height":1024},"sourceName":"layer 1","bbox":{"x":389,"y":269,"width":227,"height":295}}
* [ex:LAY] SLEDGE:{"app":"sledge","v":1,"type":"layer","sourceName":"layer 1","canvas":{"width":1024,"height":1024}}

> I think it's not good bc it can be pasted to anywhere like above.
> This may should decode buffer to webp or png, and "should not save" other info like offsets to clipboard.
> Instead, the editor should save "last referenced position" in editor state (not in clipboard). this will be replaced when things copied, when tools used, or when interaction go brrbrr. this also may improve usability to implicitly allow "paste in place" option.

### PASTE (V)
#### データ source
* [From Sledge] SEL / LAY | (should) converted to Other:Image already in the process of Copy
* [From Other] text / url / image
#### 対象 target
* [SEL] always active layer.
* [LAY] always index above active layer.
* [Other:Text] (should) add text object to editor (but even text object is not implemented yet so yeah.)
* [Other:URL] (should) add image object to imagepool if it can be loaded as an image.
* [Other:Image] (should) add image object to imagepool if it can be loaded as an image.
#### 実行方法 ways
* [From Key] Ctrl+V OK
* [From UI] SEL: V from contextmenu / LAY:not in contextmenu (should add) / TopMenuBar: V from Edit menu
#### 処理 aftermath
* [SEL] paste to (0,0) as a movingbuffer | (should) as same as Other:Image
* [LAY] paste layer in above of active layer. | (should) as same as Other:Image, and if the image size is same as the layer size it should be pasted as layer(with copied image. let's call this "V LAY case"), maybe. or we can put such metadata in clipboard?
* [Other] (should) paste to "position" with suitable object (text/image).

> I'll repeat this "position" should be something like "last referenced position" stored in the editor state.


### CUT (X)
* As far as I know currently it's just COPY (-> DELETE according to type SEL or LAY).


## WHAT'S THE MATTER 何をやらないといかんのか
* Otherからのpasteを受け入れる(現状textはまだできないが他を)
* last referenced positionの保持(まだわからないが割とpessimisticに忘れても構わない。editorstateではなくinteractStore(=閉じたら消える)くらいでも全然いい気がする)
* C/V/Xの履歴管理の明確化(これはマジ。マジだが、SEL/LAYが結局クリップボード上でOther:Imageに変わるように修正するので、最終的にC: Actionなし / V: ImagePoolのAdd(今後textobjectのaddがありうるが)もしくはV LAY caseではlayerのAddだがこれも既存のAction範疇 / X: ここは「消す」ことになる場合はそれをPartial差分で保持。でも正直removeLayerやdeleteInSelectionは既にそれをやっている。)

## SO WHAT 結局どうする
* まずコピーロジックを独自のテキストとかbboxでやった独自形式を吹っ飛ばしてclipboardにもてる画像形式(webpは確か無理だったので現時点でもpng変換はされている)「のみ」に絞る。マジで純粋な画像でOK。だいぶコードは楽になるはず(getBufferPointer/getPartialBufferのpng変換だけで済むはず)。✅済み。
* それができたらlast referenced positionの実装。でも正直ここはとりあえずデフォルト(0,0)固定でもいい。あとからどうとでもなる。✅意味を明確にするためplacementPositionとした。とりあえずpointerのtoolのupdownとコピー貼り付け時の座標で更新。貼り付け位置の想定が合っていることを確認済み。
* その後、Vの実装。SEL/LAYはimage/pngであることがわかっているが、URLやその他怪奇なる形式が張り付けられうるOtherのケースを少し考える必要はある。でも最終の処理はimagepoolかlayerlistへのaddに帰着するので、バッファにさえ変換してしまえばあとは楽なはず。履歴もinsertEntryとかaddLayerToがやってくれるので、多分ClipboardListener内でどうこうやることはない気がする。✅本当にそう(readImageしてinsertEntryするだけ)だった。tauriのapiをつかったところ複数貼り付けがそもそもできないっぽい(先頭のが出てくるか、それともHTMLで来るか)。それならそれで単数画像のみ対応で全く問題ないと思う。
* サイド作業として、TopMenuBarのFiles.メニューにfrom clipboardを追加し、ImageがVで読み込めそうなら"それを初期レイヤーとして"新規プロジェクトを開く。これは画像"ファイル"のインポートとパスが似ているのでイケると思うが、「ImageがVで読み込めそうなら」の部分が二重実装にならないようにClipboardListenerと別にClipboardUtilsを設けてtryGetImageFromClipboardみたいなの置くのがベターか。✅済み。

# できた
* ↑の✅項目部分
* CUT(X)の履歴処理の整合性...OK
* 複数貼り付けの諦め...OK
* 旧フォーマット完全削除(ヤッピー)

# まだ
* 画像URLの貼り付けによる処理(これ普通のエディタはやるんだろうか。でもtryget...関数があるからまあmimeの検証さえすればよさげ。)
* V LAY ケースの実装。これめんどくさいわね。。。でもやってて思ったのは普通にsizeがレイヤーと一致してさえいればVLAYケースでもいいだろうということ。Layer->Imageへの変換さえ実装すれば(=全域選択でconvertSelectionToImageするのと同じ操作)、レイヤーでない画像の貼り付け操作で偶然サイズ一致があった場合でもひと手間で想定するadd image動作と変わらない結果にできる。
* 全体の未使用部分やメモリ検討。
* 細かい見落としの確認。