// React 19 JSX namespace augmentation
// See: https://react.dev/blog/2024/04/25/react-19-upgrade-guide
//
// React 19 requires JSX namespace augmentation to be wrapped in `declare module "..."`
// to prevent global type pollution. The module specifier depends on the `jsx` compiler
// option in tsconfig.json:
//
// - "jsx": "react-jsx" → use "react/jsx-runtime"
// - "jsx": "react-jsxdev" → use "react/jsx-dev-runtime"
// - "jsx": "react" or "jsx": "preserve" → use "react"

declare module "react/jsx-runtime" {
  namespace JSX {
    // Extend IntrinsicElements for custom HTML elements if needed
    // interface IntrinsicElements {
    //   "my-custom-element": {
    //     myProp: string;
    //   };
    // }
  }
}

// Re-export to maintain compatibility
export {};
