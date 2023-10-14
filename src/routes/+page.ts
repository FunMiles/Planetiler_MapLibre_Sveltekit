/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
	return {
		status: 400,
		databaseIsOK: false
	}
	// const response = await fetch('/tiles/okdb.json');
	// return {
	// 	status: response.status,
	// 	databaseIsOK: response.ok
	// };
}
