import { Delete, Get, JsonController, Param, Post, Put, Req, Res, UseBefore, UploadedFile } from 'routing-controllers';
import { Validate } from '../../../lib/validator/Validator';
import { IsAuthenticated } from '../../Session/policies/IsAuthenticated';
import { userRepository } from '../../User/data/repositories/UserRepository';
import { StudentListFacade } from '../services/Facade/StudentListFacade';

const bcrypt = require('bcrypt');
const excelToJson = require('convert-excel-to-json');

@JsonController()
export class StudentController {

    @Post('/students')
    @Validate([
        {
            field: 'name', validation: [
                { value: 'notEmpty', message: 'name is required' }
            ]
        },
        {
            field: 'email', validation: [
                { value: 'notEmpty', message: 'email is required' }
            ]
        },
        {
            field: 'phone', validation: [
                { value: 'notEmpty', message: 'phone is required' }
            ]
        },
        {
            field: 'password', validation: [
                { value: 'notEmpty', message: 'password is required' }
            ]
        },
        'university', 'location', 'avatar'
    ])
    @UseBefore(IsAuthenticated)
    async create(@Req() req: any, @Res() res: any) {
        try {
            let { name, email, phone, password, university, location, avatar } = req.body;
            if (req.user.university) {
                university = req.user.university;
            }
            await userRepository.create({
                email,
                name,
                phone,
                password,
                university,
                creator: req.user._id,
                type: 'student',
                location,
                avatar
            });
            res.send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/students')
    @Validate([
        {
            field: 'limit', validation: [
                { value: 'notEmpty', message: 'limit is required' }
            ]
        }, 'keyword', 'sortKey', 'sortValue', 'skip', 'includeStudentId'])
    @UseBefore(IsAuthenticated)
    async find(@Req() req: any, @Res() res: any) {
        try {
            let facade = new StudentListFacade(req.query, req.user);
            let result = await facade.create();
            res.send(result);
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/students/:id([0-9a-f]{24})')
    @Validate([
        {
            field: 'id', validation: [
                { value: 'notEmpty', message: 'id is required' }
            ]
        }])
    @UseBefore(IsAuthenticated)
    async findOne(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            let student = await userRepository.findOne({ _id: id })
                .populate({ path: 'university' });
            res.send(student);
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Put('/students/:id([0-9a-f]{24})')
    @Validate([
        {
            field: 'id', validation: [
                { value: 'notEmpty', message: 'id is required' }
            ]
        }, 'name', 'email', 'isActive', 'phone', 'title', 'university', 'password', 'location', 'avatar'
    ])
    @UseBefore(IsAuthenticated)
    async update(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            let updateBody: any = {};
            for (let field of ['name', 'email', 'isActive', 'phone', 'title', 'university', 'location', 'avatar']) {
                if (typeof req.body[field] !== 'undefined') {
                    updateBody[field] = req.body[field];
                }
            }
            if (req.body.password) {
                req.body.password = await bcrypt.hash(req.body.password, 10);
                updateBody.password = req.body.password;
            }
            await userRepository.update({ _id: id }, {
                $set: updateBody
            }, { multi: false });
            res.send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Put('/students/delete')
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
            let condition: any = { type: 'student', university: req.user.university };
            if (!deleteAll) {
                const index = ids.findIndex(req.user._id);
                if (index !== -1) {
                    ids.splice(index, 1);
                }
                condition = { _id: { $in: ids }, type: 'student' };
            }
            await userRepository.destroy(condition, req.user);
            res.send({ message: 'deleted successful' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Post('/students/multiple')
    @UseBefore(IsAuthenticated)
    async multiple(@Req() req: any, @Res() res: any, @UploadedFile('file') file: any) {
        try {
            const result = excelToJson({
                source: file.buffer,
                header: {
                    rows: 1
                },
                columnToKey: {
                    A: 'email',
                    B: 'name',
                    C: 'phone',
                }
            });

            const students = result['Students'];
            const studentsData = [];
            for (let student of students) {
                const { email, name, phone, university } = student;
                const password = '12345678';
                const studentData = await userRepository.create({
                    email,
                    name,
                    phone,
                    password,
                    creator: req.user._id,
                    type: 'student'
                });
                studentsData.push(studentData);
            }
            res.send({
                'students': studentsData
            });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }
}
