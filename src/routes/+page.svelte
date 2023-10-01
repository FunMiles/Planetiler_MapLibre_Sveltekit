<script lang="ts">
	import MapLibre from '../Components/MapLibre.svelte';
	export let data;
</script>

{#if data.databaseIsOK}
	<MapLibre />
{:else}
	<h1>Error: Did you forget to copy the tile file?</h1>
	<p>The tile file should be copied or linked to tile_data/planet.mbtiles.</p>
	<p>This error indicates the backend's tile server could not find the database file.</p>
{/if}
