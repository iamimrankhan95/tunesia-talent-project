import { MongooseRepository } from '../../../../lib/mongoose-typescript/MongooseRepository';
import { NotificationApplicantFactory } from '../../../Notification/services/NotificationApplicantFactory';
import { Applicant } from '../../../Applicant/data/models/Applicant';
import { applicantRepository } from '../../../Applicant/data/repositories/ApplicantRepository';


const moment = require('moment-timezone');

class EventRepository extends MongooseRepository {

    async accept(eventId: string) {
        let event = await eventRepository.findOne({_id: eventId}).populate('owner');
        let applicant: Applicant = await applicantRepository.findOne({_id: event.data.applicant});
        let notificationFactory = new NotificationApplicantFactory();
        notificationFactory.create('meetingConfirmed', {
            applicantId: applicant._id,
            currentUserId: event.owner._id,
            extra: event
        });
        event.acceptToken = '';
        event.status = 'accepted';
        await event.save();
    }

    async decline(eventId: string) {
        let event = await eventRepository.findOne({_id: eventId}).populate('owner');
        let notificationFactory = new NotificationApplicantFactory();
        notificationFactory.create('meetingDeclined', {
            applicantId: event.data.applicant,
            currentUserId: event.owner._id,
            extra: event
        });
        event.acceptToken = '';
        event.status = 'declined';
        await event.save();
    }
}

export let eventRepository = new EventRepository();
