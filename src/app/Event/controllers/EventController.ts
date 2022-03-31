import { Delete, Get, JsonController, Param, Post, Put, Req, Res, UseBefore } from 'routing-controllers';
import { Validate } from '../../../lib/validator/Validator';
import { IsAuthenticated } from '../../Session/policies/IsAuthenticated';
import { eventRepository } from '../data/repositories/EventRepository';
import { Token } from '../../Shared/services/Token';
import { InviteToMeeting } from '../mail/invite-to-meeting/InviteToMeeting';
import { GoogleCalendar } from '../services/GoogleCalendar';
import { userRepository } from '../../User/data/repositories/UserRepository';
import { applicantRepository } from '../../Applicant/data/repositories/ApplicantRepository';

const moment = require('moment-timezone');
const excelToJson = require('convert-excel-to-json');

@JsonController()
export class EventController {

    @Post('/events')
    @Validate([
        {
            field: 'date', validation: [
                {value: 'notEmpty', message: 'date is required'}
            ]
        },
        {
            field: 'type', validation: [
                {value: 'notEmpty', message: 'stage is required'}
            ]
        }, 'note', 'data', 'owner'
    ])
    @UseBefore(IsAuthenticated)
    async create(@Req() req: any, @Res() res: any) {
        try {
            const {date, type, data, note, owner} = req.body;
            let event = await eventRepository.create({
                date,
                type,
                data,
                note,
                status: 'accepted',
                owner: owner ? owner : req.user._id,
                university: req.user.university
            });
            const token = (new Token({id: event._id})).generate();
            await eventRepository.update({_id: event._id}, {$set: {acceptToken: token}});
            if (req.user.googleAccess && !owner) {
                let googleCalendar = new GoogleCalendar(req.user);
                await googleCalendar.init();
                googleCalendar.createEvent(event._id);
            } else {
                let mailer = new InviteToMeeting(event._id);
                mailer.send().then(() => {
                });
            }
            res.send(event);
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Post('/events/bulk')
    @Validate([
        {
            field: 'from', validation: [
                {value: 'notEmpty', message: 'from is required'}
            ]
        },
        {
            field: 'to', validation: [
                {value: 'notEmpty', message: 'from is required'}
            ]
        },
        {
            field: 'testTitle', validation: [
                {value: 'notEmpty', message: 'testTitle is required'}
            ]
        },
        {
            field: 'testTakenFrom', validation: [
                {value: 'notEmpty', message: 'testTakenFrom is required'}
            ]
        },
        {
            field: 'testTakenTo', validation: [
                {value: 'notEmpty', message: 'testTakenTo is required'}
            ]
        },
        {
            field: 'interviewers', validation: [
                {value: 'notEmpty', message: 'interviewers is required'}
            ]
        }
    ])
    @UseBefore(IsAuthenticated)
    async createMultiple(@Req() req: any, @Res() res: any) {
        try {
            let from = moment(req.body.from).tz('Asia/Kolkata');
            let to = moment(req.body.to).tz('Asia/Kolkata');
            let {interviewers, testTakenFrom, testTakenTo, testTitle} = req.body;
            let applicants = await applicantRepository.find({testTitle, testTakenAt: {$gte: testTakenFrom, $lte: testTakenTo}});
            let users = await userRepository.find({_id: interviewers});
            let i = 0;
            let time = 0;
            let d = 0;
            for (let applicant of applicants) {
                if (moment(from).add(time, 'm').hours() === 12) {
                    time += 60;
                }
                if (moment(from).add(time, 'm').diff(moment(to).add(d, 'd')) >= 0) {
                    time += moment(from).add(d + 1, 'd').diff(moment(from).add(time, 'm'), 'm');
                    d++;
                }
                let user = users[i];
                let event = await eventRepository.create({
                    date: moment(from).add(time, 'm'),
                    type: 'Video Interview',
                    data: {
                        applicant: applicant._id
                    },
                    note: '',
                    status: 'accepted',
                    owner: user._id,
                    university: user.university,
                    fromBulk: true
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
            res.send({message: 'ok'});
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/events/update-status')
    @Validate([
        {
            field: 'token', validation: [
                {value: 'notEmpty', message: 'token is required'}
            ]
        },
        {
            field: 'status', validation: [
                {value: 'notEmpty', message: 'status is required'}
            ]
        }
    ])
    async updateStatus(@Req() req: any, @Res() res: any) {
        const {token, status} = req.query;

        try {
            const {id} = Token.extract(token);
            let event = await eventRepository.findOne({$and: [{_id: id}, {acceptToken: token}]}).populate('owner');
            if (!event) {
                res.redirect(process.env.HOST + '/meeting-already-confirmed');
                return;
            }
            if (status === 'accepted') {
                await eventRepository.accept(event._id.toString());
                res.redirect(process.env.HOST + '/meeting-confirmed');
            } else {
                await eventRepository.decline(event._id.toString());
                res.redirect(process.env.HOST + '/meeting-declined');
            }
        } catch (error) {
            console.error(error);
            res.status(400).send({error: error.message});
        }
    }

    @Get('/events')
    @Validate([
        {
            field: 'year', validation: [
                {value: 'notEmpty', message: 'year is required'}
            ]
        },
        {
            field: 'month', validation: [
                {value: 'notEmpty', message: 'month is required'}
            ]
        }])
    @UseBefore(IsAuthenticated)
    async find(@Req() req: any, @Res() res: any) {
        try {
            const {year, month} = req.query;
            let begin = moment().year(year).month(month).startOf('month').add(-7, 'days');
            let end = moment().year(year).month(month).endOf('month').add(7, 'days');
            let condition: any = {
                date: {$gte: begin.format(), $lte: end.format()},
                status: {$in: ['pending', 'accepted']}
            };
            if (req.user.type !== 'admin') {
                condition.owner = req.user._id;
            }
            let events = await eventRepository.find(condition)
                .populate('owner')
                .populate('university')
                .populate('data.applicant')
                .populate('data.course')
                .sort({date: 1});

            let total = await eventRepository.count(condition);
            res.send({items: events, total});
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Put('/events/:id([0-9a-f]{24})')
    @Validate([
        {
            field: 'id', validation: [
                {value: 'notEmpty', message: 'id is required'}
            ]
        },
        {
            field: 'date', validation: [
                {value: 'notEmpty', message: 'date is required'}
            ]
        }, 'note', 'type', 'applicant', 'applicants'
    ])
    @UseBefore(IsAuthenticated)
    async update(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            const {date, note, type, applicant, applicants} = req.body;
            await eventRepository.update({_id: id}, {
                $set: {date, note, type, applicant, applicants}
            }, {multi: false});
            if (req.user.googleAccess) {
                let googleCalendar = new GoogleCalendar(req.user);
                await googleCalendar.init();
                googleCalendar.updateEvent(id);
            } else {
                let mailer = new InviteToMeeting(id);
                mailer.send().then(() => {
                });
            }
            res.send({message: 'ok'});
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Delete('/events/:id([0-9a-f]{24})')
    @Validate([
        {
            field: 'id', validation: [
                {value: 'notEmpty', message: 'eventId is required'}
            ]
        },
    ])
    @UseBefore(IsAuthenticated)
    async delete(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            await eventRepository.destroy({_id: id}, req.user);
            if (req.user.googleAccess) {
                let googleCalendar = new GoogleCalendar(req.user);
                await googleCalendar.init();
                googleCalendar.deleteEvent(id);
            }
            res.send({message: 'event deleted successful'});
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/events/:id([0-9a-f]{24})')
    async findOne(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            let event = await eventRepository.findOne({_id: id})
                .populate('owner')
                .populate('university')
                .populate('data.applicant')
                .populate('data.course')
                .populate('data.applicants');
            if (event) {
                res.send(event);
            } else {
                res.status(400).send({error: 'Not found'});
            }
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/events/:id([0-9a-f]{24})/status')
    async getStatus(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            let event = await eventRepository.findOne({_id: id});
            if (event.data && event.data.applicant) {
                let latestEvent = await eventRepository.findOne({
                    'data.applicant': event.data.applicant,
                    date: event.date,
                    owner: event.owner
                }).sort({createdAt: -1});
                if (latestEvent._id.toString() !== id.toString()) {
                    res.status(400).send({error: {id: latestEvent._id}});
                    return;
                }
            }
            if (moment().diff(moment(event.date), 'm') < 0) {
                res.status(400).send({error: 'The interview will begin on ' + moment(event.date).tz('Asia/Kolkata').format('dddd, MMMM Do YYYY, h:mm a') + ' (IST). Please refresh the page when the time reached.'});
                return;
            } else if (moment().diff(moment(event.date), 'm') > 10) {
                res.status(400).send({error: 'The interview has ended.'});
                return;
            }
            res.send({message: 'ok'});
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/meetings/google-calendar/update')
    async updateGoogleCalendarStatus(@Req() req: any, @Res() res: any) {

        try {
            let user = await userRepository.findOne({_id: req.headers['X-Goog-Channel-ID']});
            let googleCalendar = new GoogleCalendar(user);
            await googleCalendar.init();
            googleCalendar.syncMeetings();
            res.send({message: 'ok'});
        } catch (error) {
            console.error(error);
            res.status(400).send({error: error.message});
        }
    }

}
