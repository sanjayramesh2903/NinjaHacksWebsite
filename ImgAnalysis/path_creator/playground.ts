import { isAnyArrayBuffer } from "util/types"
import * as Visualize2D from "./visualize2d_scripts.js"

const BLACK = new Array(4).fill(0)
const WHITE = new Array(4).fill(255)
const GREY = new Array(4).fill(255 / 2)

const htmlImg = (jpg_path: string) => {

    const base_img: HTMLImageElement = document.createElement("img")
    base_img.src = jpg_path
    base_img.id = "base_img"
    Visualize2D.workspace?.appendChild(base_img)

    return base_img

}

const decodeJPG = (img: HTMLImageElement) => {

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.drawImage(img, 0, 0)
    const image_data = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = image_data

    return pixels

}

function createCanvasFromRGBAData(data, width: number, height: number) {
    if (width * height !== data.length) throw new Error("width*height should equal data.length");
    let canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    let ctx = canvas.getContext("2d");
    let imgData = ctx.createImageData(width, height)
    const offset_coloring: number = 4 // tweaking for each rgba value produces differnet offsets and coloring (note for future experimentation!)
    for (var i = 0; i < data.length; i++) {
        imgData.data[4 * i] = data[i][0]
        imgData.data[4 * i + 1] = data[i][1]
        imgData.data[4 * i + 2] = data[i][2]
        imgData.data[4 * i + 3] = data[i][3]
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas;
}

function getSurroundingPixels(pixel_index: number, pixels_array: Array<Array<number>>, width: number, height: number, conv_array: Array<number>) {
    // console.log(pixel_index)
    if (Math.sqrt(conv_array.length) % 1 != 0) throw new Error("convolutional array is not square")
    if (Math.sqrt(conv_array.length) % 2 == 0) throw new Error("convolutional array side length must be odd")

    const radius = Math.floor(Math.sqrt(conv_array.length) / 2)

    var surrounding_pixels = new Array(conv_array.length)

    var [row, column] = [Math.floor(pixel_index / width), pixel_index % width]
    // console.log(row, "| act", height)
    if ((column < radius || width - column < radius) || (row < radius || (height - 1) - row <= radius)) {
        // console.log("pixel is on edge, ignoring and returning " + pixels_array[pixel_index])
        surrounding_pixels.fill(pixels_array[pixel_index])
        return (surrounding_pixels) // if pixel is edge pixel, ignore
    }

    // console.log("\tradius, convscaling:", radius, conv_scaling)
    var currentInd = 0
    for (var i = -radius; i <= radius; i++) {
        for (var j = -radius; j <= radius; j++) {
            surrounding_pixels[currentInd] = pixels_array[pixel_index + i * width + j]
            currentInd++
        }
    }

    return surrounding_pixels
}

function applyBlur(img, radius) {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
        let red = data[i], green = data[i + 1], blue = data[i + 2];

        data[i] = Math.min(Math.round(0.393 * red + 0.769 * green + 0.189 * blue), 255);
        data[i + 1] = Math.min(Math.round(0.349 * red + 0.686 * green + 0.168 * blue), 255);
        data[i + 2] = Math.min(Math.round(0.272 * red + 0.534 * green + 0.131 * blue), 255);
    }
    ctx.putImageData(imageData, 0, 0);
}
//https://github.com/mdn/dom-examples/blob/main/canvas/pixel-manipulation/color-manipulation.js
function applyConvolution(surrounding_pixels: Array<Array<number>>, conv_array) {
    if (surrounding_pixels.length != conv_array.length) throw Error("convolutional array must be the same size as the surrounding pixels")

    var weighted_pixels = []
    for (var i = 0; i < surrounding_pixels.length; i++) {
        var weighted_pix = []
        surrounding_pixels[i].forEach(pix_comp => {
            weighted_pix.push(pix_comp * conv_array[i])
        });
        weighted_pixels.push(weighted_pix)
    }

    // vvv currently sum but test with max
    const conv_scaling = weighted_pixels.length * Math.max(...conv_array);
    // console.log(weighted_pixels)
    var averaged_pixel = [0, 0, 0, 0]
    weighted_pixels.forEach(pix => {
        averaged_pixel[0] += pix[0] / (conv_scaling)
        averaged_pixel[1] += pix[1] / (conv_scaling)
        averaged_pixel[2] += pix[2] / (conv_scaling)
        averaged_pixel[3] += pix[3] / (conv_scaling)
    });

    // rounding
    averaged_pixel = averaged_pixel.map((comp) => { return Math.floor(comp) })

    return averaged_pixel
}

function applyContrastFilter(surrounding_pixels: Array<Array<number>>) {
    var main_pixel = surrounding_pixels[Math.floor(surrounding_pixels.length / 2)]
    surrounding_pixels.splice(Math.floor(surrounding_pixels.length / 2))

    var avg_contrast = 0
    surrounding_pixels.forEach(pixel => {
        avg_contrast += contrast(main_pixel, pixel)
    });
    avg_contrast *= 1 / surrounding_pixels.length

    var contrast_pix = new Array(4).fill(255 * avg_contrast)

    return contrast_pix
}

function getContrastPoints(surrounding_pixels, threshold) {
    var main_pixel = surrounding_pixels[Math.floor(surrounding_pixels.length / 2)]
    surrounding_pixels.splice(Math.floor(surrounding_pixels.length / 2))

    var avg_contrast = 0
    surrounding_pixels.forEach(pixel => {
        avg_contrast += contrast(main_pixel, pixel)
    });
    avg_contrast *= 1 / surrounding_pixels.length

    if (avg_contrast > threshold) {
        return [BLACK, true]
    } else {
        return [GREY, false]
    }
}

function main(img, threshold) {

    // getting pixel array of jpg img
    const jpg_data = decodeJPG(img)
    // var img_pixels = Array.from(jpg_data.data)
    var grouped_img_pixels = reshape(jpg_data.data, jpg_data.height * jpg_data.width, 4)

    // do stuff to pixel array
    // console.log(grouped_img_pixels)

    // const convolutional_array = [
    //     1,100,1,
    //     100,10,100,
    //     1,1,1
    // ]
    const convolutional_array = new Array(11 ** 2).fill(1)

    var convolved_img_pixels = []
    var contrast_img_pixels = []
    var contrast_points = []
    var count = 0
    for (var i = 0; i < grouped_img_pixels.length; i++) {
        // var i = 430982
        var surrounding_pixels = getSurroundingPixels(i, grouped_img_pixels, jpg_data.width, jpg_data.height, convolutional_array)

        var deconvolved_pix = applyConvolution(surrounding_pixels, convolutional_array)
        convolved_img_pixels.push(deconvolved_pix)
        var contrast_pix = applyContrastFilter(surrounding_pixels)
        contrast_img_pixels.push(contrast_pix)
        var [contrast_point, isPoint] = getContrastPoints(surrounding_pixels, threshold)

        isPoint ? count = 3 : count--
        count == 0 ? contrast_points.push(contrast_point) : contrast_points.push(BLACK)
    }

    // console.log(final_img_pixels)
    // // draw final pixel array
    const conv_canvas = createCanvasFromRGBAData(convolved_img_pixels, jpg_data.width, jpg_data.height) //
    Visualize2D.workspace.appendChild(conv_canvas)
    const constrast_canvas = createCanvasFromRGBAData(contrast_img_pixels, jpg_data.width, jpg_data.height) //
    Visualize2D.workspace.appendChild(constrast_canvas)
    console.log(contrast_points)
    const points_canvas = createCanvasFromRGBAData(contrast_points, jpg_data.width, jpg_data.height) //
    Visualize2D.workspace.appendChild(points_canvas)
}


const visualizeConnection = (runtimeVars, time) => {
    var [contrast_threshold] = runtimeVars
    Visualize2D.SetWorkspace()

    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '../training_sample/coke1.jpg';
    img.onload = () => { main(img, contrast_threshold / 1000) }

}

Visualize2D.SetWorkspace()
const runtime = new Visualize2D.Runtime(visualizeConnection)        // init Runtime
runtime.CreateTicker(Visualize2D.DefaultTicker)
runtime.varNumber("contrast_threshold", 0, 1000)   // set desired vars
runtime.UpdateScreen(0)



// GENERAL FUNCTIONS


function reshape(array, rows: number, cols: number): Array<Array<any>> {
    if (rows * cols !== array.length) {
        throw new Error("Invalid dimensions for reshape");
    }

    const result = [];
    for (let i = 0; i < rows; i++) {
        result.push(array.slice(i * cols, (i + 1) * cols));
    }
    return result;
}

// contrast ratio code; credit: kirilloid (https://stackoverflow.com/a/9733420)
const RED = 0.2126;
const GREEN = 0.7152;
const BLUE = 0.0722;

const GAMMA = 2.4;

function luminance(rgba: Array<number>) {
    var [r, g, b, _] = rgba
    var a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928
            ? v / 12.92
            : Math.pow((v + 0.055) / 1.055, GAMMA);
    });
    return a[0] * RED + a[1] * GREEN + a[2] * BLUE;
}

function contrast(rgba1: Array<number>, rgba2: Array<number>) {
    var lum1 = luminance(rgba1);
    var lum2 = luminance(rgba2);
    var brightest = Math.max(lum1, lum2);
    var darkest = Math.min(lum1, lum2);
    return (darkest + 0.05) / (brightest + 0.05);
}