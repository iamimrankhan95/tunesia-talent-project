import { MiddlewareGlobalAfter, MiddlewareInterface } from 'routing-controllers';

@MiddlewareGlobalAfter()
export class FileMiddleware implements MiddlewareInterface {

    use(request: any, response: any, next?: (err?: any) => any): any {
        if (request.downloadFile) {
            response.sendFile(request.downloadFile);
        } else {
            next();
        }
    }
}
