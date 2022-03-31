import { getMethodsNames } from '../utils/utils';
import * as path from 'path';

const fs = require('fs');

class CustomValidators {

    get() {
        let validators: any = {};
        for (let method of getMethodsNames(this, 'get')) {
            validators[method] = this.constructor.prototype[method];
        }
        const validatorFiles = [__dirname + '/../../app/**/validators/*.js'].reduce((allDirs, dir) => {
            return allDirs.concat(require('glob').sync(path.normalize(dir)));
        }, [] as string[]);
        for (let file of validatorFiles) {
            const validator = require(file);
            validators[Object.keys(validator)[0]] = validator[Object.keys(validator)[0]];
        }
        return validators;
    }

}

export let customValidators = new CustomValidators();
