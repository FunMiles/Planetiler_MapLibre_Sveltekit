# MapLibre mbtiles Viewer with SvelteKit

## Introduction

This project is a simple viewer for mbtiles files. 

## Generating the Data File

The quickest way to generate a planet.mbiles file is to use [planetiler](https://github.com/onthegomap/planetiler).

The demo initially centers the map in US/Colorado. You can quickly get workable data with:
```
wget https://github.com/onthegomap/planetiler/releases/latest/download/planetiler.jar
java -Xmx1g -jar planetiler.jar --download --area=us/colorado
```
And copy/link `data/output.mbtiles` to the `tile_data` directory under the name `planet.mbtiles`.

Put the planet.mbtiles in the `tile_data` directory, run `npm i` or `pnpm i` and `npm run dev` or `pnpm dev` and you should be able to open the map in your browser at the address given by the last command.

## Style File

You can modify the map style file in [static/mystyle.json](static/mystyle.json)