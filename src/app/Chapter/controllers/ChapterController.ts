import { field } from './../../../lib/mongoose-typescript/Schema';
import { Get, JsonController, Put, Req, Res, UseBefore, Post, Param } from 'routing-controllers';
import { Validate } from '../../../lib/validator/Validator';
import { IsAuthenticated } from '../../Session/policies/IsAuthenticated';
import { chapterRepository } from '../data/repositories/ChapterRepository';

@JsonController('/courses/:courseId([0-9a-f]{24})/chapters')
export class ChapterController {

    @Post('/')
    @Validate([
        {
            field: 'title', validation: [
                { value: 'notEmpty', message: 'name is required' }
            ]
        },
        {
            field: 'lectures', validation: [
                { value: 'notEmpty', message: 'Lecture is required' }
            ]
        },

    ])
    @UseBefore(IsAuthenticated)
    async create(@Req() req: any, @Res() res: any) {
        try {
            const { title, lectures, course } = req.body;
            await chapterRepository.create({
                title,
                lectures,
                course,
                owner: req.user._id
            });
            res.send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/')
    async getAll(@Req() req: any, @Res() res: any, @Param('courseId') courseId: string) {
        try {
            const condition = {course: courseId};
            let chapters = await chapterRepository.find(condition)
              .populate('lectures');
            const total = await chapterRepository.count(condition);
            res.send({ items: chapters, total: total });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/:chapterId([0-9a-f]{24})')
    async findOne(@Req() req: any, @Res() res: any, @Param('courseId') courseId: string, @Param('chapterId') id: string) {
        try {
            let chapter = await chapterRepository.findOne({ _id: id });
            res.send(chapter);
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }
}


