import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Bind to all interfaces so other devices on the LAN can load the client
    // (Vite prints a "Network:" URL on start). See docs/LOCAL_PLAYTESTING.md.
    host: true,
    port: 5173,
  },
});
