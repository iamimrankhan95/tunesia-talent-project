import { User } from '../../User/data/models/User';
import { GoogleAuth } from '../../Session/services/GoogleAuth';

const {google} = require('googleapis');
const moment = require('moment-timezone');

export class GoogleCalendar {

    private calendar: any;
    private user: User;

    constructor(user: User) {
        this.user = user;
    }

    async init() {
        let authenticator = new GoogleAuth();
        let auth = await authenticator.getAuthInstance(this.user);
        this.calendar = google.calendar({version: 'v3', auth});
    }

    async createEvent(eventId: string) {
        try {
        //     let event = await eventRepository.findOne({_id: eventId}).populate({
        //         path: 'data.applicant'
        //     }).populate('owner');
        //     let newEvent = {
        //         summary: 'Interview for ' + event.applicant.job.title,
        //         description: 'Interview for ' + meeting.applicant.job.title + '@' + meeting.applicant.job.company.name + (meeting.note ? ' (' + meeting.note + ')' : ''),
        //         'start': {
        //             'dateTime': moment(meeting.date).tz('America/New_York'),
        //             'timeZone': 'America/New_York',
        //         },
        //         'end': {
        //             'dateTime': moment(meeting.date).tz('America/New_York').add(30, 'minutes'),
        //             'timeZone': 'America/New_York',
        //         },
        //         'attendees': [
        //             {email: meeting.applicant.email, displayName: meeting.applicant.name},
        //         ]
        //     };
        //
        //     let event = await this.calendar.events.insert({
        //         calendarId: 'primary',
        //         resource: newEvent,
        //         sendUpdates: 'all',
        //         sendNotifications: true
        //     });
        //     console.info('event created');
        //     await meetingRepository.update({_id: meetingId}, {$set: {googleCalendarId: event.data.id}}, {multi: false});
        //     console.info('google calendar id added');
        //     if (!(this.user.googleCalendarOptions && this.user.googleCalendarOptions.watching) || !this.user.googleCalendarOptions) {
        //         this.watch();
        //     }
        } catch (error) {
            console.error(error);
            throw new Error(error);
        }
    }

    async updateEvent(meetingId: string) {
        try {
            // let meeting = await meetingRepository.findOne({_id: meetingId}).populate({
            //     path: 'applicant',
            //     populate: [{path: 'job', populate: [{path: 'company'}]}]
            // }).populate('owner');
            // if (!meeting.googleCalendarId) {
            //     return;
            // }
            // let event = {
            //     summary: 'Interview for ' + meeting.applicant.job.title,
            //     description: 'Interview for ' + meeting.applicant.job.title + '@' + meeting.applicant.job.company.name + (meeting.note ? ' (' + meeting.note + ')' : ''),
            //     'start': {
            //         'dateTime': moment(meeting.date).tz('America/New_York'),
            //         'timeZone': 'America/New_York',
            //     },
            //     'end': {
            //         'dateTime': moment(meeting.date).tz('America/New_York').add(30, 'minutes'),
            //         'timeZone': 'America/New_York',
            //     },
            //     'attendees': [
            //         {email: meeting.applicant.email, displayName: meeting.applicant.name},
            //     ]
            // };
            // await this.calendar.events.update({
            //     calendarId: 'primary', eventId: meeting.googleCalendarId, sendUpdates: 'all',
            //     sendNotifications: true, resource: event
            // });
        } catch (error) {
            console.error(error);
            throw new Error(error);
        }
    }

    async deleteEvent(meetingId: string) {
        try {
            // let meeting = await meetingRepository.findOneWithDeleted({_id: meetingId});
            // if (!meeting || !meeting.googleCalendarId) {
            //     return;
            // }
            // console.info(meeting.googleCalendarId);
            // let result = await this.calendar.events.delete({
            //     calendarId: 'primary', eventId: meeting.googleCalendarId, sendUpdates: 'all',
            //     sendNotifications: true
            // });
            // console.info(result);
        } catch (error) {
            console.error(error);
            throw new Error(error);
        }
    }

    async watch() {
        try {
            // let result = await this.calendar.events.watch({
            //     calendarId: 'primary',
            //     resource: {
            //         'id': this.user._id.toString(),
            //         'type': 'web_hook',
            //         address: process.env.HOST + '/api/meetings/google-calendar/update'
            //     }
            // });
            // console.info(result);
            // await userRepository.update({_id: this.user._id}, {
            //     $set: {
            //         googleCalendarOptions: {
            //             watching: true,
            //             expiration: moment().add(1, 'hours')
            //         }
            //     }
            // }, {multi: false});
        } catch (error) {
            console.error(error);
            throw new Error(error);
        }
    }

    async syncMeetings() {
        try {
            // let result = await this.calendar.events.list({
            //     calendarId: 'primary',
            //     timeMin: (new Date()).toISOString(),
            //     maxResults: 2500,
            //     singleEvents: true,
            //     orderBy: 'updated',
            //     showDeleted: true,
            // });
            // const events = result.data.items;
            // let meetings = await meetingRepository.find({owner: this.user._id, date: {$gte: moment()}});
            // for (let meeting of meetings) {
            //     let event = events.find((o: any) => o.id === meeting.googleCalendarId);
            //     if (event) {
            //         if (event.attendees[0].responseStatus === 'accepted' && meeting.status === 'pending') {
            //             await meetingRepository.accept(meeting._id.toString());
            //         }
            //         if (event.attendees[0].responseStatus === 'declined' && meeting.status === 'pending') {
            //             await meetingRepository.decline(meeting._id.toString());
            //         }
            //     }
            // }
        } catch (error) {
            console.error(error);
            throw new Error(error);
        }
    }

    async stopWatch(meetingCalendar: string) {
        try {
            let result = await this.calendar.channels.stop({
                'id': this.user._id.toString(),
                'resourceId': meetingCalendar
            });
        } catch (error) {
            console.error(error.response.data.error);
            console.error(error.response.data.error.errors);
            console.error(error);
            throw new Error(error);
        }
    }
}
