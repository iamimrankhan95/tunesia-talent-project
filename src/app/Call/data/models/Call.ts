import { Model } from '../../../../lib/mongoose-typescript/decorators';
import { MongooseModel } from '../../../../lib/mongoose-typescript/MongooseModel';
import { field } from '../../../../lib/mongoose-typescript/Schema';

const mongoose = require('mongoose');

@Model('Call')
export class Call extends MongooseModel {

    @field({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    })
    owner: any;

    @field({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    })
    event: any;

    @field({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LiveClassRoom'
    })
    liveClassroom: any;

    @field({
        type: String
    })
    sessionId: string;

    @field({
        type: String
    })
    recordId: string;

    @field({
        type: String
    })
    recordUrl: string;

    @field({
        type: mongoose.Schema.Types.Mixed
    })
    tokens: any;

    @field([{
        type: mongoose.Schema.Types.Mixed
    }])
    rate: any;

    @field({
        type: Number
    })
    version: number;

    @field({
        type: Date,
        default: new Date()
    })
    createdAt: Date;

    @field({
        type: Date
    })
    updatedAt: Date;
}
