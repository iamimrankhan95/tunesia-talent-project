import { notificationRepository } from '../data/repositories/NotificationRepository';
import { Applicant } from '../../Applicant/data/models/Applicant';
import { userRepository } from '../../User/data/repositories/UserRepository';
import { applicantRepository } from '../../Applicant/data/repositories/ApplicantRepository';
import { User } from '../../User/data/models/User';

const moment = require('moment');

export class NotificationApplicantFactory {

    private applicant: Applicant;
    private oldApplicant: Applicant;
    private currentUser: User;
    private extra: any;

    constructor() {

    }

    async create(type: 'meetingConfirmed' | 'meetingDeclined',
                 data: { applicantId: string, currentUserId: string, oldApplicant?: Applicant, extra?: any }) {
        this.oldApplicant = data.oldApplicant;
        this.extra = data.extra;
        await this.fetchDataForApplicant(data);
        switch (type) {
            case 'meetingConfirmed':
                await this.meetingConfirmed();
                break;
            case 'meetingDeclined':
                await this.meetingDeclined();
                break;
        }
    }

    private async meetingConfirmed() {
        let message = this.applicant.name + ' accepted meeting on ' + moment(this.extra.date).format('dddd, MMMM Do YYYY, h:mm a');
        await notificationRepository.create({
            receiver: this.currentUser._id,
            target: {
                type: 'meeting',
                id: this.extra._id
            },
            url: process.env.HOST + '/events',
            type: 'meetingConfirmed',
            message
        });
    }

    private async meetingDeclined() {
        let message = this.applicant.name + ' declined meeting on ' + moment(this.extra.date).format('dddd, MMMM Do YYYY, h:mm a');
        await notificationRepository.create({
            receiver: this.currentUser._id,
            target: {
                type: 'meeting',
                id: this.extra._id
            },
            url: process.env.HOST + '/events',
            type: 'meetingDeclined',
            message
        });
    }


    private async fetchApplicant(applicantId: string) {
        this.applicant = await applicantRepository.findOne({_id: applicantId})
            .populate('university');
    }

    private async fetchDataForApplicant(data: { applicantId: string, currentUserId: string }) {
        await this.fetchApplicant(data.applicantId);
        if (data.currentUserId) {
            this.currentUser = await userRepository.findOne({_id: data.currentUserId}).populate('university');
        }
    }
}
