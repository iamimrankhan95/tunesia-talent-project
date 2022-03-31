import { Delete, Get, JsonController, Param, Post, Put, Req, Res, UseBefore } from 'routing-controllers';
import { Validate } from '../../../lib/validator/Validator';
import { IsAuthenticated } from '../../Session/policies/IsAuthenticated';
import { IsTeacher } from '../../User/polices/IsTeacher';
import { CanJoinLiveClassRoom } from '../policies/CanJoinLiveClassroom';
import { liveClassRoomRepository } from '../data/repositories/LiveClassroomRepository';

const faye = require('faye');

@JsonController()
export class LiveClassRoomController {

    @Post('/live-classrooms')
    @Validate([
        {
            field: 'startTime', validation: [
                { value: 'notEmpty', message: 'startTime is required' }
            ]
        },
        {
            field: 'endTime', validation: [
                { value: 'notEmpty', message: 'endTime is required' }
            ]
        },
        {
            field: 'section', validation: [
                { value: 'notEmpty', message: 'section is required' }
            ]
        }, 'notes'
    ])
    @UseBefore(IsAuthenticated)
    async create(@Req() req: any, @Res() res: any) {
        try {
            const { startTime, endTime, section } = req.body;
            const liveClassRoom = {
                startTime,
                endTime,
                section,
            };
            let liveClassroom = await liveClassRoomRepository.create(liveClassRoom);
            await liveClassRoomRepository.createChat(liveClassroom._id);
            res.send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/live-classrooms')
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
        }, 'keyword'])
    @UseBefore(IsAuthenticated)
    async find(@Req() req: any, @Res() res: any) {
        try {
            const { keyword, skip, limit } = req.query;
            let condition: any = {};
            if (keyword) {
                condition.$or = [{
                    title: { '$regex': keyword, '$options': 'i' }
                }];
            }
            let liveClassRooms = await liveClassRoomRepository.find(condition)
                .skip(+skip)
                .limit(+limit)
                .sort({ createdAt: -1 })
                .populate(
                    {
                        path: 'section',
                        populate: [
                            { path: 'class' },
                            { path: 'subject' },
                            { path: 'teacher' }
                        ]
                    });

            let total = await liveClassRoomRepository.count(condition);

            res.send({ items: liveClassRooms, total });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/live-classrooms/:id([0-9a-f]{24})')
    async findOne(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            let liveClassRoom = await liveClassRoomRepository.findOne({ _id: id })
                .populate(
                    {
                        path: 'section',
                        populate: [
                            { path: 'class' },
                            { path: 'subject' },
                            { path: 'teacher' }
                        ]
                    });
            res.send(liveClassRoom);
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/live-classrooms/join/:id([0-9a-f]{24})')
    @UseBefore(CanJoinLiveClassRoom)
    async join(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            res.send(req.liveClassRoom);
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Put('/live-classrooms/:id([0-9a-f]{24})')
    @Validate([
        {
            field: 'id', validation: [
                { value: 'notEmpty', message: 'id is required' }
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
        },
        {
            field: 'section', validation: [
                { value: 'notEmpty', message: 'section is required' }
            ]
        }, 'notes',
    ])
    @UseBefore(IsAuthenticated)
    async update(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            const { startTime, endTime, section, notes } = req.body;
            await liveClassRoomRepository.update({ _id: id }, {
                $set: {
                    startTime,
                    endTime,
                    section,
                    notes
                }
            }, { multi: false });
            res.send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }


    @Put('/live-classrooms/change-status/:id([0-9a-f]{24})')
    @Validate([
        {
            field: 'id', validation: [
                { value: 'notEmpty', message: 'id is required' }
            ]
        },
        {
            field: 'status', validation: [
                { value: 'notEmpty', message: 'status is required' }
            ]
        }, 'actualStartTime', 'actualEndTime'
    ])
    @UseBefore(IsTeacher)
    async updateStatus(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            await liveClassRoomRepository.update({ _id: id }, {
                $set: {
                    ...req.body
                }
            }, { multi: false });

            const client = new faye.Client(process.env.HOST + '/faye');
            const liveClassRoomDetails = await liveClassRoomRepository.findOne({ _id: id })
                .populate(
                    {
                        path: 'section',
                        populate: [
                            { path: 'class' },
                        ]
                    });
            if (liveClassRoomDetails.status === 'ended' && liveClassRoomDetails.section.class.students) {
                liveClassRoomDetails.section.class.students.forEach(element => {
                    client.publish
                        (`/live-classroom_endclass_${element}`, liveClassRoomDetails);
                });
            }
            res.send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Put('/live-classrooms/delete')
    @Validate([
        {
            field: 'deleteAll', validation: [
                { value: 'notEmpty', message: 'deleteAll is required' }
            ]
        }, 'ids'
    ])
    @UseBefore(IsAuthenticated)
    async delete(@Req() req: any, @Res() res: any) {
        try {
            const { ids, deleteAll } = req.body;
            if (deleteAll) {
                await liveClassRoomRepository.destroy({}, req.user);
            } else {
                await liveClassRoomRepository.destroy({ _id: { $in: ids } }, req.user);
            }
            res.send({ message: 'live class room deleted successful' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }
}
