import { MongooseModel } from '../../../../lib/mongoose-typescript/MongooseModel';
import { field } from '../../../../lib/mongoose-typescript/Schema';
import { Model } from '../../../../lib/mongoose-typescript/decorators';

const mongoose = require('mongoose');

@Model('Course')
export class Course extends MongooseModel {

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

    @field([{
        type: mongoose.Schema.Types.Mixed,
        require: false
    }])
    students: any[];

    @field({
        type: Boolean,
        default: false
    })
    isActive: boolean;

    @field({
        type: Date,
        default: new Date()
    })
    createdAt: Date;

    @field({
        type: Date
    })
    updatedAt: Date;

    @field({
        type: String,
        require: false
    })
    introVideo: String;

    @field({
        type: String,
        require: false
    })
    img: string;

    @field({
        type: String,
        require: false
    })
    difficulty: string;

    @field({
        type: String,
        require: false
    })
    totalTime: string;

    @field({
        type: String,
        require: false
    })
    price: string;

    @field({
        type: mongoose.Schema.Types.ObjectId,
        require: false,
        ref:'CourseCategory'
    })
    category: any;
}
