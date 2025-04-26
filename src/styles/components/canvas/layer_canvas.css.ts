import { recipe } from '@vanilla-extract/recipes';

export const layerCanvas = recipe({
  base: {
    pointerEvents: 'none',
    position: 'absolute',
  },

  variants: {
    rendering: {
      auto: {
        imageRendering: 'auto',
      },
      pixelated: {
        imageRendering: 'pixelated',
      },
      crispEdges: {
        imageRendering: 'crisp-edges',
      },
    },
    hidden: {
      true: {
        opacity: 0,
        pointerEvents: 'auto',
      },
    },
  },

  defaultVariants: {
    rendering: 'auto',
    hidden: false,
  },
});
