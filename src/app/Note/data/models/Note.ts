import { MongooseModel } from '../../../../lib/mongoose-typescript/MongooseModel';
import { field } from '../../../../lib/mongoose-typescript/Schema';
import { Model } from '../../../../lib/mongoose-typescript/decorators';

const mongoose = require('mongoose');

@Model('Note')
export class Note extends MongooseModel {

    @field({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LiveClassRoom'
    })
    liveClassroom: any;

    @field({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    })
    owner: any;

    @field({
        type: Date,
        default: new Date()
    })
    createdAt: Date;

    @field({
        type: String,
    })
    title: string;

    @field({
        type: String,
    })
    details: string;
}
