import { type Component } from 'solid-js';
import { heroHeading, pageRoot, scrollContent } from '~/styles';

export const NotFound: Component = () => {
  return (
    <main class={pageRoot}>
      <div class={scrollContent}>
        <p class={heroHeading}>OOPS!</p>
        <p>The page you are looking for doesn’t exist.</p>
      </div>
    </main>
  );
};

export default NotFound;
