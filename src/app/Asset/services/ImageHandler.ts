import { S3 } from './S3';

const fileType = require('file-type');

export class ImageHandler {

    static S3_SERVICE = 's3';
    static COMPRESSION_SERVICE = 'compression';
    static RESIZE_SERVICE = 'resize';
    static SEO_SERVICE = 'seo';

    image: any;
    seoUrl: string = null;
    s3Url: string = null;
    promises: any[] = [];
    promisesIndex: any = {};
    resizedImageBuffer: any;
    compressedImageBuffer: any;

    done: any;

    constructor(image: any) {
        this.image = image;
    }

    isServiceExist(service: string) {
        return typeof this.promisesIndex[service] !== 'undefined';
    }

    // prepareCompression() {
    //     if (this.isServiceExist(ImageHandler.COMPRESSION_SERVICE)) {
    //         console.error('ERROR: already added this service !!');
    //         return this;
    //     }
    //     this.promisesIndex[ImageHandler.COMPRESSION_SERVICE] = this.promises.length;
    //     this.promises.push({fn: imageUtils.compress, args: [this.image.buffer], context: this});
    //     return this;
    // }

    // prepareResizing(width: number, height: number) {
    //     if (this.isServiceExist(ImageHandler.RESIZE_SERVICE)) {
    //         console.error('ERROR: already added this service !!');
    //         return this;
    //     }
    //     this.promisesIndex[ImageHandler.RESIZE_SERVICE] = this.promises.length;
    //     let image = this.isServiceExist(ImageHandler.COMPRESSION_SERVICE) ? 'RT_compressedImageBuffer' : this.image.buffer;
    //     this.promises.push({fn: imageUtils.resize, args: [image, width, height], context: this});
    //     return this;
    // }

    prepareUploadingS3() {
        if (this.isServiceExist(ImageHandler.S3_SERVICE)) {
            console.error('ERROR: already added this service !!');
            return this;
        }
        this.promisesIndex[ImageHandler.S3_SERVICE] = this.promises.length;
        let image = this.isServiceExist(ImageHandler.COMPRESSION_SERVICE) ? 'RT_compressedImageBuffer' : this.image.buffer;
        let type = fileType(this.image.buffer);
        let s3FileExtension = 'image.' + type.ext;
        this.promises.push({fn: S3.getInstance().uploadBuffer, args: [image, s3FileExtension], context: S3.getInstance()});
        return this;
    }

    // prepareSEOCopy(prepare: boolean) {
    //     if (!prepare) {
    //         return this;
    //     }
    //     if (this.isServiceExist(ImageHandler.SEO_SERVICE)) {
    //         console.error('ERROR: already added this service !!');
    //         return this;
    //     }
    //     if (!this.isServiceExist(ImageHandler.COMPRESSION_SERVICE)) {
    //         this.prepareCompression();
    //     }
    //     this.prepareResizing(750, 422);
    //     let s3FileExtension = 'image.' + fileType(this.image.buffer).ext;
    //     this.promisesIndex[ImageHandler.SEO_SERVICE] = this.promises.length;
    //     this.promises.push({
    //         fn: S3.getInstance().uploadBuffer,
    //         args: ['RT_resizedImageBuffer', s3FileExtension],
    //         context: S3.getInstance()
    //     });
    //     return this;
    // }

    wait() {
        return new Promise((resolve: Function) => {
            this.done = resolve;
            this.work();
        });
    }

    work() {
        if (this.promises.length === 0) {
            this.done();
        } else {
            let job = this.promises.shift();
            this.doJob(job);
        }
    }

    doJob(job: any) {
        let jobType = this.getCurrentJobType();
        job.fn.call(job.context, ...this.assignRealTimeArgument(job.args))
            .then((data: any) => {
                if (jobType === ImageHandler.COMPRESSION_SERVICE) {
                    this.compressedImageBuffer = data;
                }
                if (jobType === ImageHandler.RESIZE_SERVICE) {
                    this.resizedImageBuffer = data;
                }

                if (jobType === ImageHandler.S3_SERVICE) {
                    this.s3Url = data;
                }

                if (jobType === ImageHandler.SEO_SERVICE) {
                    this.seoUrl = data;
                }
                this.work();
            });
    }

    assignRealTimeArgument(args: any[]) {
        let realArgs: any[] = [];
        for (let arg of args) {
            if (typeof arg === 'string' && arg.indexOf('RT_') > -1) {
                let imgHandler: any = this;
                let rtArg: any = imgHandler[arg.replace('RT_', '')];
                realArgs.push(rtArg);
            } else {
                realArgs.push(arg);
            }
        }
        return realArgs;
    }

    getCurrentJobType() {
        let currentIndex = Object.keys(this.promisesIndex).length - this.promises.length - 1;
        for (let service in this.promisesIndex) {
            if (this.promisesIndex.hasOwnProperty(service)) {
                if (this.promisesIndex[service] === currentIndex) {
                    return service;
                }
            }
        }
        return null;
    }

    displayResult() {
        let result: any = {url: this.s3Url};
        if (this.seoUrl) {
            result.seoUrl = this.seoUrl;
        }
        return result;
    }

}
