import DownloadSection from '~/components/DownloadSection';
import { heroHeading, pageRoot, scrollContent } from '~/styles/page.css';

export function Download() {
  return (
    <main class={pageRoot}>
      <div class={scrollContent}>
        <p class={heroHeading}>DOWNLOAD.</p>
        <DownloadSection />
      </div>
    </main>
  );
}
