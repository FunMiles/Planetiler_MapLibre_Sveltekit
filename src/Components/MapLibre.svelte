<script context="module" lang="ts">
	import maplibre from 'maplibre-gl';
	import { page } from '$app/stores';

	import { PMTiles } from '$lib/pmtiles/pmtiles';

	const filePath = 'source.pmtiles';
	const pmSource = browser ? new DBFetchSource(filePath) : null;

	const pmTiles = new PMTiles(browser ? pmSource : filePath);

	if (browser) {
		maplibre.addProtocol('custom', (params, callback) => {
			const filePath = params.url.split('://')[1];
			const arg = params.url.match(/\/([0-9]+)\/([0-9]+)\/([0-9]+)\.pbf/);
			if (arg?.length != 4) return callback(new Error(`Tile fetch error: bad params`));
			const z = parseInt(arg[1]);
			const x = parseInt(arg[2]);
			const y = parseInt(arg[3]);
			const pmres = pmTiles.getZxy(z, x, y).then((t) => {
				if (t) {
					callback(null, t.data, null, null);
				} else {
					console.log(`Didn't get ${z}, ${x}, ${y}`);
					callback(null, null, null, null);
				}
			});
			return { cancel: () => {} };
		});
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';

	import { Map } from 'maplibre-gl';
	import { browser } from '$app/environment';
	import { base } from '$app/paths';
	import { DBFetchSource } from '$lib/pmtiles/dbsource';

	export let lat = 40;
	export let lon = -105.18;
	export let zoom = 5;

	$: if (map) {
		map.flyTo({ center: [lon, lat], zoom: zoom, essential: true });
	}
	// const { Map /*GeolocateControl */ } = maplibre;

	let container: HTMLDivElement;
	let map: Map;

	onMount(async () => {
		console.log('Base path', base);
		await pmSource?.fileInfoPromise;
		const style = await (await fetch(`${base}/mystyle.json`)).json();
		// Replace the origin in the template file with the page origin, as it is where the tile endpoint
		// run.
		style.sources.openmaptiles.tiles = style.sources.openmaptiles.tiles.map((s: string) => {
			const customOrigin = `custom://${$page.url.origin.split('://')[1]}`;
			return s.replace('@origin@', customOrigin);
		});

		map = new Map({
			container: container,
			style: style,
			center: [lon, lat],
			// zoom: zoom,
			maxZoom: 6,
			// maxTileCacheSize: 5000,
			refreshExpiredTiles: false
		});
	});
</script>

<svelte:head>
	<link rel="stylesheet" href="https://cdn.skypack.dev/maplibre-gl/dist/maplibre-gl.css" />
</svelte:head>

<div class="mapContainer" bind:this={container} />

{#await pmSource?.fileInfoPromise}
	<div class="waiting">
		<h1>Please Wait</h1>
	</div>
{/await}

<style>
	.mapContainer {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 100%;
	}
	.waiting {
		/* position: absolute;
		top: 50%;
		left: 50%;
		width: 50%;
		transform: translate(-50%, -50%); */

		border: 5px solid;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		padding: 10px;
	}
</style>
