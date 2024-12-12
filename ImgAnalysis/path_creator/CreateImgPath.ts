import * as Visualize2D from "./visualize2d_scripts.js"

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

    ctx.drawImage(img, 0,0)
    const image_data = ctx.getImageData(0,0, canvas.width, canvas.height)
    const pixels = image_data

    return pixels

}

function createCanvasFromRGBAData(data: Array<Array<number>>, width: number, height: number) {
    if(width*height !== data.length) throw new Error("width*height should equal data.length");
    let canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    let ctx = canvas.getContext("2d");
    let imgData = ctx.createImageData(width, height)
    const offset_coloring: number = 4 // tweaking for each rgba value produces differnet offsets and coloring (note for future experimentation!)
    for (var i = 0; i < data.length; i++) {
        imgData.data[4*i] = data[i][0]
        imgData.data[4*i+1] = data[i][1]
        imgData.data[4*i+2] = data[i][2]
        imgData.data[4*i+3] = data[i][3]
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas;
  }

function getSurroundingPixels(pixel_index: number, pixels_array: Array<Array<number>>, width: number, height: number, conv_array: Array<number>) {
    console.log(pixel_index)
    if (Math.sqrt(conv_array.length) % 1 != 0) throw new Error("convolutional array is not square")
    if (Math.sqrt(conv_array.length) % 2 == 0) throw new Error("convolutional array side length must be odd")

    const radius = Math.floor(Math.sqrt(conv_array.length) / 2)
    
    var surrounding_pixels = new Array(conv_array.length)

    var [row, column] = [Math.floor(pixel_index / width), pixel_index % width] 
    if ((column < radius || width - column < radius) || (row < radius || height - row < radius)) {
        console.log("pixel is on edge, ignoring and returning " + pixels_array[pixel_index])
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

function applyConvolution(surrounding_pixels: Array<Array<number>>, conv_array) {
    if (surrounding_pixels.length != conv_array.length) throw Error("convolutional array must be the same size as the surrounding pixels")

    var weighted_pixels = []
    for (var i=0; i < surrounding_pixels.length; i++) {
        var weighted_pix = []
        surrounding_pixels[i].forEach(pix_comp => {
            weighted_pix.push(pix_comp * conv_array[i])
        });
        weighted_pixels.push(weighted_pix)
    }

    // vvv currently sum but test with max
    const conv_scaling = weighted_pixels.length * Math.max(...conv_array);
    console.log(weighted_pixels)
    var averaged_pixel = [0,0,0,0]
    weighted_pixels.forEach(pix => {
        averaged_pixel[0] += pix[0] / (conv_scaling)
        averaged_pixel[1] += pix[1] / (conv_scaling)
        averaged_pixel[2] += pix[2] / (conv_scaling)
        averaged_pixel[3] += pix[3] / (conv_scaling)
    });

    return averaged_pixel
}

function main(img, index) {

    // getting pixel array of jpg img
    const jpg_data = decodeJPG(img)
    var img_pixels = Array.from(jpg_data.data)
    var grouped_img_pixels = reshape(img_pixels, jpg_data.height * jpg_data.width, 4)

    // do stuff to pixel array
    console.log(grouped_img_pixels)

    const convolutional_array = [
        1,1,1,
        1,1,1,
        1,1,1
    ]

    var final_img_pixels = []
    // for (var i = 0; i < grouped_img_pixels.length; i++) {
    var i = 430899
        var surrounding_pixels = getSurroundingPixels(i, grouped_img_pixels, jpg_data.width, jpg_data.height, convolutional_array)
        var deconvolved_pix = applyConvolution(surrounding_pixels, convolutional_array)
        final_img_pixels.push(deconvolved_pix)
    // }

    // console.log(final_img_pixels)
    // // draw final pixel array
    const canvas = createCanvasFromRGBAData(final_img_pixels, jpg_data.width, jpg_data.height) //
    Visualize2D.workspace.appendChild(canvas)

}


const Testing = (runtimeVars, time) => {
    var [index] = runtimeVars
    Visualize2D.SetWorkspace()

    const img = htmlImg("./training_sample/coke2.jpg")
    img.onload = () => {main(img, index)}

}

Visualize2D.SetWorkspace()
const runtime = new Visualize2D.Runtime(Testing)        // init Runtime
runtime.CreateTicker(Visualize2D.DefaultTicker)
runtime.varNumber("index", 0, 10000)   // set desired vars
runtime.UpdateScreen(0)



// DEFAULT FUNCTIONS
function reshape(array: Array<any>, rows: number, cols: number): Array<Array<any>> {
    if (rows * cols !== array.length) {
      throw new Error("Invalid dimensions for reshape");
    }
  
    const result = [];
    for (let i = 0; i < rows; i++) {
      result.push(array.slice(i * cols, (i + 1) * cols));
    }
    return result;
}