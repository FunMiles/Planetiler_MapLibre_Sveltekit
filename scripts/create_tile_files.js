import Database from 'better-sqlite3';
import pako from 'pako';
import * as fs from 'fs';
import { program } from 'commander';
let filename = '';
program
    .version('1.0.0', '-v, --version')
    .option('-f, --from <level>', 'Give the minimum level', '0')
    .option('-t, --to <level>', 'the maximum level', '6')
    .argument('[mbtile-filename]', 'file with mbtile data', 'tile_data/planet.mbtiles')
    .usage('[OPTIONS]...')
    .action((fn) => {
        console.log('here', fn);
        filename = fn;
    });

program.parse();

// console.log('options', program.opts(), 'arguments', program.args)

const options = program.opts();

const fromLevel = parseInt(options.from);
const toLevel = parseInt(options.to);
console.log(`From ${fromLevel} to ${toLevel}`)

const dest_dir = './tile_files';

let read;
let levelRead;
try {
    const db = new Database(filename);
    read = db.prepare("SELECT HEX(tile_data) as tile_data_hex FROM tiles " +
        "WHERE zoom_level = ? AND tile_column = ? AND tile_row = ? limit 1");
    levelRead = db.prepare("SELECT tile_column, tile_row, HEX(tile_data) as tile_data_hex FROM tiles " +
        "WHERE zoom_level = ?");
} catch (error) {
    console.error('Failed to open database:', error);
    process.exit(1);
}
try {
    if (!fs.existsSync(dest_dir))
        fs.mkdirSync(dest_dir, { recursive: true });
} catch (error) {
    console.error('Failed to create folder:', error);
    process.exit(1);
}

for (let level = fromLevel; level <= toLevel; ++level) {
    console.log(`Extracting files at level ${level}`);
    let count = 0;
    function write(z, x, y, blob) {
        let dir_path = `${dest_dir}/${z}/${x}`;
        let file_path = `${dir_path}/${y}.pbf`;
        try {
            if (!fs.existsSync(dir_path))
                fs.mkdirSync(dir_path, { recursive: true });
            fs.writeFileSync(file_path, blob);
        } catch (error) {
            console.error('Failed to create file folder:', error);
            process.exit(1);
        }
    }

    let z = level;
    for (const tileData of levelRead.iterate(level)) {
        const { tile_column, tile_row, tile_data_hex } = tileData;
        const x = parseInt(tile_column);
        const y = (1 << level) - parseInt(tile_row) - 1;
        let binData = new Uint8Array(tile_data_hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
        let isGzipped = binData[0] === 0x1f && binData[1] === 0x8b;
        if (isGzipped)
            binData = pako.inflate(binData);
        write(z, x, y, binData);
        ++count;
    }
    console.log(`Extracted ${count} tiles at level ${level}`);
}