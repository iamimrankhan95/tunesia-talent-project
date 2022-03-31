import { MongooseModel } from '../../../../lib/mongoose-typescript/MongooseModel';
import { field } from '../../../../lib/mongoose-typescript/Schema';
import { Model } from '../../../../lib/mongoose-typescript/decorators';

const mongoose = require('mongoose');

@Model('University')
export class University extends MongooseModel {

    @field({
        type: String,
        require: true
    })
    name: string;

    @field({
        type: String
    })
    logo: string;

    @field({
        type: String
    })
    description: string;

    @field({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    })
    owner: any;

    @field({
        admission: {
            type: Boolean
        },
        onlineCourse: {
            type: Boolean
        },
        virtualExaminationCenter: {
            type: Boolean
        },
        onlineLiveClassroom: {
            type: Boolean
        }
    })
    features: any;

    @field({
        type: Number,
        default: 0
    })
    coursesCount: number;

    @field({
        type: Number,
        default: 0
    })
    studentsCount: number;

    @field({
        type: Boolean,
        default: true
    })
    isActive: boolean;

    @field([{
        title: {
            type: String
        }
    }])
    admissionParameters: any[];

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
