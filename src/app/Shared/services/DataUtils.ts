const bs = require('binarysearch');
const json2csv = require('json2csv');
const fs = require('fs');
const uuid = require('node-uuid');

class DataUtils {

    shuffleArray(original: any[]) {

        if (original.length < 2) {
            return;
        }
        let temp = original.slice();
        do {
            for (let i = original.length; i; i--) {
                let j = Math.floor(Math.random() * i);
                [original[i - 1], original[j]] = [original[j], original[i - 1]];
            }
        }
        while (JSON.stringify(original) === JSON.stringify(temp));
    }


    deepClone(data: any) {
        return JSON.parse(JSON.stringify(data));
    }

    rapidDeepClone(o: any) {
        let newO: any, i: any;

        if (typeof o !== 'object') {
            return o;
        }
        if (!o) {
            return o;
        }

        if ('[object Array]' === Object.prototype.toString.apply(o)) {
            newO = [];
            for (i = 0; i < o.length; i += 1) {
                newO[i] = this.rapidDeepClone(o[i]);
            }
            return newO;
        }
        newO = {};
        for (i in o) {
            if (o.hasOwnProperty(i)) {
                newO[i] = this.rapidDeepClone(o[i]);
            }
        }
        return newO;
    }

    getUniqueArray(array: any[]) {
        let length = array.length, result = [], seen = new Set();
        outer:
            for (let index = 0; index < length; index++) {
                let value = array[index];
                if (seen.has(value)) continue outer;
                seen.add(value);
                result.push(value);
            }
        return result;
    }

    sort(array: any[], key: string, order: any = 1): any {
        let len = array.length;
        if (len < 2) {
            return array;
        }
        let pivot = Math.ceil(len / 2);
        return this.merge(this.sort(array.slice(0, pivot), key, order), this.sort(array.slice(pivot), key, order), key, order);
    }

    private merge(left: any, right: any, key: any, order: any) {
        let result = [];
        while ((left.length > 0) && (right.length > 0)) {
            if (left[0][key] > right[0][key]) {
                if (order > 0) {
                    result.push(right.shift());
                } else {
                    result.push(left.shift());
                }
            } else {
                if (order > 0) {
                    result.push(right.shift());
                } else {
                    result.push(left.shift());
                }
            }
        }

        result = result.concat(left, right);
        return result;
    }
}

export let dataUtils = new DataUtils();
