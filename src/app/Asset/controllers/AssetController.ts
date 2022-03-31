import { JsonController, Post, Req, Res, UploadedFile } from 'routing-controllers';
import { S3 } from '../services/S3';
import { ImageHandler } from '../services/ImageHandler';

@JsonController()
export class AssetController {

    @Post('/assets/upload/image')
    async uploadImage(@Req() req: any, @Res() res: any, @UploadedFile('file') file: any) {

        try {
            let handler = new ImageHandler(file);
            await handler
                .prepareUploadingS3()
                .wait();
            res.send(handler.displayResult());
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Post('/assets/upload/file')
    async upload(@Req() req: any, @Res() res: any, @UploadedFile('file') file: any) {
        try {
            let url = await S3.getInstance().uploadBuffer(file.buffer, file.originalname, process.env.BUCKET);
            res.send({url: url, name: file.originalname, size: file.buffer.length});
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

}
