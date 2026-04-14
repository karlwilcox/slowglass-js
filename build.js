// build.js
import esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['src/main.js'],
  bundle: true,
  minify: true,
  sourcemap: true,
  outfile: 'dist/bundle.js',
  target: ['es2018'],
}).catch(() => process.exit(1));