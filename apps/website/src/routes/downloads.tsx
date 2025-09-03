import DownloadSection from '~/components/DownloadSection';
import { heroHeading, pageRoot, scrollContent } from '~/styles/page.css';

export function Downloads() {
  return (
    <main class={pageRoot}>
      <div class={scrollContent}>
        <p class={heroHeading}>DOWNLOADS.</p>
        <DownloadSection />
      </div>
    </main>
  );
}
