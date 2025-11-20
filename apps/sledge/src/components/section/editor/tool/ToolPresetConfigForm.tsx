import { css } from '@acab/ecsstatic';
import { ConfigFieldRenderer } from '@sledge/ui';
import { Component, createEffect, createMemo, createSignal, For, onMount, Show } from 'solid-js';
import { logSystemInfo } from '~/features/log/service';
import { getPresetMetaByToolId } from '~/features/tools/presets';
import { ToolCategoryId } from '~/features/tools/Tools';
import { toolStore } from '~/stores/EditorStores';
import { flexCol, flexRow } from '~/styles/styles';
import { eventBus } from '~/utils/EventBus';

const label = css`
  font-family: ZFB09;
  vertical-align: middle;
  margin-bottom: -1px;
  text-align: left;
  margin-right: 8px;
`;

interface Props {
  toolId: ToolCategoryId;
  onConfigChange: (key: string, value: any) => void;
}

const ToolPresetConfigForm: Component<Props> = (props) => {
  const presets = createMemo(() => toolStore.tools[props.toolId].presets);
  const [options, setOptions] = createSignal(presets()?.selected ? presets()!.options[presets()!.selected] : undefined);
  const [presetMeta, setPresetMeta] = createSignal(getPresetMetaByToolId(props.toolId));

  if (!presetMeta() || !presets()) {
    return null;
  }

  onMount(() => {
    eventBus.on('tools:presetLoaded', (e) => {
      if (props.toolId === e.toolId) {
        logSystemInfo('loaded preset for tool', { label: 'ToolPresetConfig', details: [props.toolId], debugOnly: true });
        setPresetMeta(getPresetMetaByToolId(props.toolId));
        setOptions(presets()?.selected ? presets()!.options[presets()!.selected] : undefined);
      }
    });
  });

  createEffect(() => {
    setPresetMeta(getPresetMetaByToolId(props.toolId));
    setOptions(presets()?.selected ? presets()!.options[presets()!.selected] : undefined);
  });

  return (
    <div class={flexCol} style={{ gap: '4px' }}>
      <For each={presetMeta()?.fields}>
        {(fieldMeta) => {
          if (fieldMeta.condition) {
            const condition = fieldMeta.condition();
            if (!condition) return null;
          }

          const optionsValue = options();
          const value = () => optionsValue[fieldMeta.key as keyof typeof optionsValue] ?? '';
          const onChange = (newValue: any) => {
            props.onConfigChange(fieldMeta.key as string, newValue);
          };

          return (
            <div
              class={flexRow}
              style={{ width: '100%', 'min-height': fieldMeta.component !== 'Custom' ? '24px' : undefined, 'align-items': 'center' }}
            >
              <Show when={fieldMeta.label}>
                <div class={flexRow} style={{ width: '80px' }}>
                  <label class={label} for={fieldMeta.key}>
                    {fieldMeta.label}
                  </label>
                </div>
              </Show>
              <div class={flexRow} style={{ 'flex-grow': 1, 'justify-content': 'end' }}>
                <ConfigFieldRenderer field={fieldMeta as any} value={value} onChange={onChange} />
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
};

export default ToolPresetConfigForm;
