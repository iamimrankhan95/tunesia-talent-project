import { Get, JsonController, Post, Put, Req, Res, UseBefore } from 'routing-controllers';
import { IsAuthenticated } from '../../Session/policies/IsAuthenticated';
import { callRepository } from '../data/repositories/CallRepository';
import { Validate } from '../../../lib/validator/Validator';
import { CallCreator } from '../services/CallCreator';
import { LiveClassroomCreator } from '../services/LiveClassroomCallCreator';
import { application } from '../../../app';
import { eventRepository } from '../../Event/data/repositories/EventRepository';
import { liveClassRoomRepository } from '../../LiveClassRoom/data/repositories/LiveClassroomRepository';

const axios = require('axios');

@JsonController()
export class CallController {

    @Post('/calls')
    @Validate(['event', 'liveClassroom', 'applicantId', 'haveScreenShare'])
    @UseBefore(IsAuthenticated)
    async create(@Req() req: any, @Res() res: any) {
        try {
            if (!req.body.event && !req.body.liveClassroom) {
                throw new Error('Params event or liveClassroom one of them is required');
            }
            let creator;
            if (req.body.event) {
                creator = new CallCreator(req.body.event, req.user, req.body.applicantId, !!req.body.haveScreenShare);
            } else {
                creator = new LiveClassroomCreator(req.body.liveClassroom, req.user, !!req.body.haveScreenShare);
            }
            let call = await creator.build();
            res.send(call);

        } catch (error) {
            console.error(error);
            res.status(400).send({ error: error.message });
        }
    }

    @Get('/calls/record')
    @Validate(['event', 'liveClassroom'])
    @UseBefore(IsAuthenticated)
    async record(@Req() req: any, @Res() res: any) {
        try {
            if (!req.body.event && !req.body.liveClassroom) {
                throw new Error('Params event or liveClassroom one of them is required');
            }
            let findCondition = {};
            if (req.body.event) {
                findCondition = {
                    event: req.query.event
                };
            } else {
                findCondition = {
                    liveClassroom: req.query.liveClassroom
                };
            }
            let call = await callRepository.findOne(findCondition);
            let recordResult = await axios({
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'Authorization': 'Basic ' + Buffer.from('OPENVIDUAPP:amine96295751').toString('base64')
                },
                data: { session: call.sessionId, name: call._id, hasAudio: true, hasVideo: true, outputMode: 'INDIVIDUAL' },
                url: 'https://openvidu.talent.social/api/recordings/start'
            });
            await callRepository.update({ _id: call._id }, { $set: { recordId: recordResult.data.id } }, { multi: false });
            res.send(call);
        } catch (error) {
            console.error(error);
            res.status(400).send({ error: error.message });
        }
    }

    @Get('/calls/stop-record')
    @Validate(['event', 'liveClassroom'])
    @UseBefore(IsAuthenticated)
    async stopRecord(@Req() req: any, @Res() res: any) {
        try {
            if (!req.body.event && !req.body.liveClassroom) {
                throw new Error('Params event or liveClassroom one of them is required');
            }
            let findCondition = {};
            if (req.body.event) {
                findCondition = {
                    event: req.query.event
                };
            } else {
                findCondition = {
                    liveClassroom: req.query.liveClassroom
                };
            }
            let call = await callRepository.findOne(findCondition).sort({ version: -1 });
            let recordResult = await axios({
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'Authorization': 'Basic ' + Buffer.from('OPENVIDUAPP:amine96295751').toString('base64')
                },
                data: {},
                url: 'https://openvidu.talent.social/api/recordings/stop/' + call.recordId
            });
            await callRepository.update(
                { _id: call._id },
                {
                    $set:
                    {
                        recordUrl: 'https://openvidu.talent.social/recordings/' + recordResult.data.id + '/' + recordResult.data.name + '.mp4'
                    }
                }, { multi: false });
            res.send(call);
        } catch (error) {
            console.error(error);
            res.status(400).send({ error: error.message });
        }
    }

    @Put('/calls/ask-to-talk')
    @Validate(['event', 'liveClassroom'])
    @UseBefore(IsAuthenticated)
    async askToTalk(@Req() req: any, @Res() res: any) {
        try {
            if (!req.body.event && !req.body.liveClassroom) {
                throw new Error('Params event or liveClassroom one of them is required');
            }
            if (req.body.event) {
                let event = await eventRepository.findOne({ _id: req.body.event });
                application.io.emit('ask_to_talk_' + event.owner, { user: req.user });
            } else {
                let liveClassroom = await liveClassRoomRepository.findOne({ _id: req.body.liveClassroom });
                application.io.emit('ask_to_talk_' + liveClassroom.teacher, { user: req.user });
            }
            res.send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            res.status(400).send({ error: error.message });
        }
    }

    @Put('/calls/accept-to-talk')
    @Validate([
        {
            field: 'user', validation: [
                { value: 'notEmpty', message: 'user is required' }
            ]
        }, 'event', 'liveClassroom'])
    @UseBefore(IsAuthenticated)
    async acceptToTalk(@Req() req: any, @Res() res: any) {
        try {
            if (!req.body.event && !req.body.liveClassroom) {
                throw new Error('Params event or liveClassroom one of them is required');
            }
            application.io.emit('permission_to_talk_' + req.body.user, {});
            res.send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            res.status(400).send({ error: error.message });
        }
    }

    @Put('/calls/update-rate')
    @Validate([
        {
            field: 'rate', validation: [
                { value: 'notEmpty', message: 'rate is required' }
            ]
        }, 'event', 'liveClassroom'])
    async updateRate(@Req() req: any, @Res() res: any) {
        try {
            let findCondition = {};
            if (req.body.event) {
                findCondition = {
                    event: req.query.event
                };
            } else {
                findCondition = {
                    liveClassroom: req.query.liveClassroom
                };
            }
            let call = await callRepository.findOne(findCondition).sort({ version: -1 });
            await callRepository.update({ _id: call._id }, { $set: { rate: req.body.rate } }, { multi: false });
            res.send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            res.status(400).send({ error: error.message });
        }
    }


    // application.io.emit('notifications_' + this.receiver, {notification});
}
