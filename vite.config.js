import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

/** @type {import('vite').UserConfig} */
const config = {
	worker: {
		plugins: [sveltekit()],
		format: 'es',
	},
	plugins: [sveltekit(),
	SvelteKitPWA({
		strategies: 'generateSW',
		registerType: "autoUpdate",
		devOptions: {
			enabled: false,
			suppressWarnings: true,
		},
		manifest: {
			"theme_color": "green",
			icons: [
				{

					"src": "manifest-icon-192.png",
					"sizes": "192x192",
					"type": "image/png",
					"purpose": "maskable any"
				},
				{
					"src": "manifest-icon-512.png",
					"sizes": "512x512",
					"type": "image/png",
					"purpose": "any"
				}
			]
		}
		//   strategies: 'injectManifest',
		//   srcDir: 'src',
		//   filename: 'my-sw.js', // or `my-sw.ts`
		/* other pwa options */
	})]
};

export default config;