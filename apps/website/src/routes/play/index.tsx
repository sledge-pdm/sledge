import { pageRoot, scrollContent } from '~/styles/SharedStyles';

export function Playground() {
  return (
    <main class={pageRoot}>
      <div class={scrollContent}></div>
    </main>
  );
}
