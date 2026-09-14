import { css } from '@acab/ecsstatic';
import { LoadingBar, ModalDialog } from '@sledge-pdm/ui';
import { Component, createMemo, Show } from 'solid-js';
import { busyStore } from '~/features/busy';

const dialogBox = css`
  max-width: min(320px, 80vw);
`;

const contentRoot = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  /* nothing in here is interactive, and a drag over the dialog must not select its text either. */
  user-select: none;
  cursor: default;
`;

const labelText = css`
  color: var(--color-on-background);
  white-space: nowrap;
`;

const detailText = css`
  color: var(--color-muted);
  white-space: nowrap;
  font-family: ZFB03;
`;

/**
 * @description what the editor shows while an operation has it to itself.
 *
 *   it is scoped to the editor pane it is placed in, so the title bar stays usable - disabling what is up
 *   there is the title bar's own job. an operation that begins behind a native dialog raises this only once
 *   that dialog is answered, which is why it follows `dialogVisible` rather than `operation`.
 */
const BusyDialog: Component = () => {
  const progress = () => busyStore.progress;

  /** @description a save names the stretch it is in; a count is only worth showing when there is one. */
  const detail = createMemo(() => {
    const current = progress();
    if (!current) return undefined;
    return current.total > 1 ? `${current.phase} ${current.done}/${current.total}` : current.phase;
  });

  const ratio = createMemo(() => {
    const current = progress();
    if (!current || current.total <= 0) return undefined;
    return current.done / current.total;
  });

  return (
    <ModalDialog open={busyStore.dialogVisible} class={dialogBox}>
      <div class={contentRoot}>
        <p class={labelText}>{busyStore.label}</p>
        <Show when={detail()}>{(text) => <p class={detailText}>{text()}</p>}</Show>
        <LoadingBar value={ratio()} />
      </div>
    </ModalDialog>
  );
};

export default BusyDialog;
