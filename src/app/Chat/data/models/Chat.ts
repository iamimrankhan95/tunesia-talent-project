import { MongooseModel } from '../../../../lib/mongoose-typescript/MongooseModel';
import { field } from '../../../../lib/mongoose-typescript/Schema';
import { Model } from '../../../../lib/mongoose-typescript/decorators';
import { Types } from 'mongoose';

@Model('Chat')
export class Chat extends MongooseModel {

    @field({
        type: String,
        default: 'LiveClassRoom',
        enum: ['LiveClassRoom']
    })
    type: string;

    @field({
        type: Types.ObjectId,
        ref: 'LiveClassRoom'
    })
    liveClassroom: any;

    @field({
        type: Date,
        default: new Date()
    })
    createdAt: Date;

}
