import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		proxy: {
			'/api/':	{ target: 'http://localhost:8080' },
			'/data/':	{ target: 'http://localhost:8081',
						  rewrite: (path) => path.replace (/^\/data/, '')
						}
		},
	},
});
