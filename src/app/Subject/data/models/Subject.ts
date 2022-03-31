import { MongooseModel } from '../../../../lib/mongoose-typescript/MongooseModel';
import { field } from '../../../../lib/mongoose-typescript/Schema';
import { Model } from '../../../../lib/mongoose-typescript/decorators';
import { Types } from 'mongoose';

@Model('Subject')
export class Subject extends MongooseModel {
    @field({
        type: String,
    })
    name: string;

    @field({
        type: Date,
        default: new Date()
    })
    createdAt: Date;
}
