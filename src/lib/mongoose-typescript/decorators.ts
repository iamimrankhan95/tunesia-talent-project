import * as mongoose from 'mongoose';
import { Schema } from './Schema';
import { DB } from './DB';

export function Model(name: any, options?: any) {
    return (Class: any) => {
        // options.connection || Class.connection ||
        const connection = mongoose;
        const SchemaConstructor = Schema(options || {})(Class);
        DB.getInstance().models[Class.name] = connection.model(name, new SchemaConstructor());
        DB.getInstance().modelReady();
    };
};
