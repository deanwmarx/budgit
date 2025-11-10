import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	resolve: {
		alias: {
			'$comps': path.resolve('./src/lib/components'),
			'$types': path.resolve('./src/lib/types'),
			'$utils': path.resolve('./src/lib/utils')
		}
	}
});
