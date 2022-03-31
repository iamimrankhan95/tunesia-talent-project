import { MongooseModel } from '../../../../lib/mongoose-typescript/MongooseModel';
import { field, post } from '../../../../lib/mongoose-typescript/Schema';
import { Model } from '../../../../lib/mongoose-typescript/decorators';
import { Types } from 'mongoose';
import { liveClassRoomRepository } from '../../../LiveClassRoom/data/repositories/LiveClassroomRepository';

const mongoose = require('mongoose');
const faye = require('faye');

@Model('Message')
export class Message extends MongooseModel {

    @field({
        type: mongoose.Schema.Types.Mixed,
        ref: 'User'
    })
    sender: any;

    @field({
        type: Types.ObjectId,
        ref: 'Chat'
    })
    chat: any;

    @field({
        type: Date,
        default: new Date()
    })
    createdAt: Date;

    @field({
        type: String,
    })
    content: string;

    @post('save')
    async sendMessageToParticipants(message: any) {
        let classroom = await liveClassRoomRepository.findOne({ 'chat': message.chat })
            .populate(
                {
                    path: 'section',
                    populate: [
                        {
                            path: 'class',
                            populate: [
                                {
                                    path: 'students'
                                }
                            ]
                        },
                        { path: 'teacher' }
                    ]
                });
        const client = new faye.Client(process.env.HOST + '/faye');
        if (classroom.section.teacher !== this.sender) {
            client.publish('/messages_' + classroom.section.teacher.id, message);
        }
        classroom.section.class.students.forEach(student => {
            if (student !== this.sender) {
                client.publish('/messages_' + student.id, message);
            }
        });
    }

}
