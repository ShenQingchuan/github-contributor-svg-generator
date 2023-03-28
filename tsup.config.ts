import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./src/*'],
  format: ['esm'],
  target: 'node16',
  outDir: "./lib",
  clean: true,
  dts: false,
  splitting: false,
})