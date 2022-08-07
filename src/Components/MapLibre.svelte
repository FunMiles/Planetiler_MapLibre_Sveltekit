<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	import { Map } from 'maplibre-gl';

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
		const style = await (await fetch('/mystyle.json')).json();
		// Replace the origin in the template file with the page origin, as it is where the tile endpoint
		// run.
		style.sources.openmaptiles.tiles = style.sources.openmaptiles.tiles.map((s: string) => {
			return s.replace('@origin@', $page.url.origin);
		});

		map = new Map({
			container: container,
			style: style,
			center: [lon, lat],
			zoom: zoom,
			maxZoom: 16,
			maxTileCacheSize: 5000,
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
