import { Component, createMemo, createSignal, For, onMount, Show } from 'solid-js';

import { css } from '@acab/ecsstatic';
import { webpToRaw } from '@sledge/anvil';
import { clsx } from '@sledge/core';
import { Icon, ToggleSwitch } from '@sledge/ui';
import SectionItem from '~/components/section/SectionItem';
import { deleteSnapshot, loadSnapshot, registerCurrentAsSnapshot } from '~/features/snapshot';
import { ProjectSnapshot } from '~/stores/editor/SnapshotStore';
import { snapshotStore } from '~/stores/EditorStores';
import { errorButton } from '~/styles/styles';
import { sectionContent } from '../SectionStyles';

const snapshotSectionContent = css`
  padding-left: 4px;
  gap: 8px;
`;
const settingsContainer = css`
  display: flex;
  flex-direction: row;
  gap: 8px;
  margin-left: 4px;
  justify-content: start;
`;
const buttonsContainer = css`
  display: flex;
  flex-direction: row;
  gap: 8px;
  justify-content: end;
`;
const snapshotsContainer = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
`;
const noSnapshotsText = css`
  color: var(--color-muted);
  align-self: center;
  margin: 8px 0;
`;

const Snapshots: Component = () => {
  const [backupBeforeRestore, setBackupBeforeRestore] = createSignal(false);

  // ソート処理をメモ化してパフォーマンス向上
  const sortedSnapshots = createMemo(() => snapshotStore.snapshots.toSorted((a, b) => b.createdAt - a.createdAt));

  return (
    <SectionItem title='snapshots.'>
      <div class={clsx(sectionContent, snapshotSectionContent)}>
        <div class={settingsContainer}>
          <ToggleSwitch
            checked={backupBeforeRestore()}
            onChange={(v) => {
              setBackupBeforeRestore(v);
            }}
            labelMode='right'
          >
            backup before restore.
          </ToggleSwitch>
        </div>
        <div class={buttonsContainer}>
          <button
            onClick={async () => {
              await registerCurrentAsSnapshot();
            }}
          >
            + add.
          </button>
        </div>

        <div class={snapshotsContainer}>
          <Show when={snapshotStore.snapshots.length > 0} fallback={<p class={noSnapshotsText}>[ no snapshots ]</p>}>
            <For each={sortedSnapshots()}>
              {(snapshot) => {
                return (
                  <SnapshotItem
                    snapshot={snapshot}
                    onRestore={async () => {
                      await loadSnapshot(snapshot, {
                        backup: backupBeforeRestore(),
                      });
                    }}
                    onDelete={async () => {
                      await deleteSnapshot(snapshot);
                    }}
                  />
                );
              }}
            </For>
          </Show>
        </div>
      </div>
    </SectionItem>
  );
};

const itemRoot = css`
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-secondary);
`;
const itemHeader = css`
  display: flex;
  flex-direction: row;
  width: 100%;
  padding: 6px 10px;
  align-items: center;
  cursor: pointer;
  background-color: var(--color-button-bg);
  &:hover {
    background-color: var(--color-button-hover);
  }
  &:hover > p {
    color: var(--color-active);
  }
`;
const itemName = css`
  font-family: ZFB21;
  text-transform: uppercase;
  margin-right: auto;
`;
const itemContent = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 12px 12px 12px;
`;
const itemDescription = css`
  color: var(--color-muted);
`;
const thumbCanvas = css`
  width: 150px;
  border: 1px solid var(--color-canvas-border);
  transform-origin: 0 0;
  background-color: var(--color-canvas);
  background-image: url(/patterns/CheckerboardPattern.svg);
  background-size: 16px 16px;
  background-position:
    0 0,
    8px 8px;
  margin: 8px 0;
  align-self: end;
`;
const itemButtonContainer = css`
  display: flex;
  flex-direction: row;
  justify-content: right;
  gap: 8px;
`;

const SnapshotItem: Component<{ snapshot: ProjectSnapshot; onRestore?: () => void; onDelete?: () => void }> = (props) => {
  const { snapshot } = props;

  const [expanded, setExpanded] = createSignal(false);

  let canvasRef: HTMLCanvasElement;

  onMount(() => {
    updateCanvas();
  });

  const updateCanvas = () => {
    if (canvasRef && snapshot.thumbnail) {
      const { webpBuffer, width, height } = snapshot.thumbnail;
      const rawBuffer = new Uint8ClampedArray(webpToRaw(webpBuffer, width, height).buffer);
      const ctx = canvasRef.getContext('2d') as CanvasRenderingContext2D;
      if (ctx) {
        const imgData = new ImageData(rawBuffer.slice(), width, height);
        ctx.putImageData(imgData, 0, 0);
        const tr = height / width;
        canvasRef.style.height = `${canvasRef.clientWidth * tr}px`;
      }
    }
  };

  const createdAt = new Date(snapshot.createdAt);

  return (
    <div class={itemRoot}>
      <div
        class={itemHeader}
        onClick={() => {
          setExpanded(!expanded());
        }}
      >
        <p class={itemName}>{snapshot.name}</p>
        <div
          style={{
            transform: expanded() ? 'none' : 'rotate(180deg)',
          }}
        >
          <Icon src={'/icons/misc/triangle_7.png'} base={7} />
        </div>
      </div>

      <div
        style={{
          visibility: expanded() ? 'visible' : 'collapse',
          height: expanded() ? 'auto' : 0,
        }}
      >
        <div class={itemContent}>
          <p class={itemDescription}>{snapshot.description ?? '[ no description ]'}</p>
          <p class={itemDescription}>
            {createdAt.toLocaleDateString()} {createdAt.toLocaleTimeString()}
          </p>
          <Show when={snapshot.thumbnail}>
            <canvas
              id={snapshot.id}
              class={thumbCanvas}
              ref={(ref) => (canvasRef = ref)}
              width={snapshot.thumbnail!.width}
              height={snapshot.thumbnail!.height}
            />
          </Show>

          <div class={itemButtonContainer}>
            <button onClick={props.onRestore}>restore.</button>
            <button class={errorButton} onClick={props.onDelete}>
              delete.
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Snapshots;
