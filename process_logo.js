import Jimp from 'jimp';

Jimp.read('C:\\Users\\Aluno\\.gemini\\antigravity\\brain\\c567ba1a-423f-4144-a857-f4f85250512b\\media__1779841888952.jpg')
  .then(image => {
    // Scan all pixels and set the white background to transparent
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      // If the pixel is close to white (background), make it transparent
      if (r > 240 && g > 240 && b > 240) {
        this.bitmap.data[idx + 3] = 0; // Alpha channel to 0 (transparent)
      }
    });
    
    // Trim the transparent edges to make the logo tightly cropped and perfectly aligned
    image.autocrop();
    
    return image.writeAsync('d:\\Jefferson Bogdanowicz\\JT Advocacia\\src\\assets\\logo.png');
  })
  .then(() => {
    console.log('Logo processado com sucesso e salvo em src/assets/logo.png!');
  })
  .catch(err => {
    console.error('Erro ao processar o logo:', err);
  });
