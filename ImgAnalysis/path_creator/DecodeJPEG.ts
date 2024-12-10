import jpeg from 'jpeg-js';

// Read the JPEG data (e.g., from a file or an API response)
fetch('image.jpg')
  .then(response => response.arrayBuffer())
  .then(buffer => {
    // Decode the JPEG data
    const rawImageData = jpeg.decode(buffer);

    // Access the decoded image data
    console.log(rawImageData.width);
    console.log(rawImageData.height);
    console.log(rawImageData.data); // Contains the pixel data
  });