import { Get, JsonController, Req, Res, UseBefore } from 'routing-controllers';
import { CanExecuteScript } from '../policies/CanExecuteScript';
import { eventRepository } from '../../Event/data/repositories/EventRepository';
import { Token } from '../../Shared/services/Token';
import { InviteToMeeting } from '../../Event/mail/invite-to-meeting/InviteToMeeting';
import { userRepository } from '../../User/data/repositories/UserRepository';
import { applicantRepository } from '../../Applicant/data/repositories/ApplicantRepository';

const mongoose = require('mongoose');
const otplib = require('otplib');
const moment = require('moment-timezone');
const uuidv1 = require('uuid/v1');

@JsonController()
export class ScriptController {

    @Get('/scripts/health-check')
    async healthCheck(@Req() req: any, @Res() res: any) {
        if (mongoose.connection.readyState === 1) {
            res.send({message: 'good'});
        } else {
            res.status(400).send({error: 'something wrong'});
        }
    }

    @Get('/scripts/add-tokens')
    @UseBefore(CanExecuteScript)
    async addTokens(@Req() req: any, @Res() res: any) {
        let users = await userRepository.find({});
        for (let user of users) {
            user.token = uuidv1();
            await user.save();
        }
        res.send({message: 'ok'});
    }

    // @Get('/scripts/fill-event')
    // @UseBefore(CanExecuteScript)
    // async fillEvent(@Req() req: any, @Res() res: any) {
    //     let applicants = await applicantRepository.find().select('_id').sort({createdAt: -1}).lean();
    //     for (let applicant of applicants) {
    //         let event = await eventRepository.findOne({'data.applicant': applicant._id}).select('_id date').sort({
    //             date: -1,
    //             createdAt: -1
    //         }).lean();
    //         if (event) {
    //             await applicantRepository.update({_id: applicant._id},
    //                 {$set: {latestEvent: event._id, latestEventAt: event.date}}, {multi: false});
    //         }
    //     }
    // }

    // @Get('/scripts/add-secret')
    // @UseBefore(CanExecuteScript)
    // async addSecret(@Req() req: any, @Res() res: any) {
    //     let users = await userRepository.find({useTwoFactorAuth: true});
    //     for (let user of users) {
    //         user.secret = otplib.authenticator.generateSecret();
    //         await user.save();
    //     }
    //     res.send({message: 'ok'});
    // }
    //
    // @Get('/scripts/update-numbers')
    // @UseBefore(CanExecuteScript)
    // async updateNumbers(@Req() req: any, @Res() res: any) {
    //     let jobs = await jobRepository.find();
    //     for (let job of jobs) {
    //         job.numberOfActiveCandidates = await applicantRepository.count({job: job._id});
    //         await job.save();
    //     }
    //     res.send({message: 'ok'});
    // }
    //
    // @Get('/scripts/stop-watch')
    // @UseBefore(IsAuthenticated)
    // @UseBefore(CanExecuteScript)
    // async stopWatch(@Req() req: any, @Res() res: any) {
    //     let googleCalendar = new GoogleCalendar(req.user);
    //     await googleCalendar.init();
    //     let meetings = await meetingRepository.find({owner: req.user._id});
    //     for (let meeting of meetings) {
    //         await googleCalendar.stopWatch(meeting.googleCalendarId);
    //     }
    //     res.send({message: 'ok'});
    // }
    //
    // @Get('/scripts/update-lowercase')
    // @UseBefore(CanExecuteScript)
    // async updateLowercase(@Req() req: any, @Res() res: any) {
    //     let applicants = await applicantRepository.find();
    //     for (let applicant of applicants) {
    //         applicant.lowername = applicant.name.toLowerCase();
    //         applicant.loweremail = applicant.email.toLowerCase();
    //         await applicant.save();
    //     }
    //     res.send({message: 'ok'});
    // }

    @Get('/scripts/schedule')
    @UseBefore(CanExecuteScript)
    async schedule(@Req() req: any, @Res() res: any) {
        let users = await userRepository.find({email: ['santosh.pakhare@mitwpu.edu.in', 'sai.ojha@mitwpu.edu.in', 'samrat.dev@mitwpu.edu.in']});
        let applicants = await applicantRepository.find({createdAt: {$gte: moment('2020-06-08T20:00:00+01:00')}});
        let i = 0;
        let time = 0;
        for (let applicant of applicants) {
            if (moment('2020-06-09T09:00:00+05:30').add(time, 'm').diff(moment('2020-06-09T17:00:00+05:30')) === 0) {
                time += 16 * 60;
            }
            if (moment('2020-06-09T09:00:00+05:30').add(time, 'm').diff(moment('2020-06-10T17:00:00+05:30')) === 0) {
                time += 16 * 60;
            }
            if (moment('2020-06-09T09:00:00+05:30').add(time, 'm').diff(moment('2020-06-11T17:00:00+05:30')) === 0) {
                time += 16 * 60;
            }
            if (moment('2020-06-09T09:00:00+05:30').add(time, 'm').diff(moment('2020-06-09T13:00:00+05:30')) === 0) {
                time += 60;
            }
            if (moment('2020-06-09T09:00:00+05:30').add(time, 'm').diff(moment('2020-06-10T13:00:00+05:30')) === 0) {
                time += 60;
            }
            if (moment('2020-06-09T09:00:00+05:30').add(time, 'm').diff(moment('2020-06-11T13:00:00+05:30')) === 0) {
                time += 60;
            }
            if (moment('2020-06-09T09:00:00+05:30').add(time, 'm').diff(moment('2020-06-12T13:00:00+05:30')) === 0) {
                time += 60;
            }
            let user = users[i];
            let event = await eventRepository.create({
                date: moment('2020-06-09T09:00:00+05:30').add(time, 'm'),
                type: 'Video Interview',
                data: {
                    applicant: applicant._id
                },
                note: '',
                status: 'accepted',
                owner: user._id,
                university: user.university
            });
            const token = (new Token({id: event._id})).generate();
            await eventRepository.update({_id: event._id}, {$set: {acceptToken: token}});
            let mailer = new InviteToMeeting(event._id);
            mailer.send().then(() => {
            });
            i += 1;
            if (i >= users.length) {
                i = 0;
                time += 12;
            }
        }
    }


    @Get('/scripts/custom-schedule')
    @UseBefore(CanExecuteScript)
    async customSchedule(@Req() req: any, @Res() res: any) {
        let users = await userRepository.find({_id: ['5ed80b4b8632d5ddf05b8a51', '5ed80b608632d5ddf05b8e54']});
        let applicants = await applicantRepository.find({_id: ['5ed80b9405524c26d4bd9520', '5ed80baa05524c26d4bd9521', '5ed80bb705524c26d4bd9522', '5ed80bc505524c26d4bd9523']});
        let i = 0;
        let time = 15;
        for (let applicant of applicants) {
            let user = users[i];
            let event = await eventRepository.create({
                date: moment().add(time, 'm'),
                type: 'Video Interview',
                data: {
                    applicant: applicant._id
                },
                note: '',
                status: 'accepted',
                owner: user._id,
                university: user.university
            });
            const token = (new Token({id: event._id})).generate();
            await eventRepository.update({_id: event._id}, {$set: {acceptToken: token}});
            let mailer = new InviteToMeeting(event._id);
            mailer.send().then(() => {
            });
            i += 1;
            if (i >= users.length) {
                i = 0;
                time += 15;
            }
        }
    }


}
