import pkg from './package.json';
import postcss from 'rollup-plugin-postcss';
import {terser} from "rollup-plugin-terser";
export default [
  // browser-friendly UMD build
  {
    input: 'src/renderer.js',
    output: [
    {
      name: 'dafRenderer',
      file: pkg.browser,
      format: 'umd'
    },
    {
      file: pkg.module,
      format: 'es'
    },
    {
      name: "dafRenderer",
      file: "dist/daf-renderer.min.js",
      format: "umd",
      plugins: [terser()]
    }
    ],
    plugins: [
      postcss({
        modules: true,
        plugins: []
      })
    ]
  },
];
