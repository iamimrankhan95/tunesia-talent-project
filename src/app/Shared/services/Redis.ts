import { application } from '../../../app';

export class Redis {
    static set(id: string, obj: any) {
        return new Promise((resolve: Function, reject: Function) => {
            application.redisClient.set(id, JSON.stringify(obj), (err: any) => {
                if (err) {
                    reject();
                } else {
                    resolve();
                }
            });
        });
    }

    static get(id: string): any {
        return new Promise((resolve: Function, reject: Function) => {
            application.redisClient.get(id, (err: string, result: any) => {
                if (err) {
                    reject(err);
                } else {
                    try {
                        resolve(JSON.parse(result));
                    } catch (e) {
                        resolve(null);
                    }
                }
            });
        });
    }

    static delete(id: string) {
        application.redisClient.del(id);
    }
}
