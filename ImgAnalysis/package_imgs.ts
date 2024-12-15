import * as ImgPath from "./dist/path_creator/ImgPath"
import * as fs from "fs";
const directoryPath = './training/toothbrush/';

const json: object = {}

fs.readdir(directoryPath, (err, files) => {
  if (err) {
    console.error('Error reading directory:', err);
    return;
  }

  files.forEach(file => {
    var eimg = new ImgPath.EulerImg(file, 3)
    for (var i = 0; i < 8; i++) eimg.gaussianBlur()
    eimg.keyPointDetection(10, 8, true, true, false)
    eimg.normalizeKeyPoints
    const keyPoints = eimg.keyPoints

    json[file] = keyPoints
  });
});