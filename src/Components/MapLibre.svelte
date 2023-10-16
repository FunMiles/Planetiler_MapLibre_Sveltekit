<script context="module" lang="ts">
	import maplibre from 'maplibre-gl';
	import { page } from '$app/stores';
	import tileDatabase from '$lib/tile_database';

	if (browser) {
		tileDatabase?.on('ready', () => {
			maplibre.addProtocol('custom', (params, callback) => {
				const filePath = params.url.split('://')[1];
				const arg = params.url.match(/\/([0-9]+)\/([0-9]+)\/([0-9]+)\.pbf/);
				if (arg?.length != 4) return callback(new Error(`Tile fetch error: bad params`));
				const z = parseInt(arg[1]);
				const x = parseInt(arg[2]);
				const y = parseInt(arg[3]);

				const dxres = tileDatabase.mapTiles
					.where('[z+x+y]')
					.equals([z, x, y])
					.toArray()
					.then((e) => {
						if (e.length == 1) {
							callback(null, e[0].data, null, null);
						} else callback(new Error(e));
					})
					.catch('NotFoundError', (e) => callback(new Error(e)));
				return { cancel: () => {} };
			});
		});
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';

	import { Map } from 'maplibre-gl';
	import { browser } from '$app/environment';
	import { base } from '$app/paths';

	export let lat = 40;
	export let lon = -105.18;
	export let zoom = 9;

	$: if (map) {
		map.flyTo({ center: [lon, lat], zoom: zoom, essential: true });
	}
	// const { Map /*GeolocateControl */ } = maplibre;

	let container: HTMLDivElement;
	let map: Map;

	onMount(async () => {
		console.log('Base path', base);
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
			maxZoom: 2,
			// maxTileCacheSize: 5000,
			refreshExpiredTiles: false
		});
	});
</script>

<svelte:head>
	<link rel="stylesheet" href="https://cdn.skypack.dev/maplibre-gl/dist/maplibre-gl.css" />
</svelte:head>

<div class="mapContainer" bind:this={container} />

<style>
	div {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 100%;
	}
</style>
