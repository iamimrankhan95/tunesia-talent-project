import { Delete, Get, JsonController, Param, Post, Put, Req, Res, UploadedFile, UseBefore } from 'routing-controllers';
import { Validate } from '../../../lib/validator/Validator';
import { IsAuthenticated } from '../../Session/policies/IsAuthenticated';
import { applicantRepository } from '../data/repositories/ApplicantRepository';
import { ApplicantUpdator } from '../services/ApplicantUpdator';
import { ApplicantListFacade } from '../services/Facade/ApplicantListFacade';
import { eventRepository } from '../../Event/data/repositories/EventRepository';
import { callRepository } from '../../Call/data/repositories/CallRepository';
import { ApplicantDownloadFacade } from '../services/Facade/ApplicantDownloadFacade';

const excelToJson = require('convert-excel-to-json');

@JsonController()
export class ApplicantController {

    @Post('/applicants')
    @Validate([
        {
            field: 'name', validation: [
                {value: 'notEmpty', message: 'name is required'}
            ]
        },
        {
            field: 'email', validation: [
                {value: 'notEmpty', message: 'email is required'}
            ]
        },
        {
            field: 'phone', validation: [
                {value: 'notEmpty', message: 'phone is required'}
            ]
        },
        {
            field: 'location', validation: [
                {value: 'notEmpty', message: 'location is required'}
            ]
        }
    ])
    @UseBefore(IsAuthenticated)
    async create(@Req() req: any, @Res() res: any) {
        try {
            const {name, email, phone, location} = req.body;
            await applicantRepository.create({
                location,
                email,
                name,
                phone,
                university: req.user.university._id,
                creator: req.user._id
            });
            res.send({message: 'ok'});
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Post('/applicants/add-from-vec')
    @Validate([
        {
            field: 'name', validation: [
                {value: 'notEmpty', message: 'name is required'}
            ]
        },
        {
            field: 'email', validation: [
                {value: 'notEmpty', message: 'email is required'}
            ]
        },
        {
            field: 'testTitle', validation: [
                {value: 'notEmpty', message: 'testTitle is required'}
            ]
        },
        {
            field: 'testTakenAt', validation: [
                {value: 'notEmpty', message: 'testTakenAt is required'}
            ]
        },
        {
            field: 'token', validation: [
                {value: 'notEmpty', message: 'token is required'}
            ]
        }, 'mobile'
    ])
    async createFromVEC(@Req() req: any, @Res() res: any) {
        try {
            const {name, email, token, testTakenAt, testTitle, mobile} = req.body;
            if (token !== 'asdasdasd12312312sdsavcvncxvxciiyewrwrew') {
                res.status(400).send('wrong token');
                return;
            }
            let applicant = await applicantRepository.findOne({email});
            if (!applicant) {
                await applicantRepository.create({
                    email,
                    name,
                    testTitle,
                    testTakenAt,
                    phone: mobile,
                    university: '5e7eb7294fbd24266d12b688',
                    creator: '5e7eb7294fbd24266d12b687'
                });
            } else {
                await applicantRepository.update({_id: applicant._id}, {
                    $set: {
                        phone: mobile,
                        testTitle,
                        testTakenAt,
                    }
                }, {multi: false});
            }
            res.send({message: 'ok'});
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Post('/applicants/count')
    @Validate([
        {
            field: 'testTitle', validation: [
                {value: 'notEmpty', message: 'testTitle is required'}
            ]
        },
        {
            field: 'testTakenFrom', validation: [
                {value: 'notEmpty', message: 'testTakenFrom is required'}
            ]
        },
        {
            field: 'testTakenTo', validation: [
                {value: 'notEmpty', message: 'testTakenTo is required'}
            ]
        }
    ])
    @UseBefore(IsAuthenticated)
    async getCount(@Req() req: any, @Res() res: any) {
        try {
            let {testTakenFrom, testTakenTo, testTitle} = req.body;
            let count = await applicantRepository.count({testTitle, testTakenAt: {$gte: testTakenFrom, $lte: testTakenTo}});
            res.send({count});
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Post('/applicants/get-rate')
    @Validate([
        {
            field: 'emails', validation: [
                {value: 'notEmpty', message: 'emails is required'}
            ]
        },
        {
            field: 'token', validation: [
                {value: 'notEmpty', message: 'token is required'}
            ]
        }])
    async getRate(@Req() req: any, @Res() res: any) {
        try {
            if (req.body.token !== 'asdasdasd12312312sdsavcvncxvxciiyewrwrew') {
                res.status(400).send('wrong token');
                return;
            }
            let applicants = await applicantRepository.find({email: req.body.emails}).lean();
            if (applicants.length === 0) {
                res.status(400).send('no applicant');
                return;
            }
            let events = await eventRepository.find({'data.applicant': applicants.map(o => o._id)}).sort({date: -1}).lean();
            if (events.length === 0) {
                res.status(400).send('no event');
                return;
            }
            let calls = await callRepository.find({event: events.map(o => o._id)}).sort({version: -1}).lean();
            if (calls.length === 0) {
                res.status(400).send('no event');
                return;
            }
            for (let applicant of applicants) {
                let e = events.filter(o => o.data.applicant.toString() === applicant._id.toString());
                let c = calls.filter(o => e.findIndex(a => a._id.toString() === o.event.toString()) > -1);
                for (let i of c) {
                    if (i.rate) {
                        applicant.rate = i.rate;
                        break;
                    }
                }
            }
            res.send(applicants);
        } catch (error) {
            console.error(error);
            res.status(400).send({error: error.message});
        }
    }

    @Get('/applicants/test-titles')
    @Validate(['keyword'])
    @UseBefore(IsAuthenticated)
    async findTestTitles(@Req() req: any, @Res() res: any) {
        try {
            let condition = {};
            if (req.query.keyword) {
                condition = {
                    testTitle: {'$regex': req.query.keyword, '$options': 'i'}
                };
            }
            let tests = await applicantRepository.distinct('testTitle', condition);
            res.send(tests);
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/applicants')
    @Validate([
        {
            field: 'limit', validation: [
                {value: 'notEmpty', message: 'limit is required'}
            ]
        }, 'keyword', 'sortKey', 'skip', 'includeApplicantId'])
    @UseBefore(IsAuthenticated)
    async find(@Req() req: any, @Res() res: any) {
        try {
            let facade = new ApplicantListFacade(req.query, req.user);
            let result = await facade.create();
            res.send(result);
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/applicants/download')
    @UseBefore(IsAuthenticated)
    async downloadExcel(@Req() req: any, @Res() res: any) {
        try {
            let facade = new ApplicantDownloadFacade(req.query, req.user);
            let reportPath = await facade.create();
            res.setHeader('Content-Type', 'application/vnd.ms-excel');
            res.setHeader('Content-Disposition', 'attachment; filename=applicants.xlsx');
            req.downloadFile = reportPath;
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/applicants/:id([0-9a-f]{24})')
    @Validate([
        {
            field: 'id', validation: [
                {value: 'notEmpty', message: 'id is required'}
            ]
        }])
    async findOne(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            let applicant = await applicantRepository.findOne({_id: id}).populate('university');
            res.send(applicant);
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/applicants/:id([0-9a-f]{24})/records')
    @Validate([
        {
            field: 'id', validation: [
                {value: 'notEmpty', message: 'id is required'}
            ]
        }])
    async findRecords(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            let events = await eventRepository.find({'data.applicant': id});
            let calls = await callRepository.find({'event': events}).populate('owner').sort({createdAt: -1});
            res.send(calls);
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Put('/applicants/:id([0-9a-f]{24})')
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
            field: 'email', validation: [
                {value: 'notEmpty', message: 'email is required'}
            ]
        },
        {
            field: 'phone', validation: [
                {value: 'notEmpty', message: 'phone is required'}
            ]
        },
        {
            field: 'location', validation: [
                {value: 'notEmpty', message: 'location is required'}
            ]
        }
    ])
    @UseBefore(IsAuthenticated)
    async update(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            const updator = new ApplicantUpdator(req.body, id, req.user);
            await updator.update();
            res.send({message: 'ok'});
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Post('/applicants/multiple')
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
                    D: 'location'
                }
            });
            const applicants = result['Applicants'];
            for (let applicant of applicants) {
                await applicantRepository.create({
                    location: applicant.location,
                    email: applicant.email,
                    name: applicant.name,
                    phone: applicant.phone,
                    university: req.user.university._id,
                    creator: req.user._id
                });
            }
            res.send({message: 'ok'});
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Delete('/applicants/:id([0-9a-f]{24})')
    @Validate([
        {
            field: 'id', validation: [
                {value: 'notEmpty', message: 'applicantId is required'}
            ]
        },
    ])
    @UseBefore(IsAuthenticated)
    async delete(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            await applicantRepository.destroy({_id: id}, req.user);
            res.send({message: 'applicant deleted successful'});
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

}
