import * as Comlink from "comlink";
import JSZip from "jszip";
import tileDatabase from "$lib/tile_database";

class Worker implements TileDownloadWorker {

    async download(url: string): Promise<boolean> {
        let zipFile: JSZip = new JSZip();
        const data = await fetch(url);
        const result = await zipFile.loadAsync(await data.arrayBuffer());
        console.log('I received', result);
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
        console.log('returning true')
        return true;
    }
}

const obj = new Worker();

Comlink.expose({
    download: async (url: string) => { return obj.download(url); }
});