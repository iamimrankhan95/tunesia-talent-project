import * as mongoose from 'mongoose';
import * as path from 'path';

(<any>mongoose).Promise = Promise;
(<any>mongoose).set('debug', true);
const fs = require('fs');

export class DB {

    private static instance: DB;
    models: any = {};
    schemas: any = {};
    readySchemas: any = {};
    hooks: any = {};
    queries: any = {};
    modelsReady = 0;
    modelsLength = 0;
    wait: Promise<boolean>;
    resolve: Function;
    alreadyResolved = false;

    static getInstance() {
        if (!DB.instance) {
            DB.instance = new DB();
        }
        return DB.instance;
    }

    init(address: string) {
        let config: any = {
            keepAlive: 300000,
            autoReconnect: true,
            connectTimeoutMS: 30000,
            reconnectTries: Number.MAX_VALUE,
            reconnectInterval: 2000,
            poolSize: 20
        };
        mongoose.connect(address, config);
        this.wait = new Promise((resolve: Function) => {
            this.resolve = resolve;
        });
        const models = [__dirname + '/../../app/**/data/models/*.js'].reduce((allDirs, dir) => {
            return allDirs.concat(require('glob').sync(path.normalize(dir)));
        }, [] as string[]);
        this.modelsLength = models.length;
        models.forEach((file: any) => {
            require(file);
        });
    }

    waitForModels() {
        if (this.alreadyResolved) {
            return new Promise((resolve) => {
                resolve();
            });
        }
        return this.wait;
    }

    modelReady() {
        this.modelsReady++;
        if (this.modelsReady >= this.modelsLength) {
            if (this.resolve) {
                this.resolve(true);
            } else {
                this.alreadyResolved = true;
            }
        }
    }

}

