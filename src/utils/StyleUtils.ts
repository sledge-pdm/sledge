export const clsx = (...classes: (string | false | null | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};
