import { defaultMetadataArgsStorage, MiddlewareInterface } from 'routing-controllers';
import { UseMetadataArgs } from 'routing-controllers/metadata/args/UseMetadataArgs';
import { MiddlewareMetadataArgs } from 'routing-controllers/metadata/args/MiddlewareMetadataArgs';
import { instanceName } from '../utils/utils';

export const Validate = (fields: any[]): Function => {
    return (objectOrFunction: Object | Function, methodName?: string) => {

        const controllerName = instanceName(objectOrFunction).replace('Controller', '');

        class ValidationMiddleware implements MiddlewareInterface {
            use(request: any, response: any, next?: (err?: any) => any): any {
                let acceptedFields: string[] = [];
                let originalAssert = request.assert;
                request.assert = (param: any, failMsg: any) => {
                    acceptedFields.push(param);
                    return originalAssert(param, failMsg);
                };
                for (let field of fields) {
                    if (typeof field === 'string' || field instanceof String) {
                        request.assert(field);
                    } else {
                        for (let validator of field.validation) {
                            let assert = request.assert(field.field, validator.message);
                            if (validator.args) {
                                assert[validator.value].apply(assert, validator.args);
                            } else {
                                assert[validator.value].apply(assert);
                            }
                        }
                    }
                }
                // require(__dirname + '/../../app/controllers/validators/' + controllerName + 'Validator.js')[controllerName + 'Validator'][methodName](request, response);
                request.getValidationResult().then((result: any) => {
                    for (let field in request.body) {
                        if (acceptedFields.indexOf(field) === -1) {
                            delete request.body[field];
                        }
                    }
                    for (let field in request.params) {
                        if (acceptedFields.indexOf(field) === -1) {
                            delete request.params[field];
                        }
                    }
                    for (let field in request.query) {
                        if (acceptedFields.indexOf(field) === -1) {
                            delete request.query[field];
                        }
                    }
                    if (result.isEmpty()) {
                        next();
                    } else {
                        let parsedResult: any = {};
                        for (let field in result.mapped()) {
                            let error = result.mapped()[field].msg;
                            if (request.errors) {
                                error = request.errors;
                            }
                            console.error(error);
                            parsedResult[field] = error;
                        }
                        response.status(400).send(parsedResult);
                    }
                });
            }

        }

        const metadataMiddleware: MiddlewareMetadataArgs = {
            target: ValidationMiddleware,
            isGlobal: false,
            priority: 0,
            afterAction: false
        };
        defaultMetadataArgsStorage().middlewares.push(metadataMiddleware);

        const metadataFunction: UseMetadataArgs = {
            middleware: ValidationMiddleware,
            target: methodName ? objectOrFunction.constructor : objectOrFunction as Function,
            method: methodName,
            afterAction: false
        };
        defaultMetadataArgsStorage().uses.push(metadataFunction);
    };
};
