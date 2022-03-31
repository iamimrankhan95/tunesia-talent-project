import { MongooseModel } from '../../../../lib/mongoose-typescript/MongooseModel';
import { field } from '../../../../lib/mongoose-typescript/Schema';
import { Model } from '../../../../lib/mongoose-typescript/decorators';
import { Types } from 'mongoose';

@Model('Section')
export class Section extends MongooseModel {
    @field({
        type: Types.ObjectId,
        ref: 'Class'
    })
    class: any;

    @field({
        type: Types.ObjectId,
        ref: 'Subject'
    })
    subject: any;

    @field({
        type: Types.ObjectId,
        ref: 'User'
    })
    teacher: any;

    @field({
        type: Date,
        default: new Date()
    })
    createdAt: Date;
}
