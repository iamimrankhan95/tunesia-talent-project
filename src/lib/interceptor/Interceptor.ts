import { defaultMetadataArgsStorage, MiddlewareInterface } from 'routing-controllers';
import { UseMetadataArgs } from 'routing-controllers/metadata/args/UseMetadataArgs';
import { MiddlewareMetadataArgs } from 'routing-controllers/metadata/args/MiddlewareMetadataArgs';
import { instanceName } from '../utils/utils';

export const Intercept = (): Function => {
    return (objectOrFunction: Object | Function, methodName?: string) => {

        const controllerName = instanceName(objectOrFunction).replace('Controller', '');

        class InterceptorMiddleware implements MiddlewareInterface {
            use(request: any, response: any, next?: (err?: any) => any): any {
                require(__dirname + '/../../app/controllers/interceptors/' + controllerName + 'Interceptor.js')[controllerName + 'Interceptor'][methodName](request, response);
                next();
            }

        }

        const metadataMiddleware: MiddlewareMetadataArgs = {
            target: InterceptorMiddleware,
            isGlobal: false,
            priority: 0,
            afterAction: false
        };
        defaultMetadataArgsStorage().middlewares.push(metadataMiddleware);

        const metadataFunction: UseMetadataArgs = {
            middleware: InterceptorMiddleware,
            target: methodName ? objectOrFunction.constructor : objectOrFunction as Function,
            method: methodName,
            afterAction: false
        };
        defaultMetadataArgsStorage().uses.push(metadataFunction);
    };
};
