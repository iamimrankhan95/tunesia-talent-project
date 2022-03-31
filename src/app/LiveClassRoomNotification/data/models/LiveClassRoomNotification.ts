import { MongooseModel } from '../../../../lib/mongoose-typescript/MongooseModel';
import { field, post } from '../../../../lib/mongoose-typescript/Schema';
import { Model } from '../../../../lib/mongoose-typescript/decorators';
import { Types } from 'mongoose';
import { liveClassRoomNotificationRepository } from '../repositories/LiveClassRoomNotificationRepository';
const faye = require('faye');

@Model('LiveClassRoomNotification')
export class LiveClassRoomNotification extends MongooseModel {
    @field({
        type: String,
    })
    content: string;

    @field({
        type: String,
        default: 'ask',
        enum: ['ask', 'break', 'raise hand']
    })
    type: 'ask' | 'break' | 'raise hand';

    @field({
        type: Types.ObjectId,
        ref: 'User'
    })
    owner: any;

    @field({
        type: Types.ObjectId,
        ref: 'LiveClassRoom'
    })
    liveClassroom: any;

    @field({
        type: Boolean,
        default: false
    })
    isDismissed: boolean;

    @field({
        type: Date,
        default: new Date()
    })
    createdAt: Date;

    @post('save')
    async sendNotificationToTeacher(notication: any) {
        const client = new faye.Client(process.env.HOST + '/faye');
        const liveClassRoomNotification = await liveClassRoomNotificationRepository.findOne({ _id: notication._id })
            .populate('owner')
            .populate(
                {
                    path: 'liveClassroom',
                    populate: [
                        { path: 'section' },
                    ]
                });
        if (liveClassRoomNotification.liveClassroom) {
            client.publish
                (`/live-classroom_notification_${liveClassRoomNotification.liveClassroom.section.teacher}`, liveClassRoomNotification);
        }
    }
}
