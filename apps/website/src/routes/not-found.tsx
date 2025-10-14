import { type Component } from 'solid-js';
import { heroHeading, pageRoot, scrollContent, subHeading } from '~/styles';

export const NotFound: Component = () => {
  return (
    <main class={pageRoot}>
      <div class={scrollContent}>
        <p class={heroHeading}>OOPS!</p>
        <p class={subHeading}>The page you are looking for doesn’t exist.</p>
      </div>
    </main>
  );
};

export default NotFound;
