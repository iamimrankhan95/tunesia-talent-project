import { MongooseModel } from '../../../../lib/mongoose-typescript/MongooseModel';
import { field, pre } from '../../../../lib/mongoose-typescript/Schema';
import { Model } from '../../../../lib/mongoose-typescript/decorators';

const mongoose = require('mongoose');

@Model('Applicant')
export class Applicant extends MongooseModel {

    @field({
        type: String,
        require: true
    })
    name: string;

    @field({
        type: String
    })
    email: string;

    @field({
        type: String
    })
    lowername: string;

    @field({
        type: String
    })
    loweremail: string;

    @field({
        type: String
    })
    testTitle: string;

    @field({
        type: Date
    })
    testTakenAt: Date;

    @field({
        type: String
    })
    phone: string;

    @field({
        type: String
    })
    location: string;

    @field({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University'
    })
    university: any;

    @field({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    })
    creator: any;

    @field({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    })
    latestEvent: any;

    @field({
        type: Date
    })
    latestEventAt: Date;

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

    @pre('save')
    addIsNew(next: Function) {
        this.wasNew = this.isNew;
        next();
    }
}
