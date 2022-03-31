export class PoolUtils {

    static instantPromise(data?: any) {
        return new Promise((resolve: Function) => {
            resolve(data);
        });
    }

    static isDefined(value: any) {
        return value !== null && typeof value !== 'undefined';
    }

}
