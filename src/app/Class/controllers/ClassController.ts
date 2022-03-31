import { Delete, Get, JsonController, Param, Post, Put, Req, Res, UseBefore } from 'routing-controllers';
import { liveClassRoomRepository } from '../../LiveClassRoom/data/repositories/LiveClassroomRepository';
import { sectionRepository } from '../../Section/data/repositories/SectionRepository';
import { Validate } from '../../../lib/validator/Validator';
import { IsAuthenticated } from '../../Session/policies/IsAuthenticated';
import { classRepository } from '../data/repositories/ClassRepository';


@JsonController()
export class ClassController {

    @Post('/class')
    @Validate([
        {
            field: 'name', validation: [
                { value: 'notEmpty', message: 'name is required' }
            ]
        },
        {
            field: 'students', validation: [
                { value: 'notEmpty', message: 'students is required' }
            ]
        }
    ])
    @UseBefore(IsAuthenticated)
    async create(@Req() req: any, @Res() res: any) {
        try {
            const { name, students } = req.body;
            await classRepository.create({
                name,
                students,
            });
            res.send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/class')
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
        }, 'keyword', 'sortKey', 'sortValue'])
    @UseBefore(IsAuthenticated)
    async find(@Req() req: any, @Res() res: any) {
        try {
            const { keyword, skip, limit, sortKey, sortValue } = req.query;
            let condition: any = {};
            if (keyword) {
                condition.$or = [{
                    name: { '$regex': keyword, '$options': 'i' }
                }];
            }
            const sortCondition = {};
            if (sortKey && sortValue) {
                sortCondition[sortKey] = sortValue === 'descend' ? -1 : 1;
            } else {
                sortCondition['createdAt'] = -1;
            }

            const classData = await classRepository.find(condition)
                .skip(+skip)
                .limit(+limit)
                .sort(sortCondition)
                .populate('students');

            let total = await classRepository.count(condition);

            res.send({ items: classData, total });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/class/:id([0-9a-f]{24})')
    async findOne(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            const classData = await classRepository.findOne({ _id: id }).populate('students');
            res.send(classData);
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Put('/class/:id([0-9a-f]{24})')
    @Validate([
        {
            field: 'id', validation: [
                { value: 'notEmpty', message: 'id is required' }
            ]
        },
        {
            field: 'name', validation: [
                { value: 'notEmpty', message: 'name is required' }
            ]
        },
        {
            field: 'students', validation: [
                { value: 'notEmpty', message: 'students is required' }
            ]
        }
    ])
    @UseBefore(IsAuthenticated)
    async update(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            const { name, students } = req.body;
            await classRepository.update({ _id: id }, {
                $set: {
                    name,
                    students,
                }
            }, { multi: false });
            res.send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Put('/class/delete')
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
            let condition = {};
            if (!deleteAll) {
                condition = { _id: { $in: ids } };
            }
            const classes = await classRepository.find(condition);
            const classIds = classes.map(classData => classData._id);
            await classRepository.destroy(condition, req.user);

            const sections = await sectionRepository.find({ class: { $in: classIds } });
            const sectionIds = sections.map(section => section._id);
            await sectionRepository.destroy({ _id: { $in: sectionIds } }, req.user);

            await liveClassRoomRepository.destroy({ section: { $in: sectionIds } }, req.user);

            res.send({ message: 'class deleted successful' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

}
