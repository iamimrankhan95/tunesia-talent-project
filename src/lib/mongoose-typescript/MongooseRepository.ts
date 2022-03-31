import { DB } from './DB';
import { instanceName } from '../utils/utils';

export class MongooseRepository {

    getMongooseModel() {
        return DB.getInstance().models[instanceName(this).replace('Repository', '')];
    }

    create(obj: any): any {
        if (!obj.createdAt) {
            obj.createdAt = new Date();
        }
        return this.getMongooseModel()
            .create(obj);
    }

    insertMany(objects: any[]): any {
        objects.forEach((object: any) => {
            object.createdAt = new Date();
        });
        return this.getMongooseModel()
            .insertMany(objects);
    }

    populate(obj: any, options: any): any {
        return this.getMongooseModel()
            .populate(obj, options);
    }

    find(obj?: any): any {
        return this.getMongooseModel()
            .find(obj);
    }

    findWithDeleted(obj?: any): any {
        return this.getMongooseModel()
            .findWithDeleted(obj);
    }

    findOneWithDeleted(obj?: any): any {
        return this.getMongooseModel()
            .findOneWithDeleted(obj);
    }


    countWithDeleted(obj?: any): any {
        return this.getMongooseModel()
            .countWithDeleted(obj);
    }

    count(obj?: any): any {
        return this.getMongooseModel()
            .count(obj);
    }

    findOne(obj?: any): any {
        return this.getMongooseModel()
            .findOne(obj);
    }

    aggregate(obj?: any): any {
        return this.getMongooseModel()
            .aggregate(obj);
    }

    get(_id: string): any {
        if (!_id) {
            return new Promise((resolve: Function) => {
                resolve(null);
            });
        }
        return this.getMongooseModel()
            .findOne({_id: _id});
    }

    // can modify a lot of objects or single one but does not return them/it
    update(conditions: any, doc: any, options?: any) {
        doc['updatedAt'] = new Date();
        return this.getMongooseModel().update(conditions, doc, options);
    }

    // add {upsert: true} to options to create the document if he is not already created
    // add {new: true} to options to return the updated document instead of the old one
    findOneAndUpdate(query: any, doc: any, options?: any) {
        doc['updatedAt'] = new Date();
        return this.getMongooseModel().findOneAndUpdate(query, doc, options);
    }

    destroy(condition: any, userId: string) {
        return this.getMongooseModel().delete(condition, userId);
    }

    distinct(field: any, condition: any) {
        return this.getMongooseModel().distinct(field, condition);
    }

    distinctField(field: any, query?: any) {
        return query ? this.getMongooseModel().find(query).distinct(field) : this.getMongooseModel().distinct(field);
    }

    attachChild(id: string, arrayName: string, child: string) {
        let addToSetData: any = {};
        addToSetData[arrayName] = child;
        return this.findOneAndUpdate({_id: id}, {$addToSet: addToSetData}, {upsert: false});
    }

    detachChild(id: string, arrayName: string, child: string) {
        let pullData: any = {};
        pullData[arrayName] = child;
        return this.findOneAndUpdate({_id: id}, {
            $pull: pullData
        });
    }
}
