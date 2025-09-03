import { pageRoot, scrollContent } from '~/styles/page.css';

export function Playground() {
  return (
    <main class={pageRoot}>
      <div class={scrollContent}></div>
    </main>
  );
}
