const fileType = require('file-type');
const allowedMimes = ['image/png', 'image/jpg', 'image/jpeg'];
const maxFileSize = 1024 * 1024 * 5;
// const sharp = require('sharp');

class ImageUtils {

    isValid(image: any) {
        return fileType(image.buffer) != null &&
            allowedMimes.indexOf(fileType(image.buffer).mime) >= 0 &&
            image.buffer.length <= maxFileSize;
    }

    // resize(imageBuffer: any, width: number, height: number) {
    //     return sharp(imageBuffer).resize(width, height).toBuffer();
    // }
    //
    // compress(imageBuffer: any) {
    //     let query = sharp(imageBuffer);
    //     switch (fileType(imageBuffer).mime) {
    //         case  'image/png':
    //             query.png({compressionLevel: 6});
    //             break;
    //         default :
    //             query.jpeg({quality: 60});
    //     }
    //     return query.toBuffer();
    // }
}

export let imageUtils = new ImageUtils();
