import {createGzip} from 'zlib';
import {join} from 'path';
import {promises as fs, createReadStream, createWriteStream} from 'fs';
import archiver from 'archiver';
import {removeFile} from './file-utils';
import {ChildProcessProxy} from '@loaders.gl/worker-utils';
import JSZip from 'jszip';
import {MD5Hash} from '@loaders.gl/crypto';
import crypt from 'crypt';
import {getAbsoluteFilePath} from './file-utils';

/**
 * Compress file to gzip file
 *
 * @param pathFile - the path to the file
 * @return the path to the gzip file
 */
export function compressFileWithGzip(pathFile: string): Promise<string> {
  const compressedPathFile = `${pathFile}.gz`;
  const gzip = createGzip();
  const input = createReadStream(pathFile);
  const output = createWriteStream(compressedPathFile);

  return new Promise((resolve, reject) => {
    input.on('end', () => {
      console.log(`${compressedPathFile} compressed and saved.`); // eslint-disable-line no-undef,no-console
      resolve(compressedPathFile);
    });
    input.on('error', (error) => {
      console.log(`${compressedPathFile}: compression error!`); // eslint-disable-line no-undef,no-console
      reject(error);
    });
    input.pipe(gzip).pipe(output);
  });
}

/**
 * Compress files from map into slpk file
 *
 * @param fileMap - map with file paths (key: output path, value: input path)
 * @param outputFile - output slpk file
 * @param level - compression level
 */
export async function compressFilesWithZip(
  fileMap: {[key: string]: string},
  outputFile: string,
  level: number = 0
) {
  // Before creating a new file, we need to delete the old file
  try {
    await removeFile(outputFile);
  } catch (e) {
    // Do nothing if old file doesn't exist
  }

  const output = createWriteStream(outputFile);
  const archive = archiver('zip', {
    zlib: {level} // Sets the compression level.
  });

  return new Promise(async (resolve, reject) => {
    // listen for all archive data to be writte
    // 'close' event is fired only when a file descriptor is involved
    output.on('close', function () {
      console.log(`${outputFile} saved.`); // eslint-disable-line no-undef,no-console
      console.log(`${archive.pointer()} total bytes`); // eslint-disable-line no-undef,no-console
      resolve(null);
    });

    // This event is fired when the data source is drained no matter what was the data source.
    // It is not part of this library but rather from the NodeJS Stream API.
    // @see: https://nodejs.org/api/stream.html#stream_event_end
    output.on('end', function () {
      console.log('Data has been drained'); // eslint-disable-line no-undef,no-console
      resolve(null);
    });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function (err) {
      console.log(err); // eslint-disable-line no-undef,no-console
      reject(err);
    });

    // good practice to catch this error explicitly
    archive.on('error', function (err) {
      reject(err);
    });

    // pipe archive data to the file
    archive.pipe(output);

    for (const subFileName in fileMap) {
      const subFileData = fileMap[subFileName];
      await appendFileToArchive(archive, subFileName, subFileData);
    }

    // finalize the archive (ie we are done appending files but streams have to finish yet)
    archive.finalize();
  });
}

/**
 * Compress files using external tool 'zip'/'7z'
 *
 * @param inputFolder - folder to archive - for cwd option
 * @param outputFile - output slpk file
 * @param level - compression level
 * @param inputFiles - input files path to pass to the executable as option
 * @param sevenZipExe - path to 7z.exe executable
 */
export async function compressWithChildProcess(
  inputFolder: string,
  outputFile: string,
  level: number,
  inputFiles: string,
  sevenZipExe: string
) {
  // eslint-disable-next-line no-undef
  if (process.platform === 'win32') {
    await compressWithChildProcessWindows(inputFolder, outputFile, level, inputFiles, sevenZipExe);
  } else {
    await compressWithChildProcessUnix(inputFolder, outputFile, level, inputFiles);
  }
}

/**
 * Compress files using external linux tool 'zip'
 *
 * @param inputFolder - folder to archive - for cwd option
 * @param outputFile - output slpk file
 * @param level - compression level
 * @param inputFiles - input files path to pass to the executable as option
 */
async function compressWithChildProcessUnix(
  inputFolder: string,
  outputFile: string,
  level: number = 0,
  inputFiles: string = '.'
) {
  const fullOutputFile = getAbsoluteFilePath(outputFile);
  const args = [`-${level}`, '-r', fullOutputFile, inputFiles];
  const childProcess = new ChildProcessProxy();
  await childProcess.start({
    command: 'zip',
    arguments: args,
    spawn: {
      cwd: inputFolder
    },
    wait: 0
  });
}

/**
 * Compress files using windows external tool '7z'
 *
 * @param inputFolder - folder to archive - for cwd option
 * @param outputFile - output slpk file
 * @param level - compression level
 * @param inputFiles - input files path to pass to the executable as option
 * @param sevenZipExe - path to 7z.exe executable
 */
async function compressWithChildProcessWindows(
  inputFolder: string,
  outputFile: string,
  level: number = 0,
  inputFiles: string = join('.', '*'),
  sevenZipExe: string
) {
  // Workaround for @listfile issue. In 7z.exe @-leading files are handled as listfiles
  // https://sevenzip.osdn.jp/chm/cmdline/syntax.htm
  if (inputFiles[0] === '@') {
    inputFiles = `*${inputFiles.substr(1)}`;
  }

  const fullOutputFile = getAbsoluteFilePath(outputFile);
  const args = ['a', '-tzip', `-mx=${level}`, fullOutputFile, inputFiles];
  const childProcess = new ChildProcessProxy();
  await childProcess.start({
    command: sevenZipExe,
    arguments: args,
    spawn: {
      cwd: `${inputFolder}`
    },
    wait: 0
  });
}

/**
 * Generate hash file from zip archive
 * https://github.com/Esri/i3s-spec/blob/master/docs/1.7/slpk_hashtable.cmn.md
 *
 * @param inputZipFile
 * @param outputFile
 */
export async function generateHash128FromZip(inputZipFile: string, outputFile: string) {
  const input = await fs.readFile(inputZipFile);
  const zip = await JSZip.loadAsync(input);
  const hashTable: {key: string; value: string}[] = [];
  const zipFiles = zip.files;
  for (const relativePath in zipFiles) {
    const zipEntry = zipFiles[relativePath];
    // Had to use a workaround because the correct string is getting the wrong data
    // const content = await zipEntry.async('nodebuffer');
    // _data isn't described in the interface, so lint thought it was wrong
    const _data = '_data';
    const content = zipEntry[_data].compressedContent;
    if (zipEntry.dir) continue; // eslint-disable-line no-continue
    // eslint-disable-next-line no-undef
    const hash = await new MD5Hash().hash(Buffer.from(relativePath.toLowerCase()));
    // eslint-disable-next-line no-undef
    hashTable.push({key: atob(hash), value: content.byteOffset});
  }

  hashTable.sort((prev, next) => {
    if (prev.key === next.key) {
      return prev.value < next.value ? -1 : 1;
    }
    return prev.key < next.key ? -1 : 1;
  });

  const output = createWriteStream(outputFile);
  return new Promise((resolve, reject) => {
    output.on('close', function () {
      console.log(`${outputFile} generated and saved`); // eslint-disable-line
      resolve(null);
    });
    output.on('error', function (err) {
      console.log(err); // eslint-disable-line
      reject(err);
    });
    for (const key in hashTable) {
      const item = hashTable[key];
      const value = longToByteArray(item.value);
      // TODO: perhaps you need to wait for the 'drain' event if the write returns 'false'
      // eslint-disable-next-line no-undef
      output.write(Buffer.from(crypt.hexToBytes(item.key).concat(value)));
    }
    output.close();
  });
}

/**
 * Encode 64 bit value to byte array
 *
 * @param long - stringified number
 * @returns
 */
function longToByteArray(long: string): number[] {
  const buffer = new ArrayBuffer(8); // JS numbers are 8 bytes long, or 64 bits
  const longNum = new Float64Array(buffer); // so equivalent to Float64
  longNum[0] = parseInt(long);
  return Array.from(new Uint8Array(buffer)).reverse(); // reverse to get little endian
}

/**
 * Add file to zip archive
 *
 * @param inputFile
 * @param fileName
 * @param zipFile
 * @param sevenZipExe
 */
export async function addFileToZip(
  inputFolder: string,
  fileName: string,
  zipFile: string,
  sevenZipExe: string
) {
  await compressWithChildProcess(inputFolder, zipFile, 0, fileName, sevenZipExe);
  console.log(`${fileName} added to ${zipFile}.`); // eslint-disable-line
}

/**
 *
 * @param archive zip archive instance
 * @param subFileName file path inside archive
 * @param subFileData source file path
 * @returns
 */
function appendFileToArchive(archive: any, subFileName: string, subFileData: string) {
  return new Promise((resolve) => {
    const fileStream = createReadStream(subFileData);
    console.log(`Compression start: ${subFileName}`); // eslint-disable-line no-undef,no-console
    fileStream.on('close', () => {
      console.log(`Compression finish: ${subFileName}`); // eslint-disable-line no-undef,no-console
      resolve(null);
    });
    archive.append(fileStream, {name: subFileName});
  });
}
