import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  platform: 'node',
  target: 'node22',
  clean: true,
  // shared is TS source with no build step of its own — bundle it in so the
  // production output has no unresolvable workspace import.
  noExternal: ['@dual-hangman/shared'],
});
