import * as R from 'ramda';
import fs from 'fs';
import bmp from 'bmp-js';
import { globby } from 'globby'; 

const readbmp = R.pipe(
  x => fs.readFileSync(x),
  bmp.decode
);

const decToHex = n => n.toString(16).padStart(2, 0);
const half = R.pipe(
  R.divide(R.__, 2),
  Math.round
);

const extractHexArray = (width) => R.pipe(
  buffer => new Uint8Array(buffer), // convert to array 
  R.splitEvery(4), // convert to JS array of buffers (4 bytes per pixel)
  R.map(R.reverse), // reverse little endian
  R.map(R.take(3)), // take only R, G, B bytes
  R.map(R.map(R.pipe( // map over each individual value
    half, // morph only uses 0-128 of the byte for some reason
    decToHex
  ))),
  R.map(R.join('')),
  R.map(R.concat('0x')),
  R.splitEvery(width)
);

const createMorphTxt = (width, height) => R.pipe(
  R.map(R.join(', ')),
  R.join('\n'),
  R.concat(`
vMFX
# mode: 0 
# offset: 0,0

# w,h
${width},${height}

`)
);

const renameFile = R.replace('.bmp', '.morph.txt');

const main = R.pipe(
  R.map(filename => R.pipe(
    readbmp,
    bmp => R.pipe(
      extractHexArray(bmp.width),
      createMorphTxt(bmp.width, bmp.height),
    )(bmp.data),
    text => fs.writeFileSync(renameFile(filename), text)
  )(filename))
);

const files = await globby(['./**/*.bmp', "!node_modules"]);
console.log('Converting Files:');

main(files);

console.log('Success!');
files.forEach(file => {
  console.log(`${file} --> ${renameFile(file)}`)
});