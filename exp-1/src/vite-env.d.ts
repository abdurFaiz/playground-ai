/// <reference types="vite/client" />
import * as React from 'react';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'iconify-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { icon?: string, width?: string, height?: string }, HTMLElement>;
        }
    }
}

declare module 'react' {
    namespace JSX {
        interface IntrinsicElements {
            'iconify-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { icon?: string, width?: string, height?: string }, HTMLElement>;
        }
    }
}
