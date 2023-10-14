import Dexie from 'dexie';

interface Tile {
    x: number,
    y: number,
    z: number,
    data: ArrayBuffer
}
class MyAppDatabase extends Dexie {
    // Declare implicit table properties.
    // (just to inform Typescript. Instanciated by Dexie in stores() method)
    mapTiles: Dexie.Table<Tile, any>;
    constructor(dbName: string) {
        super(dbName);
        this.version(1).stores({
            mapTiles: '&[z+x+y]'
        });
        // The following line is needed if your typescript
        // is compiled using babel instead of tsc:
        this.mapTiles = this.table("mapTiles");
    }
};

const tileDatabase = new MyAppDatabase('tiles');

tileDatabase.open().catch(function (e) {
    console.error("Open failed: " + e.stack);
})

export default tileDatabase;

