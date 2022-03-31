const AWS = require('aws-sdk');
const uuidv1 = require('uuid/v1');
const fs = require('fs');
const fileType = require('file-type');

export class S3 {

    private static instance: S3;
    client: any;

    constructor() {
        this.client = new AWS.S3({
            accessKeyId: process.env.ACCESS_KEY_ID,
            secretAccessKey: process.env.SECRET_ACCESS_KEY,
            region: process.env.REGION,
            endpoint: process.env.S3_ENDPOINT
        });
    }

    static getInstance() {
        if (!S3.instance) {
            S3.instance = new S3();
        }
        return S3.instance;
    }

    uploadBuffer(buffer: any, fileId: string = 'image.jpg', bucket: string = process.env.BUCKET, fileName?: string) {
        return new Promise((resolve: Function, reject: Function) => {
            let tempFile = '/tmp/' + fileId;
            fs.writeFile(tempFile, buffer, 'binary', (err: any) => {
                if (err) {
                    reject(err);
                }
                if (!fileName) {
                    fileName = uuidv1() + '-' + fileId;
                }
                resolve(this.upload(tempFile, fileName, bucket));
            });
        });
    }

    upload(filePath: any, fileId: string, bucket: string) {

        let body = fs.readFileSync(filePath);

        let params = {
            Body: body,
            Bucket: bucket,
            Key: fileId,
            ACL: process.env.BUCKET_ACL,
            ContentType: fileType(body) && fileType(body).mime ? fileType(body).mime : fileId.indexOf('.svg') > -1 ? 'image/svg+xml' : null
        };

        return new Promise((resolve: Function, reject: Function) => {

            this.client.putObject(params, (err: any, data: any) => {
                if (err) {
                    reject(err);
                    return;
                }
                console.info('Successfully uploaded : ' + process.env.BUCKET_BASE_URL + bucket + '/' + fileId);
                resolve(process.env.BUCKET_BASE_URL + bucket + '/' + fileId);
            });
        });
    }
}
