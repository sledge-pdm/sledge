import { Component } from 'solid-js';
import ConfigForm from '~/components/config/ConfigForm';
import { settingDialogRoot } from '~/styles/dialogs/setting_dialog.css';
import { Dialog, DialogExternalProps } from './Dialog';

export interface ExportImageProps extends DialogExternalProps {
  onSaved?: () => void;
}

const SettingDialog: Component<ExportImageProps> = (props) => {
  const close = () => {
    props.onClose();
  };

  return (
    <Dialog open={props.open} onClose={props.onClose} title={'settings'} closeByOutsideClick={false} leftButtons={[]} rightButtons={[]}>
      <div class={settingDialogRoot}>
        <ConfigForm onClose={() => close()} />
      </div>
    </Dialog>
  );
};
export default SettingDialog;
