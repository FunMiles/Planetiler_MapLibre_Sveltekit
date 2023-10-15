declare interface TileDownloadWorker {
    download(url: string): Promise<boolean>
}