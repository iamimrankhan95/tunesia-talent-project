import { MongooseModel } from '../../../../lib/mongoose-typescript/MongooseModel';
import { field } from '../../../../lib/mongoose-typescript/Schema';
import { Model } from '../../../../lib/mongoose-typescript/decorators';
import { Types } from 'mongoose';

@Model('Class')
export class Class extends MongooseModel {
    @field({
        type: String,
    })
    name: string;

    @field([{
        type: Types.ObjectId,
        ref: 'User'
    }])
    students: any[];

    @field({
        type: Date,
        default: new Date()
    })
    createdAt: Date;
}
