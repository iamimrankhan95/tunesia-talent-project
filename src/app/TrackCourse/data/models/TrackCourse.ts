import { MongooseModel } from '../../../../lib/mongoose-typescript/MongooseModel';
import { field } from '../../../../lib/mongoose-typescript/Schema';
import { Model } from '../../../../lib/mongoose-typescript/decorators';

const mongoose = require('mongoose');

@Model('TrackCourse')
export class TrackCourse extends MongooseModel {

    @field({
        type: Object,
        ref: 'lectures',
        require: true
    })
    completedLecture: any;

    @field({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        require: true
    })
    user: any;

    @field({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'course'
    })
    course: any;

    @field({
        type: Date,
        default: new Date()
    })
    createdAt: Date;

    @field({
        type: Date,
        default: new Date()
    })
    updatedAt: Date;
}
