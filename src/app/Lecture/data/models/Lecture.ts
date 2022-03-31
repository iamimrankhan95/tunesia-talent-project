import { MongooseModel } from '../../../../lib/mongoose-typescript/MongooseModel';
import { field, pre } from '../../../../lib/mongoose-typescript/Schema';
import { Model } from '../../../../lib/mongoose-typescript/decorators';

const mongoose = require('mongoose');

@Model('Lecture')
export class Lecture extends MongooseModel {

    @field({
        type: String,
        require: true
    })
    title: string;

    @field({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require: true
    })
    owner: any;

    @field({
        type: Date,
        default: new Date()
    })
    createdAt: Date;

    @field([{
        html: {
            type: String,
        },
        video: {
            type: String,
        },
        time: {
            type: Number,
        },
    }])
    pages: any[];
}
