# MapLibre Progressive Web App with SvelteKit

## Introduction

This project is a demonstration of a Progessive Web App (PWA) for a MabLibre-based map viewer using pmtiles file format. 

## Generating the Data File
If you want to start from scratch, there are three phases to generating the data:
    - generate a .mbtiles file
    - extract tile data for some levels
    - zipping the files to be downloaded by the app

### Generating the .pmtiles file

The quickest way to generate a planet.mbtiles file is to use [planetiler](https://github.com/onthegomap/planetiler) to generate a `.mbtiles` file and then convert it to `.pmtiles` using the [`pmtiles` executable](https://github.com/protomaps/go-pmtiles/releases)

The demo initially centers the map in US/Colorado. You can quickly get workable data with:
```
wget https://github.com/onthegomap/planetiler/releases/latest/download/planetiler.jar
java -Xmx1g -jar planetiler.jar --download --area=us/colorado
```
Then run  `pmtiles convert data/output.mbtiles source.pmtiles` and copy the file to the `static` directory.

Once you have installed the `source.pmtiles` file, run `npm i` or `pnpm i` and `npm run dev` or `pnpm dev` and you should be able to open the map in your browser at the address given by the last command.

## Style File

You can modify the map style file in [static/mystyle.json](static/mystyle.json)