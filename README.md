# MapLibre Progressive Web App with SvelteKit

## Introduction

This project is a demonstration of a Progessive Web App (PWA) for a MabLibre-based map viewer. 

## Generating the Data File
There is a demo file 0_2.zip for vector tiles at levels 0, 1 and 2 for the whole planet.

If you want to start from scratch, there are three phases to generating the data:
    - generate a .mbtiles file
    - extract tile data for some levels
    - zipping the files to be downloaded by the app

### Generating the .mbtiles file

The quickest way to generate a planet.mbtiles file is to use [planetiler](https://github.com/onthegomap/planetiler).

The demo initially centers the map in US/Colorado. You can quickly get workable data with:
```
wget https://github.com/onthegomap/planetiler/releases/latest/download/planetiler.jar
java -Xmx1g -jar planetiler.jar --download --area=us/colorado
```
And copy/link `data/output.mbtiles` to the `tile_data` directory under the name `planet.mbtiles`.

Put the planet.mbtiles in the `tile_data` directory, run `npm i` or `pnpm i` and `npm run dev` or `pnpm dev` and you should be able to open the map in your browser at the address given by the last command.

### Extracting the tiles to a file directory

The *create_tile_files* script exptracts tile file from an mbtiles file. The files are extacted to a directory `tile_files`.

```
Usage: create_tile_files [OPTIONS]...

Arguments:
  mbtile-filename     file with mbtile data (default: "tile_data/planet.mbtiles")

Options:
  -v, --version       output the version number
  -f, --from <level>  Give the minimum level (default: "0")
  -t, --to <level>    the maximum level (default: "6")
  -h, --help          display help for command
```

example:

```
node scripts/create_tile_files.js -f 1 -t 3 tile_data/planet.mbtiles
```

### Zipping the tiles

Currently the code expect a file named `0_2.zip` in `static`. It is up to you to change the name if you wish, and/or complete the code to download other files. Note that it is not recommended to have very large files. 
To zip files of levels 0, 1 and 2, use:
```
zip static/0_2.zip tile_files/0 tile_files/1 tile_files/2
```

## Style File

You can modify the map style file in [static/mystyle.json](static/mystyle.json)