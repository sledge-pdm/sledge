import { css } from '@acab/ecsstatic';
import { Button, Icon } from '@sledge/ui';
import { Component } from 'solid-js';
import { confirmOperation } from '~/components/section/perilous/PerilousOperation';
import SectionItem from '~/components/section/SectionItem';
import { resetAllLayers } from '~/features/layer';
import { reportAppStartupError } from '~/utils/WindowUtils';
import { sectionContent, sectionRoot } from '../SectionStyles';

const dangerHeaderStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
`;

const dangerTitleStyle = css`
  color: var(--color-error);
  font-size: 24px;
`;

const dangerDescriptionStyle = css`
  color: var(--color-error);
  font-size: 8px;
  margin-bottom: 28px;
`;

const layerContentStyle = css`
  margin-top: 8px;
  padding-left: 8px;
  gap: 6px;
`;

const resetButtonContainerStyle = css`
  display: flex;
  margin-left: 4px;
`;

const resetButtonStyle = css`
  border-color: var(--color-error);
  padding: 4px 8px 3px 8px;
  font-family: ZFB09;
  color: var(--color-error);
`;

const RESET_ALL_MSG = 'Sure to RESET ALL LAYERS?';
const REPORT_FATAL_ERROR_MSG = 'Sure to REPORT FATAL ERROR and KILL PROCESS IMMEDIATELY?';

const PerilousLayers: Component = () => {
  return (
    <div class={sectionRoot}>
      <div class={dangerHeaderStyle}>
        <Icon src={'/icons/misc/danger_11.png'} color={'var(--color-error)'} base={11} scale={2} />
        <p class={dangerTitleStyle}>DANGER!!</p>
      </div>
      <p class={dangerDescriptionStyle}>these operations may destroy your project. use them carefully!</p>

      <SectionItem title='layer.'>
        <div class={`${sectionContent} ${layerContentStyle}`}>
          <div class={resetButtonContainerStyle}>
            <Button
              class={resetButtonStyle}
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
      {import.meta.env.DEV && (
        <SectionItem title='error.'>
          <div class={`${sectionContent} ${layerContentStyle}`}>
            <div class={resetButtonContainerStyle}>
              <Button
                class={resetButtonStyle}
                hoverContent='!!!!!!!!!!!!!'
                onClick={() => {
                  confirmOperation(REPORT_FATAL_ERROR_MSG, () => {
                    reportAppStartupError('FAKE FATAL ERROR!');
                  });
                }}
              >
                REPORT FAKE FATAL ERROR.
              </Button>
            </div>
          </div>
        </SectionItem>
      )}
    </div>
  );
};

export default PerilousLayers;
