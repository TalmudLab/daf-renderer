import pkg from './package.json';
import postcss from 'rollup-plugin-postcss';
export default [
  // browser-friendly UMD build
  {
    input: 'src/renderer.js',
    output: [{
      name: 'dafRenderer',
      file: pkg.browser,
      format: 'umd'
    },
    { file: pkg.module, format: 'es' }],
    plugins: [
      postcss({
        modules: true,
        plugins: []
      })
    ]
  },
];
