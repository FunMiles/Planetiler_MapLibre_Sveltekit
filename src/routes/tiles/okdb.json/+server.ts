import { json } from '@sveltejs/kit';
import Database from 'better-sqlite3';
import pako from 'pako';

/** @type {import('@sveltejs/kit').RequestHandler<{
 * z: string;
 * x: string;
 * y: string
 * }>} */
export async function GET() {

    try {
        const db = new Database('./tile_data/planet.mbtiles');
        const read = db.prepare("SELECT HEX(tile_data) as tile_data_hex FROM tiles " +
            "WHERE zoom_level = ? AND tile_column = ? AND tile_row = ? limit 1");
        const result = read.get(2, 1, 1);
    } catch (error) {
        return new Response('Did you forget to copy/link the mbtile file to tile_data/planet.mbtiles ?', {
            status: 404,
            headers: {
                'access-control-allow-origin': '*',
            }
        })
    }
    return json({ result: 'OK' }, {
        headers: {
            'access-control-allow-origin': '*',
        }
    });
}