import { Schema as MongooseSchema } from 'mongoose';
import { pluginsSymbol } from './Plugin';
import { getMethodsNames, instanceName, lowercaseFirstLetter } from '../utils/utils';
import { DB } from './DB';

const fs = require('fs');
const hooksSymbol = Symbol('hooks');
const mongooseDelete = require('mongoose-delete');
// const timestamps = require("mongoose-timestamp");
const optionNames: any = [
    'autoIndex', 'bufferCommands', 'capped', 'collection', 'emitIndexErrors',
    'id', '_id', 'minimize', 'read', 'safe', 'shardKey', 'strict', 'timestamps',
    'toJSON', 'toObject', 'typeKey', 'validateBeforeSave', 'versionKey'
];

const ignoreStatics: any = {length: true, name: true, prototype: true, schema: true};

optionNames.forEach((name: any) => {
    ignoreStatics[name] = true;
});

const makeSchema = (options: any) => (Class: any) => {
    return function SchemaConstructor() {
        const types = DB.getInstance().schemas[Class.name];
        const methods = getMethodsNames(Class);
        const classOptions: any = optionNames.reduce((opts: any, name: any) => {
            if (name in Class) {
                opts[name] = Class[name];
            }
            return opts;
        }, {});
        // options passed to the decorator constructor override options defined in
        // the class body
        const schema: any = new MongooseSchema(types, Object.assign(classOptions, options));
        methods.forEach((name: any) => {
            const prop = Object.getOwnPropertyDescriptor(Class.prototype, name);
            if (typeof prop.get === 'function') {
                schema.virtual(name).get(prop.get);
            }
            if (typeof prop.set === 'function') {
                schema.virtual(name).set(prop.set);
            }
            if ('value' in prop) {
                schema.method(name, prop.value);
            }
        });

        if (Class[pluginsSymbol]) {
            Class[pluginsSymbol].forEach(({plugin, param}: any) => {
                schema.plugin(plugin, param);
            });
        }

        if (DB.getInstance().hooks[Class.name]) {
            DB.getInstance().hooks[Class.name].forEach(([hookName, method, cb]: any) => {
                if (cb.length === 0) {
                    schema[hookName](method, function (next: any) {
                        cb.call(this, next);
                        /*                        if (hookName !== "post") {
                         //next();
                         }*/
                    });
                } else {
                    schema[hookName](method, cb);
                }
            });
        }

        // schema.plugin(timestamps);
        schema.plugin(mongooseDelete, {overrideMethods: true, deletedAt: true, deletedBy: true});
        let mainQuery = require(__dirname + '/../../app/Shared/data/queries/MainQuery.js').mainQuery;
        let classQuery;
        if (fs.existsSync(__dirname + '/../../app/' + Class.name + '/data/queries/' + Class.name + 'Query.js')) {
            classQuery = require(__dirname + '/../../app' + +Class.name + '/data/queries/' + Class.name + 'Query.js')[lowercaseFirstLetter(Class.name + 'Query')];
        }
        schema.query = {};
        for (let method of getMethodsNames(mainQuery)) {
            schema.query[method] = mainQuery[method];
        }
        if (classQuery) {
            for (let method of getMethodsNames(classQuery)) {
                schema.query[method] = classQuery[method];
            }
        }
        // schema.query = Object.assign({}, DB.getInstance().queries[Class.name], DB.getInstance().queries["Main"]);
        return schema;
    };
};

export const Schema = (options: any): Function => {
    // bare @Schema decorator
    if (typeof options === 'function') {
        return makeSchema({})(options);
    }

    // @Schema()
    if (!options) {
        return makeSchema({});
    }

    let plugins: any[] = [];

    // @Schema(options)
    if (typeof options === 'object' && options.plugins) {
        plugins = options.plugins.map((plugin: any) => Array.isArray(plugin)
            ? {plugin: plugin[0], param: plugin[1]}
            : {plugin: plugin});
    }

    return (Class: any) => {
        if (Class[pluginsSymbol]) {
            Class[pluginsSymbol] = [...Class[pluginsSymbol], ...plugins];
        } else {
            Class[pluginsSymbol] = plugins;
        }

        return makeSchema(options)(Class);
    };
};
// TODO fix hooks for parent class to be shared
export const hook = (hookName: any, method: any) => {
    return (proto: any, name: any, descriptor: any) => {
        const Class = proto.constructor;
        if (!DB.getInstance().hooks[Class.name]) {
            DB.getInstance().hooks[Class.name] = [];
        }
        DB.getInstance().hooks[Class.name].push([hookName, method, descriptor.value]);
    };
};

export const pre = (method: any) => {
    return hook('pre', method);
};

export const post = (method: any) => {
    return hook('post', method);
};

export const field = (definition: any) => {
    return (target: any, key: string) => {
        if (!DB.getInstance().schemas[instanceName(target)]) {
            DB.getInstance().schemas[instanceName(target)] = {};
        }
        DB.getInstance().schemas[instanceName(target)][key] = definition;
    };
};

export const query = () => {
    return (target: any, key: string, descriptor: any) => {
        if (!DB.getInstance().queries[instanceName(target).replace('Query', '')]) {
            DB.getInstance().queries[instanceName(target).replace('Query', '')] = {};
        }
        DB.getInstance().queries[instanceName(target).replace('Query', '')][key] = descriptor.value;
    };
};
