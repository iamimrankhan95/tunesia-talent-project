import { Delete, Get, JsonController, Param, Post, Put, Req, Res, UseBefore } from 'routing-controllers';
import { Validate } from '../../../lib/validator/Validator';
import { IsAuthenticated } from '../../Session/policies/IsAuthenticated';
import { noteRepository } from '../../Note/data/repositories/NoteRepository';

@JsonController()
export class NoteController {

    @Post('/notes')
    @Validate([
        {
            field: 'liveClassroom', validation: [
                { value: 'notEmpty', message: 'liveClassroom is required' }
            ]
        },
        {
            field: 'title', validation: [
                { value: 'notEmpty', message: 'title is required' }
            ]
        },
        'createdAt', 'details'
    ])
    @UseBefore(IsAuthenticated)
    async create(@Req() req: any, @Res() res: any) {
        try {
            const { liveClassroom, createdAt, title, details, checked } = req.body;
            await noteRepository.create({
                liveClassroom,
                owner: req.user._id,
                createdAt,
                title,
                details,
                checked
            });
            res.send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Put('/notes/:id([0-9a-f]{24})')
    @Validate([
        {
            field: 'id', validation: [
                { value: 'notEmpty', message: 'id is required' }
            ]
        }, 'liveClassroom', 'createdAt', 'title', 'details'
    ])
    @UseBefore(IsAuthenticated)
    async update(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            let updateBody: any = {};
            for (let field of ['liveClassroom', 'createdAt', 'title', 'details']) {
                if (typeof req.body[field] !== 'undefined') {
                    updateBody[field] = req.body[field];
                }
            }
            await noteRepository.update({ _id: id }, {
                $set: updateBody
            }, { multi: false });
            res.send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/notes')
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
        },
        {
            field: 'liveClassroom', validation: [
                { value: 'notEmpty', message: 'liveClassroom is required' }
            ]
        }])
    @UseBefore(IsAuthenticated)
    async find(@Req() req: any, @Res() res: any) {
        try {
            const { liveClassroom, skip, limit } = req.query;
            let notes = await noteRepository.find({owner: req.user._id, liveClassroom: liveClassroom})
                .skip(+skip)
                .limit(+limit)
                .sort({ createdAt: -1 });

            let total = await noteRepository.count({owner: req.user._id, liveClassroom: liveClassroom});

            res.send({ items: notes, total });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/notes/:id([0-9a-f]{24})')
    @UseBefore(IsAuthenticated)
    async findOne(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            let message = await noteRepository.findOne({ _id: id }).populate('owner', 'liveClassroom');
            res.send(message);
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Put('/notes/delete')
    @Validate([
        {
            field: 'ids', validation: [
                { value: 'notEmpty', message: 'ids is required' }
            ]
        },
    ])
    @UseBefore(IsAuthenticated)
    async delete(@Req() req: any, @Res() res: any) {
        try {
            const { ids } = req.body;
            await noteRepository.destroy({ _id: { $in: ids } }, req.user);
            res.send({ message: 'notes delete successful' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }
}
