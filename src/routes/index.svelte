<script context="module" lang="ts">
	/** @type {import('./__types/[slug]').Load} */
	export async function load({ params, fetch, session, stuff }) {
		const response = await fetch('/tiles/okdb.json');
		// console.log('Response:', response, 'OK?', response.ok);
		// const response = { status: 200, ok: false };
		return {
			props: {
				status: response.status,
				databaseIsOK: response.ok
			}
		};
	}
</script>

<script lang="ts">
	import MapLibre from '../Components/MapLibre.svelte';
	export let databaseIsOK = true;
	export let status = 0;
	console.log('Database is:', databaseIsOK ? 'OK' : 'Not OK');
</script>

{#if databaseIsOK}
	<MapLibre />
{:else}
	<h1>Error: Did you forget to copy the tile file?</h1>
	<p>The tile file should be copied or linked to tile_data/planet.mbtiles.</p>
	<p>This error indicates the backend's tile server could not find the database file.</p>
{/if}
