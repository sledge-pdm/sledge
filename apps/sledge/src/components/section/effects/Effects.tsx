import { Component } from 'solid-js';
import GaussianBlur from '~/components/section/effects/items/GaussianBlur';
import GrayScale from '~/components/section/effects/items/GrayScale';
import Invert from '~/components/section/effects/items/Invert';

const Effects: Component = () => {
  return (
    <>
      <Invert />
      <GrayScale />
      <GaussianBlur />
    </>
  );
};

export default Effects;
