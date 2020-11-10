import pkg from './package.json';

export default [
  // browser-friendly UMD build
  {
    input: 'src/renderer.js',
    output: {
      name: 'dafRenderer',
      file: pkg.browser,
      format: 'umd'
    },
    plugins: [
    ]
  },

  // ES module (for bundlers) build.

  {
    input: 'src/renderer.js',
    output: [
      { file: pkg.module, format: 'es' }
    ]
  }
];
