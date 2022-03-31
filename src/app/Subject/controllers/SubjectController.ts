import { Delete, Get, JsonController, Param, Post, Put, Req, Res, UseBefore } from 'routing-controllers';
import { liveClassRoomRepository } from '../..//LiveClassRoom/data/repositories/LiveClassroomRepository';
import { sectionRepository } from '../../Section/data/repositories/SectionRepository';
import { Validate } from '../../../lib/validator/Validator';
import { IsAuthenticated } from '../../Session/policies/IsAuthenticated';
import { subjectRepository } from '../data/repositories/SubjectRepository';


@JsonController()
export class SubjectController {

    @Post('/subjects')
    @Validate([
        {
            field: 'name', validation: [
                { value: 'notEmpty', message: 'name is required' }
            ]
        }
    ])
    @UseBefore(IsAuthenticated)
    async create(@Req() req: any, @Res() res: any) {
        try {
            const { name } = req.body;
            await subjectRepository.create({
                name,
            });
            res.send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/subjects')
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

            const subject = await subjectRepository.find(condition)
                .skip(+skip)
                .limit(+limit)
                .sort(sortCondition)
                .populate('students');

            let total = await subjectRepository.count(condition);

            res.send({ items: subject, total });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/subjects/:id([0-9a-f]{24})')
    async findOne(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            const subject = await subjectRepository.findOne({ _id: id });
            res.send(subject);
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Put('/subjects/:id([0-9a-f]{24})')
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
        }
    ])
    @UseBefore(IsAuthenticated)
    async update(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            const { name } = req.body;
            await subjectRepository.update({ _id: id }, {
                $set: {
                    name,
                }
            }, { multi: false });
            res.send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Put('/subjects/delete')
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
            const subjects = await subjectRepository.find(condition);
            const subjectIds = subjects.map(subject => subject._id);
            await subjectRepository.destroy(condition, req.user);

            const sections = await sectionRepository.find({ subject: { $in: subjectIds } });
            const sectionIds = sections.map(section => section._id);
            await sectionRepository.destroy({ _id: { $in: sectionIds } }, req.user);

            await liveClassRoomRepository.destroy({ section: { $in: sectionIds } }, req.user);

            res.send({ message: 'Subject deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

}
