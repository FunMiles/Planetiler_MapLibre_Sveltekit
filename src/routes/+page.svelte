<script lang="ts">
	import { onMount, tick } from 'svelte';
	import MapLibre from '../Components/MapLibre.svelte';

	import { browser } from '$app/environment';
	import * as Comlink from 'comlink';
	import DownloadWorker from '$lib/workers/tile_file_download?worker';
	import tileDatabase from '$lib/tile_database';

	let status = 'loading';

	async function workerDownload(url: string) {
		let theWorker = new DownloadWorker();
		const worker = Comlink.wrap(theWorker);
		const success = await worker.download(url);
		console.log('Got', success);
		if (success) status = 'loaded';
		else status = 'error';
		tileDatabase?.downloadStatus.put({ file: url, status: status });
	}
	onMount(async () => {
		if (browser) {
			await tileDatabase?.open().catch(function (e) {
				console.error("Open failed: " + e.stack);
			})
			const file = '/0_2.zip';
			let st = (await tileDatabase?.downloadStatus.where('file').equals(file).first())?.status;
			if (st !== 'loaded') {
				await workerDownload('/0_2.zip');
				st = (await tileDatabase?.downloadStatus.where('file').equals(file).first())?.status;
			}
			status = st || 'unknown';
		}
	});
</script>

{#if status === 'loading'}
	<p>Please wait while loading the map data</p>
{:else if status === 'loaded'}
	<MapLibre />
{:else}
	<h1>Error: Could not load the map data.</h1>
	<p>The tile file should be copied or linked to tile_data/planet.mbtiles.</p>
	<p>This error indicates the backend's tile server could not find the database file.</p>
{/if}
