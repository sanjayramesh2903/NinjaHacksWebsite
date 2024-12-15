// @ts-ignore
import { Scalar, ScalarLike } from "@tensorflow/tfjs"
import concaveman from "https://cdn.skypack.dev/concaveman"
// import * as tf from "@tensorflow/tfjs"

export class EulerImg {

    img: HTMLImageElement
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D

    kernel: Array<number>
    keyPoints: Array<Array<number>>

    constructor(img_path: string, root: HTMLElement, sigmaForGuassianBlur?) {
        this.img = new Image();
        this.img.crossOrigin = 'anonymous';
        this.img.src = img_path;
        
        this.canvas = document.createElement('canvas') as HTMLCanvasElement
        this.canvas.id = "EulerCanvas"
        this.ctx = this.canvas.getContext('2d');   
        root.appendChild(this.canvas)

        this.img.onload = () => {
            this.canvas.width = this.img.width
            this.canvas.height = this.img.height
            this.ctx.drawImage(this.img, 0, 0);
        }  
        if (sigmaForGuassianBlur) {
            const radius = Math.ceil(sigmaForGuassianBlur * 3);
            this.kernel = generateGaussianKernel(sigmaForGuassianBlur, radius);
        }      
    }

    blur(radius: number) {
        console.log("Blur loading...");
    
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        const width = this.canvas.width;
        const height = this.canvas.height;
    
        // integral img variables
        const integralR = new Uint32Array((width + 1) * (height + 1));
        const integralG = new Uint32Array((width + 1) * (height + 1));
        const integralB = new Uint32Array((width + 1) * (height + 1));
        const integralA = new Uint32Array((width + 1) * (height + 1));
    
        // integral img calc
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                const a = data[index + 3];
    
                const integralIndex = (y + 1) * (width + 1) + (x + 1);
                integralR[integralIndex] = r + integralR[integralIndex - 1] + integralR[integralIndex - (width + 1)] - integralR[integralIndex - (width + 2)];
                integralG[integralIndex] = g + integralG[integralIndex - 1] + integralG[integralIndex - (width + 1)] - integralG[integralIndex - (width + 2)];
                integralB[integralIndex] = b + integralB[integralIndex - 1] + integralB[integralIndex - (width + 1)] - integralB[integralIndex - (width + 2)];
                integralA[integralIndex] = a + integralA[integralIndex - 1] + integralA[integralIndex - (width + 1)] - integralA[integralIndex - (width + 2)];
            }
        }
    
        // looping over pixels and blurring 
        const result = new Uint8ClampedArray(data.length);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const x0 = Math.max(0, x - radius);
                const x1 = Math.min(width - 1, x + radius);
                const y0 = Math.max(0, y - radius);
                const y1 = Math.min(height - 1, y + radius);
    
                const area = (x1 - x0 + 1) * (y1 - y0 + 1);
    
                const topLeft = (y0 * (width + 1)) + x0;
                const topRight = (y0 * (width + 1)) + x1 + 1;
                const bottomLeft = ((y1 + 1) * (width + 1)) + x0;
                const bottomRight = ((y1 + 1) * (width + 1)) + x1 + 1;
    
                const sumR = integralR[bottomRight] - integralR[bottomLeft] - integralR[topRight] + integralR[topLeft];
                const sumG = integralG[bottomRight] - integralG[bottomLeft] - integralG[topRight] + integralG[topLeft];
                const sumB = integralB[bottomRight] - integralB[bottomLeft] - integralB[topRight] + integralB[topLeft];
                const sumA = integralA[bottomRight] - integralA[bottomLeft] - integralA[topRight] + integralA[topLeft];
    
                const index = (y * width + x) * 4;
                result[index] = sumR / area;
                result[index + 1] = sumG / area;
                result[index + 2] = sumB / area;
                result[index + 3] = sumA / area;
            }
        }
    
        // write back to canvas
        for (let i = 0; i < data.length; i++) {
            data[i] = result[i];
        }
        this.ctx.putImageData(imageData, 0, 0);
    
        console.log("Blur finished!");
    }

    gaussianBlur () {
        if (this.kernel == undefined) throw new Error("You must specify the sigma for gaussian blur when constructing the EulerImg.")
        console.log("Gaussian blur loading...");
    
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;

        const horizontal = apply1DGaussianBlur(data, imageData.width, imageData.height, this.kernel, true);
        const verticalBlur = apply1DGaussianBlur(horizontal, imageData.width, imageData.height, this.kernel, false);

        // write back to canvas
        this.ctx.putImageData(new ImageData(verticalBlur, imageData.width, imageData.height), 0, 0);
    
        console.log("Blur finished!");
    }

    keyPointDetection(spacing: number, threshold: number, outermostPoints: boolean = false, updateImg: boolean = false, newPathImg: boolean = false) {
        console.log("Key points loading...")

        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
    
        // Compute gradients (Sobel operator)
        const gradients = computeGradients(data, width, height);
    
        // for pixels, if contrast gradient is below thresh ignore
        this.keyPoints = [];
        for (let y = 0; y < height; y += spacing) {
            for (let x = 0; x < width; x += spacing) {
                const idx = y * width + x;
                if (gradients[idx] > threshold) {
                    this.keyPoints.push( [x, y] );
                }
            }
        }

        if (outermostPoints) {
            this.keyPoints = concaveman(this.keyPoints)
            console.log(this.keyPoints, "after jarvis")
        }
    
        if (updateImg) {
            var radius = 2
            
            this.keyPoints.forEach(coord => {
                for (var ky = -radius; ky <= radius; ky++) {
                    for (var kx = -radius; kx <= radius; kx++) {
                        var coordIndex = (coord[1] + ky) * width * 4 + (coord[0] + kx) * 4

                        data[coordIndex] = 176
                        data[coordIndex + 1] = 244
                        data[coordIndex + 2] = 230
                        data[coordIndex + 3] = 255
                    }
                }
     
            });

            this.ctx.putImageData(imageData, 0, 0);

        } 
        if (newPathImg) {
            const newCanvas = document.createElement("canvas")
            const newCtx = newCanvas.getContext('2d')
            newCanvas.width = this.img.width
            newCanvas.height = this.img.height
            const newImgData = newCtx.createImageData(newCanvas.width, newCanvas.height) 
            const newData = newImgData.data
            newData.fill(0)
            const radius = 2
            
            this.keyPoints.forEach(coord => {
                for (var ky = -radius; ky <= radius; ky++) {
                    for (var kx = -radius; kx <= radius; kx++) {
                        var coordIndex = (coord[1] + ky) * width * 4 + (coord[0] + kx) * 4

                        newData[coordIndex] = 255
                        newData[coordIndex + 1] = 0
                        newData[coordIndex + 2] = 0
                        newData[coordIndex + 3] = 255
                    }
                }
     
            });

            newCtx.putImageData(newImgData, 0, 0);

        }
        console.log("Key points obtained!")
        return this.keyPoints;
    }    

    optimizeTransformation(keyPointsToMap: Array<Array<number>>) {
        // this.keypoints stays constant, spits out transformation vars for the keypointstomap

        const Y = tf.tensor(this.keyPoints); // Tensor of size n x 2
        const X = tf.tensor(keyPointsToMap); // Tensor of size n x 2
    
        const scale = tf.variable(tf.scalar(Math.random()));
        const theta = tf.variable(tf.scalar(Math.random()));
        const translation = tf.variable(tf.randomUniform([1, 2])); // Tensor of size 1 x 2
    
        const transformX = (X: tf.Tensor) => {
            const cosTheta = tf.cos(theta);
            const sinTheta = tf.sin(theta);
            const rotation = tf.stack([
                tf.concat([cosTheta, tf.neg(sinTheta)], 0),
                tf.concat([sinTheta, cosTheta], 0)
            ]);
    
            const scaledRotated = tf.matMul(X, rotation).mul(scale); 
            const tiledTranslation = translation.tile([X.shape[0], 1]); 
            return scaledRotated.add(tiledTranslation); 
        };

        const optimizer = tf.train.adam(0.01); 

        async function optimize() {
            for (let i = 0; i < 100; i++) {
                optimizer.minimize(() => {
                    const X_prime = transformX(X);
                    return HausdorffDistance(X_prime, Y); 
                });
    
                console.log(`Iteration ${i + 1}`);
                console.log('Scale:', scale.dataSync(), 'Theta:', theta.dataSync(), 'Translation:', translation.dataSync());
            }
        }
    
        optimize().then(() => {
            console.log('Optimization complete');
            console.log('Final Scale:', scale.dataSync());
            console.log('Final Theta:', theta.dataSync());
            console.log('Final Translation:', translation.dataSync());
        });
    }

}

//  Hausdorff distance for similarity scorer
const HausdorffDistance = (points1: tf.Tensor, points2: tf.Tensor) => {
    const dist1 = directedHausdorff(points1, points2);
    const dist2 = directedHausdorff(points2, points1);
    return tf.max(tf.concat([dist1, dist2])) as tf.Scalar
};

const directedHausdorff = (set1: tf.Tensor, set2: tf.Tensor) => {
    const expandedSet1 = tf.expandDims(set1, 1); // shape: [n1, 1, 2]
    const expandedSet2 = tf.expandDims(set2, 0); // shape: [1, n2, 2]
    const pairwiseDistances = tf.sqrt(tf.sum(tf.square(tf.sub(expandedSet1, expandedSet2)), 2)); // shape: [n1, n2]
    return tf.max(tf.min(pairwiseDistances, 1)); // Min distance per point in set1, then max of those.
};


// GAUSSIAN BLUR FUNCTIONS
function generateGaussianKernel(sigma, radius) {
    const kernel = [];
    const factor = 1 / (Math.sqrt(2 * Math.PI) * sigma);
    let sum = 0;
    
    for (let i = -radius; i <= radius; i++) {
      const value = factor * Math.exp(-0.5 * (i * i) / (sigma * sigma));
      kernel.push(value);
      sum += value;
    }
    return kernel.map(v => v / sum); // normalize
  }

function apply1DGaussianBlur(data, width, height, kernel, isHorizontal) {
    const result = new Uint8ClampedArray(data.length);
    const radius = Math.floor(kernel.length / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIndex = (y * width + x) * 4;
        const sum = [0, 0, 0, 0];
        var nullWeights = []

        for (let k = -radius; k <= radius; k++) {
          const offset = isHorizontal ? k : k * width;
          const neighborIndex = pixelIndex + offset * 4;
        
          if (
            (isHorizontal && x + k >= 0 && x + k < width) || 
            (!isHorizontal && y + k >= 0 && y + k < height)
          ) {
            const weight = kernel[k + radius];
            sum[0] += data[neighborIndex] * weight
            sum[1] += data[neighborIndex + 1] * weight; 
            sum[2] += data[neighborIndex + 2] * weight; 
            sum[3] += data[neighborIndex + 3] * weight; 
          } else {
             nullWeights.push(kernel[k + radius])
          }
        }
        // correct for null pixels
        nullWeights.forEach((weight) => {
            sum[0] += data[pixelIndex] * weight
            sum[1] += data[pixelIndex + 1] * weight; 
            sum[2] += data[pixelIndex + 2] * weight; 
            sum[3] += data[pixelIndex + 3] * weight; 
        })

        result[pixelIndex] = sum[0];
        result[pixelIndex + 1] = sum[1];
        result[pixelIndex + 2] = sum[2];
        result[pixelIndex + 3] = sum[3];
      }
    }

    return result
}

// convex hull functions
function jarvisAlgorithm(points: Array<Array<number>>) {
    const n = points.length
    if (n < 3) return;
    var hull: Array<Array<number>> = [];
    
    var l = 0;
    for (var i = 1; i < n; i++)
        if (points[i][0] < points[l][0])
            l = i;
    
    var p = l, q;
    do {
        console.log(p)
        hull.push(points[p]);
    
        q = (p + 1) % n;
            
        for (var i = 0; i < n; i++) {
            if (orientation(points[p], points[i], points[q]) == 2) q = i;
        }
        p = q;
    } while (p != l)
    return hull
}


// GENERAL FUNCTIONS

function computeGradients(data, width, height) {
    const gradients = new Float32Array(width * height);
    // Sobel kernels
    const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let gxSum = 0, gySum = 0;
            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    const pixel = data[((y + ky) * width + (x + kx)) * 4]; // Grayscale intensity
                    gxSum += pixel * gx[(ky + 1) * 3 + (kx + 1)];
                    gySum += pixel * gy[(ky + 1) * 3 + (kx + 1)];
                }
            }
            gradients[y * width + x] = Math.sqrt(gxSum ** 2 + gySum ** 2);
        }
    }

    return gradients;
}

function reshape(array, rows: number, cols: number) {
    if (rows * cols !== array.length) {
        throw new Error("Invalid dimensions for reshape");
    }

    const result = [];
    for (let i = 0; i < rows; i++) {
        result.push(array.slice(i * cols, (i + 1) * cols));
    }
    return result;
}
function concatenate(uint8arrays) {
    // Determine the length of the result.
    const totalLength = uint8arrays.reduce(
      (total, uint8array) => total + uint8array.byteLength,
      0
    );
  
    // Allocate the result.
    const result = new Uint8ClampedArray(totalLength);
  
    // Copy each Uint8Array into the result.
    let offset = 0;
    uint8arrays.forEach((uint8array) => {
      result.set(uint8array, offset);
      offset += uint8array.byteLength;
    });
  
    return result;
}


function orientation(p: Array<number>, q: Array<number>, r: Array<number>) {
    let val = (q[1] - p[1]) * (r[0] - q[0]) -
                  (q[0] - p[0]) * (r[1] - q[1]);
        
        if (val == 0) return 0;  // collinear
        return (val > 0)? 1: 2; // clock or counterclock wise
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

function distance(pointA, pointB) {
    // Euclidean distance
    const dx = pointA[0] - pointB[0];
    const dy = pointA[1] - pointB[1];
    return Math.sqrt(dx * dx + dy * dy);
}