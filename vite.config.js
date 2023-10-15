import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit(),
	SvelteKitPWA({
		strategies: 'generateManifest'
		//   strategies: 'injectManifest',
		//   srcDir: 'src',
		//   filename: 'my-sw.js', // or `my-sw.ts`
		/* other pwa options */
	})]
};

export default config;
