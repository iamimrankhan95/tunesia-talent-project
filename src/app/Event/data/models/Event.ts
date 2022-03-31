import { MongooseModel } from '../../../../lib/mongoose-typescript/MongooseModel';
import { field, post } from '../../../../lib/mongoose-typescript/Schema';
import { Model } from '../../../../lib/mongoose-typescript/decorators';
import { applicantRepository } from '../../../Applicant/data/repositories/ApplicantRepository';

const mongoose = require('mongoose');

@Model('Event')
export class Event extends MongooseModel {

    @field({
        type: Date
    })
    date: Date;

    @field({
        type: String
    })
    type: string;

    @field({
        type: String
    })
    status: 'pending' | 'accepted' | 'declined';

    @field({
        type: String
    })
    acceptToken: string;

    @field({
        type: String
    })
    googleCalendarId: string;

    @field({
        type: String
    })
    note: string;

    @field({
        type: Boolean
    })
    fromBulk: string;

    @field({
        applicant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Applicant'
        },
        applicants: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Applicant'
        }],
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        }
    })
    data: any;

    @field({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University'
    })
    university: any;

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
        type: Date
    })
    updatedAt: Date;

    @post('save')
    addToApplicant(event: any) {
        if (event.data && event.data.applicant) {
            applicantRepository.update({_id: event.data.applicant},
                {$set: {latestEvent: event._id, latestEventAt: event.date}}, {multi: false})
                .then(() => {
                    console.info('Updated!!');
                });
        }
    }
}
