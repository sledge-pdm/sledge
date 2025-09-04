import { vars } from '@sledge/theme';
import { Component } from 'solid-js';
import GaussianBlur from '~/components/section/effects/items/GaussianBlur';
import GrayScale from '~/components/section/effects/items/GrayScale';
import Invert from '~/components/section/effects/items/Invert';
import { activeLayer } from '~/controllers/layer/LayerListController';

const Effects: Component = () => {
  return (
    <>
      <p>
        Effect will be applied to <span style={{ color: vars.color.active }}>{activeLayer().name}</span>.
      </p>
      <Invert />
      <GrayScale />
      <GaussianBlur />
    </>
  );
};

export default Effects;
