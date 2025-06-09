import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';

export default defineConfig({
	plugins: [TanStackRouterVite({ target: 'react', autoCodeSplitting: true }), react(), tailwindcss()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'@/components': path.resolve(__dirname, './src/components'),
			'@/lib': path.resolve(__dirname, './src/lib'),
		},
	},
});
