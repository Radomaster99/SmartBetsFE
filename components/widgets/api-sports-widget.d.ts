import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      'api-sports-widget': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        [key: `data-${string}`]: string | number | boolean | undefined;
      };
    }
  }
}
