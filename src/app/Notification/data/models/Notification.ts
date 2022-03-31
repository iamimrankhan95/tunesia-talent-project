import { MongooseModel } from '../../../../lib/mongoose-typescript/MongooseModel';
import { field, post, pre } from '../../../../lib/mongoose-typescript/Schema';
import { Model } from '../../../../lib/mongoose-typescript/decorators';
import { application } from '../../../../app';
import { PushNotification } from '../../services/PushNotification';

const mongoose = require('mongoose');

@Model('Notification')
export class Notification extends MongooseModel {

    @field({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    })
    sender: any;

    @field({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    })
    receiver: any;

    @field({
        type: mongoose.Schema.Types.Mixed
    })
    target: any;

    @field({
        type: String
    })
    url: string;

    @field({
        type: String
    })
    message: string;

    @field({
        type: String
    })
    type: string;

    @field({
        type: Boolean,
        default: false
    })
    isRead: boolean;

    @field({
        type: Date,
        default: new Date()
    })
    createdAt: Date;

    @field({
        type: Date
    })
    updatedAt: Date;

    @pre('save')
    checkDifferentReceiverThanSender(next: Function) {
        console.log(this.receiver);
        if (this.receiver.equals(this.sender)) {
            throw new Error('receiver should not be the same as the sender');
        } else {
            next();
        }
    }

    @post('save')
    sendNotification(notification: any) {
        PushNotification.create(notification).then(() => {
            console.info('Notification sent');
        });
        application.io.emit('notifications_' + this.receiver, {notification});
    }
}
