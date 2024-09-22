function toRowByColumnICO(uint8Array, width) {
    let rows = [], rowLength = width * 4; // Each pixel is represented by 4 values (RGBA)
    for (let i = 0; i < uint8Array.length; i += rowLength) {
        let row = uint8Array.slice(i, i + rowLength); // Extract a row
        rows.push([...row]); // Convert Uint8Array to regular array for easier manipulation
    }
    // Reverse the rows to make the image upside down (as required by ICO/EXE formats)
    rows.reverse();
    return rows.map(row => row.map(pixel => String.fromCharCode(pixel + 1)).join('')).join('\n');
    // + 1 is used to prevent null characters
}
function toCopiesOfDimensions(uint8Array, width, copies) {
    function repeat(array, times) {
      const newarray = [];
      for (let j = 0; j < times; j++) {
        for (const item of array) {
            newarray.push(new Uint8Array([...item]));
        }
      }
      return newarray;
    }
    // This creates copies of one image so that the icon can be viewed in different dimensions
    let j = 0.5;
    return repeat([uint8Array], copies).map(i => {
      j = j * 2;
      const array = [...i], targetArray = [];
      for (let i = 0; i < array.length; i += j) {
        // Now we must apply a different color
        targetArray.push(array[i]);
      }
      return [j, new Uint8Array(targetArray)]; // Convert back into the Uint8Arrays
    }).map(image => {
        return toRowByColumnICO(image[1], image[0]); // Reusing a function because I'm lazy :|
    }).join("\nā") + "Ă";
}
