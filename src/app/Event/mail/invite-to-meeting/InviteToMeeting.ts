import { Event } from '../../data/models/Event';
import { eventRepository } from '../../data/repositories/EventRepository';
import { mailer } from '../../../../lib/mail/Mailer';
import { Applicant } from '../../../Applicant/data/models/Applicant';

const uuidv1 = require('uuid/v1');
const ical = require('ical-generator');
const moment = require('moment-timezone');
const ejs = require('ejs');

export class InviteToMeeting {

    private readonly eventId: string;
    private event: Event;
    private googleEvent: any;

    constructor(eventId: string) {
        this.eventId = eventId;
    }

    customBuild(applicant: any) {
        return {
            template: __dirname + '/invite-to-meeting.ejs',
            subject: 'MIT - WPU Personal Interview Invitation',
            data: {
                applicant,
                event: this.event,
                host: process.env.HOST,
                date: moment(this.event.date).tz('Asia/Kolkata').format('dddd, MMMM Do YYYY, h:mm a')
            },
            // icalEvent: {
            //     contentType: 'text/calendar',
            //     content: this.event.toString()
            // }
        };
    }

    createCalendar(applicant: any) {
        this.googleEvent = ical({domain: 'talent.social', name: 'MIT-WPU'});
        this.googleEvent.prodId('//MIT-WPU//TalentEdu//EN');
        this.googleEvent.scale('gregorian');
        this.googleEvent.createEvent({
            start: moment(this.event.date).tz('Asia/Kolkata'),
            end: moment(this.event.date).tz('Asia/Kolkata').add(30, 'minutes'),
            summary: 'Interview from ' + this.event.owner.name,
            description: 'Interview from ' + this.event.owner.name,
            method: 'request',
            timezone: 'Asia/Kolkata',
            status: 'confirmed',
            organizer: {
                name: this.event.owner.name,
                email: this.event.owner.email
            }
        }).createAttendee({email: applicant.email, name: applicant.name, status: 'accepted'});
    }

    async send() {
        try {
            this.event = await eventRepository.findOne({_id: this.eventId})
                .populate('data.applicant')
                .populate('data.applicants')
                .populate('owner');
            if (this.event.data.applicants && this.event.data.applicants.length > 0) {
                for (let applicant of this.event.data.applicants) {
                    this.createCalendar(applicant);
                    await this.customSend(applicant);
                }
            } else if (this.event.data.applicant) {
                this.createCalendar(this.event.data.applicant);
                await this.customSend(this.event.data.applicant);
            }
        } catch (e) {
            console.error(e);
        }

    }

    customSend(applicant: Applicant) {
        return new Promise((resolve: Function, reject: Function) => {
            let mailOptions: any = this.customBuild(applicant);
            mailOptions.from = '"MIT-WPU " <' + process.env.MAILER_FROM + '>';
            mailOptions.to = applicant.email;
            ejs.renderFile(mailOptions.template,
                mailOptions.data, {}, (err: any, html: any) => {
                    if (err) {
                        reject(err);
                    }
                    mailOptions.html = html;
                    mailer.send(mailOptions)
                        .then((info: any) => {
                            resolve(info);
                        })
                        .catch((error: any) => {
                            reject(error);
                        });
                });
        });
    }
}
