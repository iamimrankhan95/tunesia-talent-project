import { Delete, Get, JsonController, Param, Post, Put, Req, Res, UseBefore } from 'routing-controllers';
import { Validate } from '../../../lib/validator/Validator';
import { IsAuthenticated } from '../../Session/policies/IsAuthenticated';
import { userRepository } from '../../User/data/repositories/UserRepository';
import { universityRepository } from '../data/repositories/UniversityRepository';

@JsonController()
export class UniversityController {

    @Post('/universities')
    @Validate([
        {
            field: 'name', validation: [
                {value: 'notEmpty', message: 'name is required'}
            ]
        },
        {
            field: 'logo', validation: [
                {value: 'notEmpty', message: 'logo is required'}
            ]
        },
        {
            field: 'description', validation: [
                {value: 'notEmpty', message: 'description is required'}
            ]
        },
        {
            field: 'owner', validation: [
                {value: 'notEmpty', message: 'owner is required'}
            ]
        },
        {
            field: 'features', validation: [
                {value: 'notEmpty', message: 'features is required'}
            ]
        }
    ])
    @UseBefore(IsAuthenticated)
    async create(@Req() req: any, @Res() res: any) {
        try {
            console.log(req.body)
            const {name, logo,description, owner, features} = req.body;
            let createdUser = await userRepository.create({
                email: owner.email,
                name: owner.name,
                title: owner.title,
                phone: owner.phone,
                password: owner.password,
                useTwoFactorAuth: false,
                features,
                type: 'universityOwner'
            });
            let university = await universityRepository.create({
                name,
                logo,
                description,
                owner: createdUser
            });
            createdUser.university = university._id;
            await createdUser.save();
            res.send({message: 'ok'});
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/universities')
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
            let universities = await universityRepository.find(condition)
                .skip(+skip)
                .limit(+limit)
                .sort({createdAt: -1});

            let total = await universityRepository.count(condition);

            res.send({items: universities, total});
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Put('/universities/:id([0-9a-f]{24})')
    @Validate([
        {
            field: 'id', validation: [
                {value: 'notEmpty', message: 'id is required'}
            ]
        },
        {
            field: 'name', validation: [
                {value: 'notEmpty', message: 'name is required'}
            ]
        },
        {
            field: 'description', validation: [
                {value: 'notEmpty', message: 'description is required'}
            ]
        },
        {
            field: 'logo', validation: [
                {value: 'notEmpty', message: 'logo is required'}
            ]
        },
        {
            field: 'isActive', validation: [
                {value: 'notEmpty', message: 'isActive is required'}
            ]
        },
        {
            field: 'features', validation: [
                {value: 'notEmpty', message: 'features is required'}
            ]
        }
    ])
    @UseBefore(IsAuthenticated)
    async update(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            const {name, isActive,description, logo, features} = req.body;
            await universityRepository.update({_id: id}, {
                $set: {
                    name,
                    logo,
                    description,
                    isActive,
                    features
                }
            }, {multi: false});
            res.send({message: 'ok'});
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/universities/:id([0-9a-f]{24})')
    async findOne(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            let university = await universityRepository.findOne({_id: id});
            res.send(university);
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/universities/admission-param')
    @UseBefore(IsAuthenticated)
    async findAdmissionParam(@Req() req: any, @Res() res: any) {
        try {
            let university = await universityRepository.findOne({_id: req.user.university});
            res.send(university.admissionParameters);
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Put('/universities/admission-param')
    @Validate([
        {
            field: 'admissionParameters', validation: [
                {value: 'notEmpty', message: 'admissionParameters is required'}
            ]
        }]
    )
    @UseBefore(IsAuthenticated)
    async updateAdmissionParam(@Req() req: any, @Res() res: any) {
        try {
            await universityRepository.update({_id: req.user.university}, {$set: {admissionParameters: req.body.admissionParameters}}, {multi: false});
            res.send({message: 'good'});
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Delete('/universities/:id([0-9a-f]{24})')
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
            await universityRepository.destroy({_id: id}, req.user);
            res.send({message: 'university deleted successful'});
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

}
