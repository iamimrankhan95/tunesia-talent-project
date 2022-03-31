import { Delete, Get, JsonController, Param, Post, Put, Req, Res, UseBefore } from 'routing-controllers';
import { Validate } from '../../../lib/validator/Validator';
import { IsAuthenticated } from '../../Session/policies/IsAuthenticated';
import { triviaRepository } from '../data/repositories/TriviaRepository';

@JsonController()
export class TriviaController {

    @Post('/trivias')
    @Validate([
        {
            field: 'liveClassroom', validation: [
                { value: 'notEmpty', message: 'liveClassroom is required' }
            ]
        },
        {
            field: 'text', validation: [
                { value: 'notEmpty', message: 'text is required' }
            ]
        },
        {
            field: 'options', validation: [
                { value: 'notEmpty', message: 'options is required' }
            ]
        }, 'createdAt', 'photo', 'video'
    ])
    @UseBefore(IsAuthenticated)
    async create(@Req() req: any, @Res() res: any) {
        try {
            const { liveClassroom, createdAt, options, photo, video } = req.body;
            await triviaRepository.create({
                liveClassroom,
                owner: req.user._id,
                createdAt,
                options,
                photo,
                video
            });
            res.send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Put('/trivias/:id([0-9a-f]{24})')
    @UseBefore(IsAuthenticated)
    @Validate([
        {
            field: 'id', validation: [
                { value: 'notEmpty', message: 'id is required' }
            ]
        }, 'owner', 'liveClassroom', 'createdAt', 'options', 'photo', 'video'
    ])
    async update(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            let updateBody: any = {};
            for (let field of ['owner', 'liveClassroom', 'createdAt', 'options', 'photo', 'video']) {
                if (typeof req.body[field] !== 'undefined') {
                    updateBody[field] = req.body[field];
                }
            }
            await triviaRepository.update({ _id: id }, {
                $set: updateBody
            }, { multi: false });
            res.send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/notes')
    @UseBefore(IsAuthenticated)
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
    async find(@Req() req: any, @Res() res: any) {
        try {
            const { liveClassroom, skip, limit } = req.query;
            let notes = await triviaRepository.find( {liveClassroom: liveClassroom})
                .skip(+skip)
                .limit(+limit)
                .sort({ createdAt: -1 });

            let total = await triviaRepository.count({liveClassroom: liveClassroom});

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
            let message = await triviaRepository.findOne({ _id: id }).populate('owner', 'liveClassroom');
            res.send(message);
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Delete('/notes/:id([0-9a-f]{24})')
    @UseBefore(IsAuthenticated)
    @Validate([
        {
            field: 'id', validation: [
                { value: 'notEmpty', message: 'id is required' }
            ]
        },
    ])
    async delete(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            await triviaRepository.destroy({ _id: id }, req.message);
            res.send({ message: 'deleted successful' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }
}
