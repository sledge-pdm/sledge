import { flexCol } from '@sledge/core';
import { Component } from 'solid-js';
import GaussianBlur from '~/components/section/effects/items/GaussianBlur';
import GrayScale from '~/components/section/effects/items/GrayScale';

const Effects: Component = () => {
  return (
    <div class={flexCol} style={{ 'margin-top': '16px', gap: '16px' }}>
      <GrayScale />
      <GaussianBlur />
    </div>
  );
};

export default Effects;
