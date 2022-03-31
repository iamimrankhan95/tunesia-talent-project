import { getMethodsNames } from '../utils/utils';

const fs = require('fs');

class CustomSanitizers {

    get() {
        let sanitizers: any = {};
        for (let method of getMethodsNames(this, 'get')) {
            sanitizers[method] = this.constructor.prototype[method];
        }
        // fs.readdirSync(__dirname + '/../../app/common/sanitizers').forEach((file: any) => {
        //     const sanitizer = require(__dirname + '/../../app/common/sanitizers/' + file);
        //     sanitizers[Object.keys(sanitizer)[0]] = sanitizer[Object.keys(sanitizer)[0]];
        // });
        return sanitizers;
    }


}

export let customSanitizers = new CustomSanitizers();
