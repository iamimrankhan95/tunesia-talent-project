import {DB} from './DB';
import {instanceName} from '../utils/utils';

export class MongooseModel {
    mongooseModel: any;
    _id: any;
    deleted: boolean;

    isNew: boolean;
    wasNew: boolean;

    constructor(obj: any) {
        this.mongooseModel = new (DB.getInstance().models[instanceName(this)])(obj);
        this.bindFields(this, obj);
    }

    save(): any {
        for (let key in this) {
            if (key !== 'mongooseModel' && this.hasOwnProperty(key)) {
                this.mongooseModel[key] = this[key];
            }
        }
        return this.mongooseModel.save();
    }

    bindFields(bindTo: any, data: any) {
        let obj = data;
        if (data.toJSON) {
            obj = data.toJSON();
        }
        Object.keys(obj).forEach((key: any) => {
            bindTo[key] = data[key];
        });
    }

    /*	@pre("find")
        startProfiling(next: Function) {
            (<any>this).start = moment();
            next();
        }

        @post("find")
        finishProfiling() {
            console.log((<any>this).model.modelName + " find took " + moment().diff((<any>this).start).toString() + "ms");
        }*/
}
