import { Delete, Get, JsonController, Param, Post, Put, Req, Res, UseBefore } from 'routing-controllers';
import { Validate } from '../../../lib/validator/Validator';
import { IsAuthenticated } from '../../Session/policies/IsAuthenticated';
import { sectionRepository } from '../data/repositories/SectionRepository';
import { KeywordSearchUtil } from '../../Shared/services/KeywordSearchUtil';
import { liveClassRoomRepository } from '../../LiveClassRoom/data/repositories/LiveClassroomRepository';


@JsonController()
export class SectionController {

    @Post('/sections')
    @Validate([
        {
            field: 'class', validation: [
                { value: 'notEmpty', message: 'class is required' }
            ]
        },
        {
            field: 'subject', validation: [
                { value: 'notEmpty', message: 'subject is required' }
            ]
        },
        {
            field: 'teacher', validation: [
                { value: 'notEmpty', message: 'teacher is required' }
            ]
        }
    ])
    @UseBefore(IsAuthenticated)
    async create(@Req() req: any, @Res() res: any) {
        try {
            const { subject, teacher } = req.body;
            await sectionRepository.create({
                class: req.body.class,
                subject,
                teacher
            });
            res.send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/sections')
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
            let search: any = {};
            if (keyword) {
                search = await new KeywordSearchUtil(sectionRepository).findSearchKeyword(keyword, [{
                    populatePath: 'class',
                    searchProperty: 'name'
                }, {
                    populatePath: 'teacher',
                    searchProperty: 'name'
                }, {
                    populatePath: 'subject',
                    searchProperty: 'name'
                }]);
            }
            const sortCondition = {};
            if (sortKey && sortValue) {
                sortCondition[sortKey] = sortValue === 'descend' ? -1 : 1;
            } else {
                sortCondition['createdAt'] = -1;
            }
            const section = await sectionRepository.find(condition)
                .skip(+skip)
                .limit(+limit)
                .sort(sortCondition)
                .populate({
                    path: 'class',
                    match: search.path === 'class' ? search.condition : {},
                    // options: {sort: sortCondition }
                })
                .populate({
                    path: 'subject',
                    match: search.path === 'subject' ? search.condition : {},
                    // options: {sort: { name: sortCondition['subject.name'] }}
                })
                .populate({
                    path: 'teacher',
                    match: search.path === 'teacher' ? search.condition : {},
                    // options: {sort: { name: sortCondition['teacher.name'] }}
                });

            let total = await sectionRepository.count(condition);

            res.send({ items: section, total });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/sections/:id([0-9a-f]{24})')
    async findOne(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            const section = await sectionRepository.findOne({ _id: id })
                .populate('class')
                .populate('subject')
                .populate('teacher');
            res.send(section);
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Put('/sections/:id([0-9a-f]{24})')
    @Validate([
        {
            field: 'id', validation: [
                { value: 'notEmpty', message: 'id is required' }
            ]
        },
        {
            field: 'class', validation: [
                { value: 'notEmpty', message: 'class is required' }
            ]
        },
        {
            field: 'subject', validation: [
                { value: 'notEmpty', message: 'subject is required' }
            ]
        },
        {
            field: 'teacher', validation: [
                { value: 'notEmpty', message: 'teacher is required' }
            ]
        }
    ])
    @UseBefore(IsAuthenticated)
    async update(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            const { subject, teacher } = req.body;
            await sectionRepository.update({ _id: id }, {
                $set: {
                    class: req.body.class,
                    subject,
                    teacher
                }
            }, { multi: false });
            res.send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Put('/sections/delete')
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
            const sections = await sectionRepository.find(condition);
            const sectionIds = sections.map(section => section._id);
            await sectionRepository.destroy({ _id: { $in: sectionIds } }, req.user);

            await liveClassRoomRepository.destroy({ section: { $in: sectionIds } }, req.user);

            res.send({ message: 'Section deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

}
