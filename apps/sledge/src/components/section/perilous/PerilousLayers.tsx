import { flexRow } from '@sledge/core';
import { vars, ZFB09 } from '@sledge/theme';
import { Button, Icon } from '@sledge/ui';
import { Component } from 'solid-js';
import { confirmOperation } from '~/components/section/perilous/PerilousOperation';
import SectionItem from '~/components/section/SectionItem';
import { resetAllLayers } from '~/controllers/layer/LayerListController';
import { sectionContent, sectionRoot } from '~/styles/section/section_item.css';

const RESET_ALL_MSG = 'Sure to RESET ALL LAYERS?';
const PerilousLayers: Component = () => {
  return (
    <div class={sectionRoot}>
      <div class={flexRow} style={{ 'align-items': 'center', gap: '8px', 'margin-bottom': '6px' }}>
        <Icon src={'/icons/misc/danger_11.png'} color={vars.color.error} base={11} scale={2} />
        <p style={{ color: vars.color.error, 'font-size': '24px' }}>DANGER!!</p>
      </div>
      <p style={{ color: vars.color.error, 'font-size': '8px', 'margin-bottom': '28px' }}>these operations may destroy your layer/project.</p>

      <SectionItem title='layer.'>
        <div class={sectionContent} style={{ 'margin-top': '8px', 'padding-left': '8px', gap: '6px' }}>
          <div
            class={flexRow}
            style={{
              'margin-left': '4px',
            }}
          >
            <Button
              style={{
                'border-color': vars.color.error,
                padding: '4px 8px 3px 8px',
                'font-family': ZFB09,
                color: vars.color.error,
              }}
              hoverContent='!!!!!!!!!!!!!'
              onClick={() => {
                confirmOperation(RESET_ALL_MSG, resetAllLayers);
              }}
            >
              RESET ALL LAYERS.
            </Button>
          </div>
        </div>
      </SectionItem>
    </div>
  );
};

export default PerilousLayers;
