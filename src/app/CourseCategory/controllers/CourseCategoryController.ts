import { Delete, Get, JsonController, Param, Post, Put, Req, Res, UseBefore } from 'routing-controllers';
import { Validate } from '../../../lib/validator/Validator';
import { IsAuthenticated } from '../../Session/policies/IsAuthenticated';
import { userRepository } from '../../User/data/repositories/UserRepository';
import { courseCategoryRepository } from '../data/repositories/CourseRepositories';

@JsonController()
export class CourseCategoryController {

    @Post('/courseCategory')
    @Validate([
        {
            field: 'name', validation: [
                {value: 'notEmpty', message: 'name is required'}
            ]
        }
    ])
    @UseBefore(IsAuthenticated)
    async create(@Req() req: any, @Res() res: any) {
        try {
            const {name, } = req.body;
            let category = await courseCategoryRepository.create({
                name,
            });
            res.send({message: 'ok'});
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/courseCategories')
    @Validate([
        {
            field: 'skip', validation: [
                {value: 'notEmpty', message: 'skip is required'}
            ]
        },
        {
            field: 'limit', validation: [
                {value: 'notEmpty', message: 'limit is required'}
            ]
        }, 'keyword'])
    @UseBefore(IsAuthenticated)
    async find(@Req() req: any, @Res() res: any) {
        try {
            const {keyword, skip, limit} = req.query;
            let condition: any = {};
            if (keyword) {
                condition.$or = [{
                    name: {'$regex': keyword, '$options': 'i'}
                }];
            }
            let categories = await courseCategoryRepository.find(condition)
                .skip(+skip)
                .limit(+limit)
                .sort({createdAt: -1});

            let total = await courseCategoryRepository.count(condition);

            res.send({items: categories, total});
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Put('/courseCategory/:id([0-9a-f]{24})')
    @Validate([
        
        {
            field: 'name', validation: [
                {value: 'notEmpty', message: 'name is required'}
            ]
        }
    ])
    @UseBefore(IsAuthenticated)
    async update(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            const {name, isActive,description, logo, features} = req.body;
            await courseCategoryRepository.update({_id: id}, {
                $set: {
                    name,
                }
            }, {multi: false});
            res.send({message: 'ok'});
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/courseCatgory/:id([0-9a-f]{24})')
    async findOne(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            let category = await courseCategoryRepository.findOne({_id: id});
            res.send(category);
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }



    @Delete('/courseCategory/:id([0-9a-f]{24})')
    @Validate([
        {
            field: 'id', validation: [
                {value: 'notEmpty', message: 'id is required'}
            ]
        },
    ])
    @UseBefore(IsAuthenticated)
    async delete(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            await courseCategoryRepository.destroy({_id: id}, req.user);
            res.send({message: 'Course Category deleted successful'});
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

}
