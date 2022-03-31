import { Get, JsonController, Put, Req, Res, UseBefore, Post, Param } from 'routing-controllers';
import { Validate } from '../../../lib/validator/Validator';
import { IsAuthenticated } from '../../Session/policies/IsAuthenticated';
import { lectureRepository } from '../data/repositories/LectureRepository';

@JsonController()
export class LectureController {

    @Post('/lecture')
    @Validate([
        {
            field: 'title', validation: [
                { value: 'notEmpty', message: 'name is required' }
            ]
        },
        {
            field: 'time', validation: [
                { value: 'notEmpty', message: 'time is required' }
            ]
        },
        {
            field: 'pages', validation: [
                { value: 'notEmpty', message: 'pages is required' }
            ]
        },


    ])
    @UseBefore(IsAuthenticated)
    async create(@Req() req: any, @Res() res: any) {
        try {
            const { title,contentLink } = req.body;
            await lectureRepository.create({
                title,
                contentLink,
                owner: req.user._id
            });
            res.send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }


    @Get('/lecture')
    
    async find(@Req() req: any, @Res() res: any) {
        try {
            const { keyword, skip, limit } = req.query;
            let condition: any = {};
            if (keyword) {
                condition.$or = [{
                    name: { '$regex': keyword, '$options': 'i' }
                }];
            }
            let chapter = await lectureRepository.find(condition).populate('content')
            res.send({ items: chapter, total: 0 });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/lecture/:id([0-9a-f]{24})')
    async findOne(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            let lecture = await lectureRepository.findOne({ _id: id });
            res.send(lecture);
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }


}


