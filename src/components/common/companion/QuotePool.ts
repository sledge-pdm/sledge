// import { smartSay } from './Companion';

type QuoteCategory = 'color-pick' | 'pen-resize' | 'canvas-resize' | 'undo-spam' | 'random';

const lastSaidIndexes = {
  'color-pick': -1,
  'pen-resize': -1,
  'canvas-resize': -1,
  'undo-spam': -1,
  random: -1,
};
export const quotePool = {
  'color-pick': [
    'That color again? You really love it, huh.',
    'A fine choice, but not the finest.',
    "I see you're going with [color]. Bold.",
  ],
  'pen-resize': [
    'Hmm, Not quite my size.',
    "Go bigger, I'll crash 'em harder.",
    'Have you ever heard of the word "pixel perfect"?',
  ],
  'canvas-resize': ['Shrinking the canvas? Afraid of commitment?', 'Small canvas, big ideas. I like it.'],
  'undo-spam': ['UNDO UNDO UNDO—are you OK?', "That's the 5th undo. I’m getting dizzy."],
  random: ['Daisy, Daisy, give me your answer do do do'],
};

export const sayRandomQuote = (category: QuoteCategory, context?: any) => {
  const quotes = quotePool[category];
  let index = Math.floor(Math.random() * quotes.length);
  // 前になんか言った
  if (lastSaidIndexes[category] != -1) {
    console.log(`I previously said ${lastSaidIndexes[category]}. try saying something new.`);
    if (quotes.length == 1) {
      console.log(`argh. nothing to say.`);
      // もう言えることない
      return '';
    } else {
      // console.log(`how about this?. ${index}`);
      // あるなら抽選続ける
      while (index === lastSaidIndexes[category]) {
        index = Math.floor(Math.random() * quotes.length);
        // console.log(`NO. how about this?. ${index}`);
      }
      console.log(`yeah. ${index} is a brand new. let's say it.`);
    }
  }
  let quote = quotes[index];
  quote = context?.color ? quote.replace('[color]', context.color) : quote;
  // if (smartSay(quote)) {
  //   console.log(`◯ yay!`);
  //   lastSaidIndexes[category] = index;
  // } else {
  //   console.log(`✕ hmm maybe I'd keep silence now?`);
  // }
};
