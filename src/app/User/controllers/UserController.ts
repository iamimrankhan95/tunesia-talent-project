import { Delete, Get, JsonController, Param, Post, Put, Req, Res, UploadedFile, UseBefore } from 'routing-controllers';
import { Validate } from '../../../lib/validator/Validator';
import { userRepository } from '../data/repositories/UserRepository';
import { passport } from '../../Session/services/passport/Passport';
import { IsAuthenticated } from '../../Session/policies/IsAuthenticated';
import { ForgetPassword } from '../mail/forget-password/ForgetPassword';
import { Token } from '../../Shared/services/Token';
import { universityRepository } from '../../University/data/repositories/UniversityRepository';
import { sectionRepository } from '../../Section/data/repositories/SectionRepository';
import { liveClassRoomRepository } from '../../LiveClassRoom/data/repositories/LiveClassroomRepository';

const otplib = require('otplib');
const bcrypt = require('bcrypt');
const qrcode = require('qrcode');
const excelToJson = require('convert-excel-to-json');

@JsonController()
export class UserController {

    @Post('/users')
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
            field: 'type', validation: [
                { value: 'notEmpty', message: 'type is required' }
            ]
        },
        {
            field: 'password', validation: [
                { value: 'notEmpty', message: 'password is required' }
            ]
        },
        'university', 'title', 'location', 'avatar'
    ])
    @UseBefore(IsAuthenticated)
    async create(@Req() req: any, @Res() res: any) {
        try {
            const { name, email, phone, title, university, password, type, location, avatar } = req.body;
            await userRepository.create({
                email,
                name,
                type,
                phone,
                title,
                university,
                password,
                location,
                avatar,
                useTwoFactorAuth: false,
                creator: req.user._id
            });
            res.send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Post('/users/multiple')
    @UseBefore(IsAuthenticated)
    async multiple(@Req() req: any, @Res() res: any, @UploadedFile('file') file: any) {
        try {
            const result = excelToJson({
                source: file.buffer,
                header: {
                    rows: 1
                },
                columnToKey: {
                    A: 'name',
                    B: 'email',
                    C: 'phone',
                    D: 'password',
                    E: 'title',
                    F: 'role',
                    G: 'university'
                }
            });
            const users = result['Users'];
            let universities = await universityRepository.find({ name: users.map(o => o.university) });

            for (let user of users) {
                let university = universities.find(o => o.name === user.university);
                if (!university) {
                    throw new Error(user.university + ' does not exist');
                }
                await userRepository.create({
                    email: user.email,
                    name: user.name,
                    phone: user.phone,
                    password: user.password,
                    title: user.title,
                    type: user.role === 'University Employee' ? 'universityMember' : 'universityOwner',
                    university: university._id,
                    useTwoFactorAuth: false,
                    creator: req.user._id
                });
            }
            res.send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Put('/users/:id([0-9a-f]{24})')
    @Validate([
        {
            field: 'id', validation: [
                { value: 'notEmpty', message: 'id is required' }
            ]
        }, 'name', 'email', 'isActive', 'phone', 'title', 'type', 'university', 'password', 'location', 'avatar'
    ])
    @UseBefore(IsAuthenticated)
    async update(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            let updateBody: any = {};
            for (let field of ['name', 'email', 'isActive', 'phone', 'title', 'type', 'university', 'location', 'avatar']) {
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

    @Get('/users')
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
        }, 'keyword', 'type', 'sortKey', 'sortValue'])
    @UseBefore(IsAuthenticated)
    async find(@Req() req: any, @Res() res: any) {
        try {
            const { keyword, skip, limit, type, sortKey, sortValue } = req.query;
            let condition: any = {};
            if (keyword) {
                condition.$or = [{
                    name: { '$regex': keyword, '$options': 'i' }
                }, {
                    email: { '$regex': keyword, '$options': 'i' }
                }];
            }
            let sortCondition = {};
            if (type) {
                if (req.user.type === 'universityOwner') {
                    condition.type = [type];
                    condition.university = req.user.university;
                }
                if (sortKey && sortValue) {
                    sortCondition[sortKey] = sortValue === 'descend' ? -1 : 1;
                } else {
                    sortCondition = { createdAt: -1 };
                }
                console.log('sortCondition:', sortCondition)
            } else {
                // what is this for?
                if (req.user.type === 'admin') {
                    condition.type = ['universityOwner', 'universityMember'];
                }
                condition._id = { $not: { $in: [req.user._id] } };
                if (req.user.type === 'universityOwner' || req.user.type === 'universityMember') {
                    condition.university = req.user.university;
                    condition.type = ['universityOwner', 'universityMember'];
                }
            }

            let users = await userRepository.find(condition)
                .skip(+skip)
                .limit(+limit)
                .sort(sortCondition)
                .populate('university');

            let total = await userRepository.count(condition);

            res.send({ items: users, total });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/users/:id([0-9a-f]{24})')
    async findOne(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            let user = await userRepository.findOne({ _id: id }).populate('university');
            res.send(user);
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }


    @Put('/users/update-password')
    @Validate([
        {
            field: 'oldPassword', validation: [
                { value: 'notEmpty', message: 'oldPassword is required' }
            ]
        },
        {
            field: 'password', validation: [
                { value: 'notEmpty', message: 'Password is required' }
            ]
        }
    ])
    @UseBefore(IsAuthenticated)
    async updatePassword(@Req() req: any, @Res() res: any) {
        const { oldPassword, password } = req.body;

        try {
            let isValidPassword = await req.user.isValidPassword(oldPassword);
            if (!isValidPassword) {
                res.status(400).send({ error: 'Wrong current password' });
                return;
            }
            if (oldPassword === password) {
                res.status(400).send({ error: 'New password should be different than the current password' });
                return;
            }
            req.user.password = password;
            await req.user.save();
            res.send({ message: 'The password has changed successfully' });
        } catch (error) {
            console.error(error);
            res.status(400).send({ error: error.message });
        }
    }

    @Put('/users/enable-two-factor')
    @UseBefore(IsAuthenticated)
    async enableTwoFactor(@Req() req: any, @Res() res: any) {

        try {
            let secret = otplib.authenticator.generateSecret();
            const otpAuth = otplib.authenticator.keyuri(req.user.email, 'Talent', secret);
            let url = await qrcode.toDataURL(otpAuth);
            req.user.secret = secret;
            req.user.useTwoFactorAuth = true;
            await req.user.save();
            res.send({ url, secret });
        } catch (error) {
            console.error(error);
            res.status(400).send({ error: error.message });
        }
    }

    @Put('/users/disable-two-factor')
    @UseBefore(IsAuthenticated)
    async disableTwoFactor(@Req() req: any, @Res() res: any) {

        try {
            req.user.secret = '';
            req.user.useTwoFactorAuth = false;
            await req.user.save();
            res.send({ message: 'goof' });
        } catch (error) {
            console.error(error);
            res.status(400).send({ error: error.message });
        }
    }

    @Put('/users/delete')
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
            let condition: any = { type: 'teacher', university: req.user.university };
            if (!deleteAll) {
                condition = { _id: { $in: ids } };
            }
            const users = await userRepository.find(condition);
            const userIds = users.map(user => user._id);
            await userRepository.destroy(condition, req.user);

            const sections = await sectionRepository.find({ teacher: { $in: userIds } });
            const sectionIds = sections.map(section => section._id);
            await sectionRepository.destroy({ _id: { $in: sectionIds } }, req.user);

            await liveClassRoomRepository.destroy({ section: { $in: sectionIds } }, req.user);

            res.send({ message: 'deleted successful' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Post('/users/forget-password')
    @Validate([
        {
            field: 'email', validation: [
                { value: 'notEmpty', message: 'Email is required' }
            ]
        },
    ])
    async forgetPassword(@Req() req: any, @Res() res: any) {
        const { email } = req.body;
        try {
            const token = (new Token({ email })).generate();
            let existingUser = await userRepository.findOne({ email });
            if (!existingUser) {
                throw new Error('User not found!');
            }

            await userRepository.update({ email }, { $set: { recoveryToken: token } });
            let user = await userRepository.findOne({ email });
            let mailer = new ForgetPassword(user);
            mailer.send();
            res.send({ message: 'The password has been set up successfully' });
        } catch (error) {
            console.error(error);
            res.status(400).send({ error: error.message });
        }
    }

    @Put('/users/change-password')
    @Validate([
        {
            field: 'token', validation: [
                { value: 'notEmpty', message: 'token is required' }
            ]
        },
        {
            field: 'password', validation: [
                { value: 'notEmpty', message: 'Password is required' }
            ]
        }
    ])
    async changePassword(@Req() req: any, @Res() res: any) {
        const { token, password } = req.body;

        try {
            const { email } = Token.extract(token);
            let user = await userRepository.findOne({ $and: [{ email }, { recoveryToken: token }] });
            if (!user) {
                throw new Error('User not found!');
            }
            user.password = password;
            user.recoveryToken = '';
            let newUser = await user.save();
            await passport.login(newUser);
            res.send({ message: 'The password has been set up successfully' });
        } catch (error) {
            console.error(error);
            res.status(400).send({ error: error.message });
        }
    }

    @Put('/users/update-playerid')
    @Validate([
        {
            field: 'playerId', validation: [
                { value: 'notEmpty', message: 'playerId is required' }
            ]
        }
    ])
    @UseBefore(IsAuthenticated)
    async updatePlayerId(@Req() req: any, @Res() res: any) {
        await userRepository.update({ _id: req.user._id },
            { $set: { playerId: req.body.playerId } },
            { multi: false });
        res.send({ message: 'good' });
    }


    @Post('/auth/verify-account')
    @Validate([
        {
            field: 'token', validation: [
                { value: 'notEmpty', message: 'token is required' }
            ]
        },
    ])
    async verifyAccount(@Req() req: any, @Res() res: any) {
        const { token } = req.body;
        try {
            const { email } = Token.extract(token);
            let user = await userRepository.findOne({ $and: [{ email }, { verifyToken: token }] });
            if (!user) {
                throw new Error('User not found!');
            }
            user.emailVerified = true;
            user.verifyToken = '';
            await user.save();
            res.send({ message: 'The account has been verified' });
        } catch (error) {
            console.error(error);
            res.status(400).send({ error: error.message });
        }
    }

    @Post('/auth/verify-password')
    @UseBefore(IsAuthenticated)
    @Validate([
        {
            field: 'password', validation: [
                { value: 'notEmpty', message: 'password is required' }
            ]
        },
    ])
    async verifyPassword(@Req() req: any, @Res() res: any) {
        const { password } = req.body;
        try {
            const valid = await req.user.isValidPassword(password);
            if (!valid) {
                throw new Error('Password is not valid');
            }
            res.send({ message: 'The password has been verified' });
        } catch (error) {
            console.error(error);
            res.status(400).send({ error: error.message });
        }
    }


}
