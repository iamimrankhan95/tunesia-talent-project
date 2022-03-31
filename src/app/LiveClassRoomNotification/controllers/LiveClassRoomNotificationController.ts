import { Delete, Get, JsonController, Param, Post, Put, Req, Res, UseBefore } from 'routing-controllers';
import { Validate } from '../../../lib/validator/Validator';
import { IsAuthenticated } from '../../Session/policies/IsAuthenticated';
import { liveClassRoomNotificationRepository } from '../data/repositories/LiveClassRoomNotificationRepository';


@JsonController()
export class LiveClassRoomNotificationController {

    @Post('/live-classroom-notification')
    @Validate([
        {
            field: 'type', validation: [
                { value: 'notEmpty', message: 'type is required' }
            ]
        },
        {
            field: 'owner', validation: [
                { value: 'notEmpty', message: 'owner is required' }
            ]
        },
        {
            field: 'liveClassroom', validation: [
                { value: 'notEmpty', message: 'liveClassroom is required' }
            ]
        },
        'content'
    ])
    @UseBefore(IsAuthenticated)
    async create(@Req() req: any, @Res() res: any) {
        try {
            const { content, type, owner, liveClassroom } = req.body;
            await liveClassRoomNotificationRepository.create({
                content: content ? content : '',
                type,
                owner,
                liveClassroom
            });
            res.send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/live-classroom-notification')
    @Validate([
        {
            field: 'skip', validation: [
                { value: 'notEmpty', message: 'skip is required' }
            ]
        },
        {
            field: 'limit', validation: [
                { value: 'notEmpty', message: 'limit is required' }
            ]
        }, 'liveClassroom', 'type'])
    @UseBefore(IsAuthenticated)
    async find(@Req() req: any, @Res() res: any) {
        try {
            const { liveClassroom, type, skip, limit } = req.query;
            let condition: any = {};
            if (liveClassroom) {
                condition['liveClassroom'] = liveClassroom;
            }
            if (type) {
                condition['type'] = 'ask';
            }
            let liveClassRoomsNotification = await liveClassRoomNotificationRepository.find(condition)
                .skip(+skip)
                .limit(+limit)
                .sort({ createdAt: -1 })
                .populate('owner').populate('liveClassroom');


            let total = await liveClassRoomNotificationRepository.count(condition);

            res.send({ items: liveClassRoomsNotification, total });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/live-classroom-notification/realtime')
    @Validate([
        {
            field: 'liveClassroom', validation: [
                { value: 'notEmpty', message: 'liveClassroom is required' }
            ]
        },
        {
            field: 'startTime', validation: [
                { value: 'notEmpty', message: 'startTime is required' }
            ]
        },
        {
            field: 'endTime', validation: [
                { value: 'notEmpty', message: 'endTime is required' }
            ]
        }
    ])
    @UseBefore(IsAuthenticated)
    async getNotificationBasedOnTime(@Req() req: any, @Res() res: any) {
        try {
            const { liveClassroom, startTime, endTime } = req.query;
            let condition = {
                liveClassroom,
                createdAt: {
                    $gte: startTime,
                    $lt: endTime
                }
            };
            let liveClassRoomsNotification = await liveClassRoomNotificationRepository.find(condition)
                .populate('owner').populate('liveClassroom');

            let total = await liveClassRoomNotificationRepository.count(condition);
            res.send({ items: liveClassRoomsNotification, total });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/live-classroom-notification/:id([0-9a-f]{24})')
    async findOne(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            let liveClassRoom = await liveClassRoomNotificationRepository.findOne({ _id: id }).populate('owner').populate('liveClassroom');
            res.send(liveClassRoom);
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Put('/live-classroom-notification/:id([0-9a-f]{24})')
    @Validate([
        {
            field: 'content', validation: [
                { value: 'notEmpty', message: 'content is required' }
            ]
        },
        {
            field: 'type', validation: [
                { value: 'notEmpty', message: 'type is required' }
            ]
        },
        {
            field: 'owner', validation: [
                { value: 'notEmpty', message: 'owner is required' }
            ]
        },
        {
            field: 'liveClassroom', validation: [
                { value: 'notEmpty', message: 'liveClassroom is required' }
            ]
        },
    ])
    @UseBefore(IsAuthenticated)
    async update(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            const { content, type, owner, liveClassroom } = req.body;
            await liveClassRoomNotificationRepository.update({ _id: id }, {
                $set: {
                    content,
                    type,
                    owner,
                    liveClassroom
                }
            }, { multi: false });
            res.send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Delete('/live-classroom-notification/:id([0-9a-f]{24})')
    @Validate([
        {
            field: 'id', validation: [
                { value: 'notEmpty', message: 'id is required' }
            ]
        },
    ])
    @UseBefore(IsAuthenticated)
    async delete(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            await liveClassRoomNotificationRepository.destroy({ _id: id }, req.user);
            res.send({ message: 'live class room notifiction deleted successful' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

}
