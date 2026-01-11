// types.d.ts
declare module 'types' {
  export * from './types';
}

// Add this to help with module resolution
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// Add type declarations for other modules if needed
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}
