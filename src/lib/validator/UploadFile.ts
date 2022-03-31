const multer = require('multer');
import { defaultMetadataArgsStorage, MiddlewareInterface } from 'routing-controllers';
import { MiddlewareMetadataArgs } from 'routing-controllers/metadata/args/MiddlewareMetadataArgs';
import { UseMetadataArgs } from 'routing-controllers/metadata/args/UseMetadataArgs';

export const UploadFile = (name: string): Function => {
    return (objectOrFunction: Object | Function, methodName?: string) => {

        class UploadFileMiddleware implements MiddlewareInterface {
            use(request: any, response: any, next?: (err?: any) => any): any {
                multer().single(name)(request, response, (err: any) => {
                    if (err || !request.file) {
                        response.status(400).send(err);
                    } else {
                        next();
                    }
                });

            }

        }

        const metadataMiddleware: MiddlewareMetadataArgs = {
            target: UploadFileMiddleware,
            isGlobal: false,
            priority: 0,
            afterAction: false
        };
        defaultMetadataArgsStorage().middlewares.push(metadataMiddleware);

        const metadataFunction: UseMetadataArgs = {
            middleware: UploadFileMiddleware,
            target: methodName ? objectOrFunction.constructor : objectOrFunction as Function,
            method: methodName,
            afterAction: false
        };
        defaultMetadataArgsStorage().uses.push(metadataFunction);
    };
};
