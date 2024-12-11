const root = document.getElementById("root");
const text = document.createElement("h2");
text.innerHTML = "yo";
root === null || root === void 0 ? void 0 : root.appendChild(text);
export {};
// export default CreateImgPath
// function CreateImgPath(jpeg_path: string) {
//     var jpeg_data = fs.readFileSync(jpeg_path);
//     var raw_jpeg_data = jpeg.decode(jpeg_data);
//     console.log(raw_jpeg_data)
// }
