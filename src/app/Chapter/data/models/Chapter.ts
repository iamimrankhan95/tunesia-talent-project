import { MongooseModel } from '../../../../lib/mongoose-typescript/MongooseModel';
import { field } from '../../../../lib/mongoose-typescript/Schema';
import { Model } from '../../../../lib/mongoose-typescript/decorators';

const mongoose = require('mongoose');

@Model('Chapter')
export class Chapter extends MongooseModel {

    @field({
        type: String,
        require: true
    })
    title: string;

    @field({
        type: String,
        require: false
    })
    details: string;

    @field({
        type: Date,
        default: new Date()
    })
    createdAt: Date;

    @field([{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lecture'
    }])
    lectures: any[];

    @field({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    })
    course: any;
}
