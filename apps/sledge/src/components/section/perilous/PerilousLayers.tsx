import { flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { Button, Icon } from '@sledge/ui';
import { Component } from 'solid-js';
import { confirmOperation } from '~/components/section/perilous/PerilousOperation';
import { resetAllLayers } from '~/controllers/layer/LayerListController';
import { sectionCaption, sectionContent, sectionRoot } from '~/styles/section/section_item.css';

const RESET_ALL_MSG = 'Sure to RESET ALL LAYERS?';
const PerilousLayers: Component = () => {
  return (
    <div class={sectionRoot}>
      <div class={flexRow} style={{ 'align-items': 'center', gap: '8px', 'margin-bottom': '6px' }}>
        <Icon src={'/icons/misc/danger_11.png'} color={vars.color.error} base={11} scale={2} />
        <p style={{ color: vars.color.error, 'font-size': '24px' }}>DANGER!!</p>
      </div>
      <p style={{ color: vars.color.error, 'font-size': '8px', 'margin-bottom': '16px' }}>these operations may destroy your layer/project.</p>
      <p class={sectionCaption}>Layers.</p>
      <div class={sectionContent} style={{ 'padding-left': '8px', gap: '6px' }}>
        <Button
          style={{
            'border-color': vars.color.error,
            padding: '4px 8px',
            color: vars.color.error,
            'font-size': '16px',
          }}
          hoverContent='!!!!!!!!!!!!!'
          onClick={() => {
            confirmOperation(RESET_ALL_MSG, resetAllLayers);
          }}
        >
          RESET ALL LAYERS
        </Button>
      </div>
    </div>
  );
};

export default PerilousLayers;
