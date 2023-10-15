import * as Comlink from "comlink";
import JSZip from "jszip";

const tileDatabasePromise = import("$lib/tile_database").then((m) => m.default);

class Worker implements TileDownloadWorker {
    async download(url: string): Promise<boolean> {
        const tileDatabase = await tileDatabasePromise;
        let zipFile: JSZip = new JSZip();
        const data = await fetch(url);
        const result = await zipFile.loadAsync(await data.arrayBuffer());
        for (const file in result.files) {
            const arg = file.match(/([0-9]+)\/([0-9]+)\/([0-9]+)\.pbf/);
            if (arg?.length != 4)
                continue;
            const z = parseInt(arg[1]);
            const x = parseInt(arg[2]);
            const y = parseInt(arg[3]);

            const content = result.files[file];
            const data = await content.async('arraybuffer');
            tileDatabase.mapTiles.put({ z, x, y, data });
        }
        return true;
    }
}

const obj = new Worker();
Comlink.expose({
    download: async (url: string) => { return obj.download(url); }
});