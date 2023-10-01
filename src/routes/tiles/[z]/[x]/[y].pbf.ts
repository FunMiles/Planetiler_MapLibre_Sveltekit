import Database from 'better-sqlite3';
import pako from 'pako';

/** @type {import('@sveltejs/kit').RequestHandler<{
 * z: string;
 * x: string;
 * y: string
 * }>} */
export async function GET({ params }) {

    try {
        const db = new Database('./tile_data/planet.mbtiles');
        const read = db.prepare("SELECT HEX(tile_data) as tile_data_hex FROM tiles " +
            "WHERE zoom_level = ? AND tile_column = ? AND tile_row = ? limit 1");
        const p = (1 << params.z);
        const z = params.z;
        const x = params.x;
        const y = p - params.y - 1;
        const result = read.get(z, x, y);

        if (!result || !result.tile_data_hex) {
            return {
                status: 404
            }
        }
        const hexData = result.tile_data_hex;


        let binData = new Uint8Array(hexData.match(/.{1,2}/g).map((byte: string) => parseInt(byte, 16)));
        let isGzipped = binData[0] === 0x1f && binData[1] === 0x8b;
        if (isGzipped)
            binData = pako.inflate(binData);
        return {
            headers: {
                'access-control-allow-origin': '*',
                'Content-type': 'application/octet-stream',
            },
            body: binData
        };
    } catch (error) {
        return {
            headers: {
                'access-control-allow-origin': '*',
            },
            body: 'Did you forget to copy/link the mbtile file to tile_data/planet.mbtiles ?'
        }
    }
}