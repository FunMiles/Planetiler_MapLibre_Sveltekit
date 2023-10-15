import { browser } from '$app/environment';
import Dexie from 'dexie';

interface Tile {
    x: number,
    y: number,
    z: number,
    data: ArrayBuffer
};

interface DownloadStatus {
    file: string,
    status: string
};

class MyAppDatabase extends Dexie {
    // Declare implicit table properties.
    // (just to inform Typescript. Instanciated by Dexie in stores() method)
    mapTiles: Dexie.Table<Tile, any>;
    downloadStatus: Dexie.Table<DownloadStatus, string>;
    constructor(dbName: string) {
        super(dbName);
        this.version(1).stores({
            mapTiles: '&[z+x+y]',
            downloadStatus: '&file'
        });
        // The following line is needed if your typescript
        // is compiled using babel instead of tsc:
        this.mapTiles = this.table("mapTiles");
        this.downloadStatus = this.table("downloadStatus");
    }
};

const tileDatabase = browser ? new MyAppDatabase('tiles') : null;

export default tileDatabase;

