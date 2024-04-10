import * as R from 'ramda';
import fs from 'fs';
import bmp from 'bmp-js';
import arrayBufferToHex from 'array-buffer-to-hex';
import { globby } from 'globby'; 

const readbmp = R.pipe(
    x => fs.readFileSync(x),
    bmp.decode
);

const extractHexArray = (width) => R.pipe(
    R.splitEvery(4),
    R.map(R.reverse),
    R.map(arr => new Uint8Array(arr)),
    R.map(arrayBufferToHex),
    R.map(R.take(6)),
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
console.log(files);
main(files);