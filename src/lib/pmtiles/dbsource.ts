import Dexie from "dexie";
import { bytesToHeader, defaultDecompress, deserializeIndex, type RangeResponse, type Source } from "./pmtiles";
import { lru, type LRU } from "tiny-lru";

const db = new Dexie("pmfiles");

db.version(1).stores({
    fileChunks: '&[url+offset]',
    fileStatus: '&url',
});

interface DBData {
    url: string;
    offset: number;
    length: number;
    data: ArrayBuffer;
}

interface PageData {
    offset: number;
    data: Promise<DBData>;
}

const HEADER_SIZE_BYTES = 127;
export class DBFetchSource implements Source {
    url: string;
    customHeaders: Headers;
    fileInfoPromise: Promise<any>;
    rootDirectory: any;
    cache: LRU<Promise<DBData>>;
    inDownload: Map<string, any>;

    static #DB_CHUNK_SIZE = 1024 * 1024;
    static INITIAL_BLOCK = 16 * 1024; // Size of block for header+root directory.

    constructor(url: string, customHeaders: Headers = new Headers()) {
        this.url = url;
        this.customHeaders = customHeaders;
        this.cache = lru(5);
        this.inDownload = new Map();
        this.fileInfoPromise = this.downloadFile();
    }

    fetchPart(offset: number, length: number) {
        const requestHeaders = new Headers();
        requestHeaders.set(
            "Range",
            "bytes=" + offset + "-" + (offset + length - 1)
        );
        return fetch(this.url, {
            headers: requestHeaders
        });
    }

    async partialDownload() {
        const reply = await this.fetchPart(0, DBFetchSource.INITIAL_BLOCK);
        if (reply.ok) {
            console.log('Got the beginning');
            const data = await reply.arrayBuffer();
            const etag = reply.headers.get("ETag") || undefined;
            const headerData = data.slice(0, HEADER_SIZE_BYTES);
            const header = bytesToHeader(headerData, etag);
            console.log('header is', header);

            const rootDirData = data.slice(
                header.rootDirectoryOffset,
                header.rootDirectoryOffset + header.rootDirectoryLength
            );
            const rootDir = deserializeIndex(
                await defaultDecompress(rootDirData, header.internalCompression)
            );
            this.rootDirectory = rootDir;
            console.log('Root directory:', rootDir);
        }
        else
            return -1;
    }

    async downloadFile() {
        try {
            const file_status = await db.fileStatus.where('url').equals(this.url).first();
            if (file_status?.complete) {
                console.log('File arleady downloaded');
                return file_status.size;
            }
            // The file is not complete, try the download.
            // First retrieve the size.
            let size = -1;
            try {
                const reply = await fetch(this.url, { method: 'HEAD' });
                const clString = reply.headers.get('content-length') || '-1';
                size = Number.parseInt(clString);
                console.log('Length is', size);
            } catch (e) {
                console.error("Error getting file size:", e);
                return -1;
            }
            const DOWNLOAD_CHUNK_SIZE = 1024 * 1024;
            const requestHeaders = new Headers();
            let offset = 0;
            while (offset < size) {
                const length = Math.min(size - offset, DOWNLOAD_CHUNK_SIZE);
                requestHeaders.set(
                    "Range",
                    "bytes=" + offset + "-" + (offset + length - 1)
                );
                let resp = await fetch(this.url, {
                    headers: requestHeaders
                });
                if (resp.ok) {
                    const arrayBuffer = await resp.arrayBuffer();
                    await db.fileChunks.put({ url: this.url, offset, length, data: arrayBuffer });
                } else
                    return -1;
                console.log(`Downloaded chunk of size ${length} at ${offset}`);
                offset += length;
            }
            await db.fileStatus.put({ url: this.url, complete: true, size })
            return size;
        } catch (e) {
            console.error('Error:', e);
            return -1;
        }
    }

    getKey() {
        return this.url;
    }

    setHeaders(customHeaders: Headers) {
        this.customHeaders = customHeaders;
    }

    retrieve(offset: number) {
        return db.fileChunks.where({ url: this.url, offset }).first();
    }

    getPages(
        offset: number,
        length: number,
        signal?: AbortSignal) {
        const endOffset = offset + length;
        const beginPage = Math.floor(offset / DBFetchSource.#DB_CHUNK_SIZE);
        const endPage = Math.floor(endOffset / DBFetchSource.#DB_CHUNK_SIZE);
        const requests = beginPage == endPage ? [beginPage]
            : [beginPage, endPage];
        const pages: PageData[] = [];
        for (const pageIdx of requests) {
            let aw: Promise<DBData> | undefined = this.cache.get(pageIdx.toString());
            const pageOffset = pageIdx * DBFetchSource.#DB_CHUNK_SIZE;
            if (!aw) {
                // console.log('Did not find data in cache.', pageOffset, 'for idx', pageIdx, 'offset', offset)
                aw = this.retrieve(pageOffset);
                // console.log('Retrieving:', aw);
                this.cache.set(pageIdx.toString(), aw!);
            }
            pages.push({ offset: pageOffset, data: aw! });
        }
        return pages;
    }

    async getBytes(
        offset: number,
        length: number,
        signal?: AbortSignal
    ): Promise<RangeResponse> {
        const pages = await this.getPages(offset, length, signal);
        if (pages.length == 1) {
            const page = pages[0];
            const subOffset = offset - page.offset;
            const pageData = await page.data;
            // console.log(`${offset}, ${length} page data`, pageData)
            return {
                data: pageData.data.slice(subOffset, subOffset + length)
            };
        } else {
            // console.log('Overlap');
            const data0 = await pages[0].data;
            const data1 = await pages[1].data;
            const subOffset0 = offset - pages[0].offset;
            // console.log('data0', data0)
            const subLen0 = data0.data.byteLength - subOffset0;
            const subLen1 = length - subLen0;
            const arrayData = new Uint8Array(length);
            arrayData.set(new Uint8Array(data0.data.slice(subOffset0)), 0);
            arrayData.set(new Uint8Array(data1.data.slice(0, subLen1)), subLen0);
            return {
                data: arrayData.buffer
            };
        }
    }

    async getBytesFromNet(
        offset: number,
        length: number,
        signal?: AbortSignal
    ): Promise<RangeResponse> {
        let controller;
        if (!signal) {
            // TODO check this works or assert 206
            controller = new AbortController();
            signal = controller.signal;
        }

        const requestHeaders = new Headers(this.customHeaders);
        requestHeaders.set(
            "Range",
            "bytes=" + offset + "-" + (offset + length - 1)
        );

        let resp = await fetch(this.url, {
            signal: signal,
            headers: requestHeaders,
        });

        // TODO: can return 416 with offset > 0 if content changed, which will have a blank etag.
        // See https://github.com/protomaps/PMTiles/issues/90

        if (resp.status === 416 && offset === 0) {
            // some HTTP servers don't accept ranges beyond the end of the resource.
            // Retry with the exact length
            const content_range = resp.headers.get("Content-Range");
            if (!content_range || !content_range.startsWith("bytes */")) {
                throw Error("Missing content-length on 416 response");
            }
            const actual_length = +content_range.substr(8);
            resp = await fetch(this.url, {
                signal: signal,
                headers: { Range: "bytes=0-" + (actual_length - 1) },
            });
        }

        if (resp.status >= 300) {
            throw Error("Bad response code: " + resp.status);
        }

        const content_length = resp.headers.get("Content-Length");

        // some well-behaved backends, e.g. DigitalOcean CDN, respond with 200 instead of 206
        // but we also need to detect no support for Byte Serving which is returning the whole file
        if (resp.status === 200 && (!content_length || +content_length > length)) {
            if (controller) controller.abort();
            throw Error(
                "Server returned no content-length header or content-length exceeding request. Check that your storage backend supports HTTP Byte Serving."
            );
        }

        const a = await resp.arrayBuffer();
        return {
            data: a,
            etag: resp.headers.get("ETag") || undefined,
            cacheControl: resp.headers.get("Cache-Control") || undefined,
            expires: resp.headers.get("Expires") || undefined,
        };
    }
}

