/// <reference types="react" />

declare namespace React.JSX {
  interface IntrinsicElements {
    'altcha-widget': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      challengeurl?: string;
      auto?: string;
      hidelogo?: boolean;
      hidefooter?: boolean;
    }, HTMLElement>;
  }
}
