import * as Comlink from "comlink";
import JSZip from "jszip";
import { base } from '$app/paths';
import tileDatabase from '$lib/tile_database';

class DownloadWorker implements TileDownloadWorker {
    async download(url: string): Promise<boolean> {
        let zipFile: JSZip = new JSZip();
        const fullURLPath = `${base}${url}`;
        console.log('Loading', fullURLPath, 'base', base)
        const data = await fetch(fullURLPath);
        const ab = await data?.arrayBuffer();
        console.log('Size of file', ab?.byteLength);
        const result = await zipFile.loadAsync(ab);
        for (const file in result.files) {
            const arg = file.match(/([0-9]+)\/([0-9]+)\/([0-9]+)\.pbf/);
            if (arg?.length != 4)
                continue;
            const z = parseInt(arg[1]);
            const x = parseInt(arg[2]);
            const y = parseInt(arg[3]);

            const content = result.files[file];
            const data = await content.async('arraybuffer');
            tileDatabase!.mapTiles.put({ z, x, y, data });
        }
        return true;
    }
}

const obj = new DownloadWorker();
Comlink.expose({
    download: async (url: string) => { return obj.download(url); }
});
