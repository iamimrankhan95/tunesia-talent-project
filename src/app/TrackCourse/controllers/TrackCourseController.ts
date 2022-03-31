import { trackCourseRepository } from './../data/repositories/trackCourseRepository';
import { field } from './../../../lib/mongoose-typescript/Schema';
import { Get, JsonController, Req, Res, UseBefore, Post, Param, Delete } from 'routing-controllers';
import { Validate } from '../../../lib/validator/Validator';
import { IsAuthenticated } from '../../Session/policies/IsAuthenticated';

@JsonController()
export class TrackCourseController {

    @Post('/track-course')
    @Validate([
        {
            field: 'lecture', validation: [
                { value: 'notEmpty', message: 'lecture is required' }
            ]
        },
        {
            field: 'course', validation: [
                { value: 'notEmpty', message: 'course is required' }
            ]
        },

    ])
    @UseBefore(IsAuthenticated)
    async create(@Req() req: any, @Res() res: any) {
        try {
            const { lecture, course } = req.body;
            const trackCourse = await trackCourseRepository.create({
                completedLecture: lecture,
                course: course,
                user: req.user._id
            });
            res.send(trackCourse);
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/track-course/:courseId([0-9a-f]{24})')
    @UseBefore(IsAuthenticated)
    async getAll(@Req() req: any, @Res() res: any, @Param('courseId') courseId: string) {
        try {
            let trackCourses = await trackCourseRepository.find({ course: courseId, user: req.user._id });
            res.send(trackCourses);
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Delete('/track-course/:trackCourseId([0-9a-f]{24})')
    @UseBefore(IsAuthenticated)
    async delete(@Req() req: any, @Res() res: any, @Param('trackCourseId') trackCourseId: string) {
        try {
            await trackCourseRepository.destroy({ _id: trackCourseId }, req.user);
            res.send({message: 'Successful'});
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Delete('/track-course/:courseId([0-9a-f]{24})/all')
    @UseBefore(IsAuthenticated)
    async deleteAllForUser(@Req() req: any, @Res() res: any, @Param('courseId') courseId: string) {
        try {
            await trackCourseRepository.destroy({ course: courseId, user: req.user._id }, req.user);
            res.send({message: 'Successful'});
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }
}


