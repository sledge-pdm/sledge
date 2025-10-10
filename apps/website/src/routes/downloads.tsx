import DownloadSection from '~/components/DownloadSection';
import { heroHeading, pageRoot, scrollContent } from '~/styles';

export function Download() {
  return (
    <main class={pageRoot}>
      <div class={scrollContent}>
        <p class={heroHeading}>GET SLEDGE.</p>
        <DownloadSection />
      </div>
    </main>
  );
}
