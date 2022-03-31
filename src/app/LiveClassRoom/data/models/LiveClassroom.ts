import { Types } from 'mongoose';
import { Model } from '../../../../lib/mongoose-typescript/decorators';
import { MongooseModel } from '../../../../lib/mongoose-typescript/MongooseModel';
import { field } from '../../../../lib/mongoose-typescript/Schema';

@Model('LiveClassRoom')
export class LiveClassRoom extends MongooseModel {

    @field({
        type: Types.ObjectId,
        ref: 'Section'
    })
    section: any;

    @field({
        type: Types.ObjectId,
        ref: 'Call'
    })
    call: any;

    @field({
        type: Date,
        default: new Date()
    })
    createdAt: Date;

    @field({
        type: Date,
        default: new Date()
    })
    startTime: Date;

    @field({
        type: Date,
    })
    endTime: Date;

    @field({
        type: Date,
    })
    actualStartTime: Date;

    @field({
        type: Date,
    })
    actualEndTime: Date;

    @field({
        type: Types.ObjectId,
        ref: 'Chat'
    })
    chat: any;

    @field({
        type: String,
    })
    notes: any;

    @field({
        type: String,
        default: 'Not started',
        enum: ['Not started', 'started', 'ended']
    })
    status: 'Not started' | 'started' | 'ended';
}
