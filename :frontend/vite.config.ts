// // // import { defineConfig } from "vitest/config"
// // // import react from "@vitejs/plugin-react"
// // // import svgr from 'vite-plugin-svgr';

// // // // https://vitejs.dev/config/
// // // export default defineConfig({
// // //   plugins: [react(), svgr()],
// // //   server: {
// // //     open: true,
// // //     proxy: {
// // //       "/api": "http://pulsar.imsi.athenarc.gr:9680",
// // //     },
// // //   },
// // //   test: {
// // //     globals: true,
// // //     environment: "jsdom",
// // //     setupFiles: "src/setupTests",
// // //     mockReset: true,
// // //   },
// // // })


// // export default {
// //   build: {
// //       rollupOptions: {
// //           output: {
// //               manualChunks: {
// //                   vendor: ['react', 'react-dom'],
// //               },
// //           },
// //       },
// //   },
// // };


// export default {
//   server: {
//       port: 5173,
//   },
// };

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    hmr: {
      overlay: false, // Prevents the error overlay
    },
  },
});
