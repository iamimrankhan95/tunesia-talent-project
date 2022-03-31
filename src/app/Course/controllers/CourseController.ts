import { courseRepository } from './../data/repositories/CourseRepository';
import { Get, JsonController, Put, Req, Res, UseBefore, Post, Param, UploadedFile } from 'routing-controllers';
import { Validate } from '../../../lib/validator/Validator';
import { IsAuthenticated } from '../../Session/policies/IsAuthenticated';
import { isFirstDayOfMonth } from 'date-fns/esm/fp';
import { truncate } from 'fs';
const pdf2html = require('pdf2html')
const pdf = require('pdf-parse');
const unzipper = require('unzipper');
import { S3 } from './../../Asset/services/S3';
import { forkJoin } from 'rxjs';
import { CourseUploader } from '../services/CourseUploader';

@JsonController()
export class CourseController {

    @Post('/courses')
    @Validate([
        {
            field: 'title', validation: [
                { value: 'notEmpty', message: 'name is required' }
            ]
        },
        {
            field: 'owner', validation: [
                { value: 'notEmpty', message: 'owner is required' }
            ]
        },
        {
            field: 'students'
        },
        {
            field: 'introVideo', validation: [
                { value: 'notEmpty', message: 'video is required' }
            ]
        },
        {
            field: 'img', validation: [
                { value: 'notEmpty', message: 'image is required' }
            ]
        },
        {
            field: 'difficulty', validation: [
                { value: 'notEmpty', message: 'Difficulty is required' }
            ]
        },
        {
            field: 'totalTime', validation: [
                { value: 'notEmpty', message: 'Time is required' }
            ]
        },
        {
            field: 'price', validation: [
                { value: 'notEmpty', message: 'price is required' }
            ]
        },

    ])
    @UseBefore(IsAuthenticated)
    async create(@Req() req: any, @Res() res: any) {
        try {
            const { logo, owner, introVideo, students, price, totalTime, difficulty, img, title } = req.body;
            await courseRepository.create({
                introVideo, students, price, totalTime, difficulty, img, title,
                owner: req.user._id
            });
            res.send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }
    // @UseBefore(IsAuthenticated)
    // async create(@Req() req: any, @Res() res: any) {
    //     try {
    //         const {name, logo, owner, features} = req.body;
    //         let createdUser = await userRepository.create({
    //             email: owner.email,
    //             name: owner.name,
    //             title: owner.title,
    //             phone: owner.phone,
    //             password: owner.password,
    //             useTwoFactorAuth: false,
    //             features,
    //             type: 'universityOwner'
    //         });
    //         let university = await universityRepository.create({
    //             name,
    //             logo,
    //             owner: createdUser
    //         });
    //         createdUser.university = university._id;
    //         await createdUser.save();
    //         res.send({message: 'ok'});
    //     } catch (error) {
    //         console.error(error);
    //         res.status(400).send(error);
    //     }
    // }

    @Get('/courses')
    // @Validate([
    //     {
    //         field: 'skip'
    //        // , validation: [
    //        //     {value: 'notEmpty', message: 'skip is required'}
    //        // ]
    //     },
    //     {
    //         field: 'limit'
    //         //, validation: [
    //         //    {value: 'notEmpty', message: 'limit is required'}
    //         //]
    //     }, 'keyword'])
    // @UseBefore(IsAuthenticated)
    async find(@Req() req: any, @Res() res: any) {
        try {
            const { keyword, skip, limit } = req.query;
            let condition: any = {};
            if (keyword) {
                condition.$or = [{
                    name: { '$regex': keyword, '$options': 'i' }
                }];
            }
            let courses = await courseRepository.find(condition).populate('category');
            //console.log(courses)
            // .skip(+skip)
            // .limit(+limit)
            // .sort({createdAt: -1});

            // let total = await universityRepository.count(condition);

            res.send({ items: courses, total: 0 });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/courses/:id([0-9a-f]{24})')
    async findOne(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            let course = await courseRepository.findOne({ _id: id });
            res.send(course);
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Post('/courses/upload')
    @UseBefore(IsAuthenticated)
    async upload(@Req() req: any, @Res() res: any, @UploadedFile('file') file: any) {

        try {
           let courseUploader = new CourseUploader(file, req.user._id);
           let course = await  courseUploader.upload();
           let result = await courseUploader.createCourse();
           res.send({message: 'GOOD'});
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

}
