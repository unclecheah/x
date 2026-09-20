import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		port: 3000,         // Dev server port
		open: true,         // Open browser automatically when you run dev
		proxy: {
			'/api/':	{ target: 'http://localhost:8080' },
			'/data/':	{ target: 'http://localhost:8081',
						  rewrite: (path) => path.replace (/^\/data/, '')
						}
		},
	},
});
