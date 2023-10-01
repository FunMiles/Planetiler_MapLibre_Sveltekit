/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
	const response = await fetch('/tiles/okdb.json');
	return {
		status: response.status,
		databaseIsOK: response.ok
	};
}
