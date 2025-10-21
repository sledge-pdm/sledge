import { Accessor, createSignal, onCleanup } from 'solid-js';

export const getTimeAgoText = (pastTimestamp?: number) => {
  if (!pastTimestamp) return '';
  const now = Date.now();

  const seconds = Math.floor((now - pastTimestamp) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) {
    return Math.floor(interval) + ' years ago';
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + ' months ago';
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + ' days ago';
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + ' hours ago';
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval / 10) * 10 + ' min ago';
  }
  if (seconds < 10) {
    return 'just now';
  }
  return Math.floor(seconds / 10) * 10 + ' sec ago';
};

export function useTimeAgoText(
  pastTimestamp?: number,
  options?: {
    interval: number;
  }
): Accessor<string> {
  const { interval = 1000 } = options || {};
  const [time, setTime] = createSignal<string>(getTimeAgoText(pastTimestamp));

  const intervalId = setInterval(() => {
    setTime(getTimeAgoText(pastTimestamp));
  }, interval);

  onCleanup(() => {
    clearInterval(intervalId);
  });

  return time;
}
