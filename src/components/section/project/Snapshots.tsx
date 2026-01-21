import { Component, createEffect, createMemo, createSignal, For, Show } from 'solid-js';

import { css } from '@acab/ecsstatic';
import { clsx, getProjectAdapter, gzipInflate, ProjectAdapter, toUint8ClampedArray } from '@sledge-pdm/core';
import { Icon } from '@sledge-pdm/ui';
import AutoSnapshot from '~/components/section/project/item/AutoSnapshot';
import SectionItem from '~/components/section/SectionItem';
import { logSystemWarn } from '~/features/log';
import { deleteSnapshot, loadSnapshot, ProjectSnapshot, registerCurrentProjectSnapshot, RuntimeProjectSnapshot } from '~/features/snapshot';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { enabledButton, errorButton } from '~/styles/styles';
import { useTimeAgoText } from '~/utils/TimeUtils';
import { sectionContent } from '../SectionStyles';

const snapshotSectionContent = css`
  margin-top: 12px;
  gap: 8px;
`;
const settingsContainer = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: start;
`;
const buttonsContainer = css`
  display: flex;
  flex-direction: row;
  gap: 8px;
  justify-content: end;
  margin-top: 8px;
`;
const snapshotsContainer = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
const noSnapshotsText = css`
  color: var(--color-muted);
  align-self: center;
  margin: 8px 0;
`;

const Snapshots: Component = () => {
  const [backupBeforeRestore, setBackupBeforeRestore] = createSignal(false);

  const sortedSnapshots = createMemo(() => projectStore.snapshots.toSorted((a, b) => b.createdAt - a.createdAt));

  return (
    <SectionItem title='snapshots.'>
      <div class={clsx(sectionContent, snapshotSectionContent)}>
        <div class={settingsContainer}>
          <AutoSnapshot />
          {/* <ToggleSwitch
            checked={backupBeforeRestore()}
            onChange={(v) => {
              setBackupBeforeRestore(v);
            }}
            labelMode='right'
          >
            backup before restore.
          </ToggleSwitch> */}
        </div>
        <div class={buttonsContainer}>
          <button
            class={enabledButton}
            onClick={async () => {
              await registerCurrentProjectSnapshot();
            }}
            title='save current project snapshot.'
          >
            + save.
          </button>
        </div>

        <div class={snapshotsContainer}>
          <Show when={projectStore.snapshots.length > 0} fallback={<p class={noSnapshotsText}>[ no snapshots ]</p>}>
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
const agoText = css`
  opacity: 0.75;
  white-space: nowrap;
  margin-right: 8px;
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
  background-image: url(/assets/patterns/CheckerboardPattern.svg);
  background-size: 16px 16px;
  background-position:
    0 0,
    8px 8px;
  margin: 8px 0;
  align-self: end;
  image-rendering: pixelated;
`;
const itemButtonContainer = css`
  display: flex;
  flex-direction: row;
  justify-content: right;
  gap: 8px;
`;

const SnapshotItem: Component<{ snapshot: ProjectSnapshot | RuntimeProjectSnapshot; onRestore?: () => void; onDelete?: () => void }> = (props) => {
  const { thumbnail, ...snapshot } = props.snapshot;

  const [expanded, setExpanded] = createSignal(false);

  let canvasRef: HTMLCanvasElement;

  const loadThumbnail = () => {
    if (canvasRef && thumbnail) {
      const { packedBuffer, width, height } = thumbnail;
      const rawBuffer = toUint8ClampedArray(gzipInflate(packedBuffer)) as Uint8ClampedArray<ArrayBuffer>;
      const ctx = canvasRef.getContext('2d') as CanvasRenderingContext2D;
      if (ctx) {
        ctx.putImageData(new ImageData(rawBuffer, width, height), 0, 0);
        const tr = height / width;
        canvasRef.style.height = `${canvasRef.clientWidth * tr}px`;
      }
    }
  };

  const unloadThumbnail = () => {
    if (canvasRef && thumbnail) {
      const ctx = canvasRef.getContext('2d') as CanvasRenderingContext2D;
      if (ctx) {
        const { width, height } = thumbnail;
        ctx.clearRect(0, 0, width, height);
      }
    }
  };

  createEffect(() => {
    if (expanded()) loadThumbnail();
    else unloadThumbnail();
  });

  const createdAt = new Date(snapshot.createdAt);
  const { saveTimeText, updatePastTimeStamp } = useTimeAgoText(snapshot.createdAt);

  const [optionalAdapter, setOptionalAdapter] = createSignal<ProjectAdapter<any> | undefined>(undefined);

  createEffect(() => {
    if (expanded() && snapshot.project) {
      try {
        const adapter = getProjectAdapter(snapshot.project);
        setOptionalAdapter(adapter);
      } catch (e) {
        logSystemWarn(`failed to load snapshot project data in ${snapshot.id} although it's defined.`);
      }
    }
  });

  return (
    <div class={itemRoot}>
      <div
        class={itemHeader}
        onClick={() => {
          setExpanded(!expanded());
        }}
      >
        <p class={itemName}>{snapshot.name}</p>
        <p class={agoText}>{saveTimeText()}</p>

        <div
          style={{
            height: 'fit-content',
            transform: expanded() ? 'none' : 'rotate(180deg)',
          }}
        >
          <Icon src={'/assets/icons/misc/triangle_7.png'} base={7} />
        </div>
      </div>

      <Show when={expanded()}>
        <div class={itemContent}>
          <p class={itemDescription}>{snapshot.description ?? '[ no description ]'}</p>
          <p class={itemDescription}>
            {createdAt.toLocaleDateString()} {createdAt.toLocaleTimeString()}
          </p>
          <Show when={optionalAdapter() !== undefined}>
            <p class={itemDescription}>
              {optionalAdapter()?.getCanvasInfo().size.width}x{optionalAdapter()?.getCanvasInfo().size.height}
            </p>
          </Show>
          <Show when={thumbnail}>
            <canvas id={snapshot.id} class={thumbCanvas} ref={(ref) => (canvasRef = ref)} width={thumbnail!.width} height={thumbnail!.height} />
          </Show>

          <div class={itemButtonContainer}>
            <button onClick={props.onRestore}>restore.</button>
            <button class={errorButton} onClick={props.onDelete}>
              delete.
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default Snapshots;
