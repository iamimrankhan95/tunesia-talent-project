import { Delete, Get, JsonController, Post, Req, Res, UseBefore } from 'routing-controllers';
import { Validate } from '../../../lib/validator/Validator';
import { passport } from '../services/passport/Passport';
import { IsAuthenticated } from '../policies/IsAuthenticated';
import { toJSON } from '../../Shared/services/PrettyJSON';
import { userRepository } from '../../User/data/repositories/UserRepository';
import { GoogleAuth } from '../services/GoogleAuth';

const fs = require('fs');
const ejs = require('ejs');
const uuidv1 = require('uuid/v1');

@JsonController()
export class SessionController {

    @Post('/sessions')
    @Validate([
        {
            field: 'email', validation: [
                {value: 'notEmpty', message: 'Email is required'}
            ]
        },
        {
            field: 'password', validation: [
                {value: 'notEmpty', message: 'Password is required'}
            ]
        }
    ])
    async create(@Req() req: any, @Res() res: any) {
        try {
            let user: any = await passport.authenticate('local');
            if (!user.token) {
                user.token = uuidv1();
                await user.save();
            }
            res.send(toJSON(user).exclude(['password']));
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Post('/sessions/token')
    @Validate([
        {
            field: 'token', validation: [
                {value: 'notEmpty', message: 'Token is required'}
            ]
        }
    ])
    async createWithToken(@Req() req: any, @Res() res: any) {
        try {
            let user = await userRepository.findOne({token: req.body.token}).populate('university');
            if (user) {
                await passport.login(user);
                res.send(user);
            } else {
                res.status(401).send({message: 'Not Authenticated'});
            }
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Delete('/sessions')
    destroy(@Req() req: any, @Res() res: any) {
        req.logout();
        res.send({
            message: 'You\'ve been logged out successfully'
        });
    }

    @Get('/sessions')
    @UseBefore(IsAuthenticated)
    async findOne(@Req() req: any, @Res() res: any) {
        let user = await userRepository.findOne({_id: req.user._id}).populate('university');
        res.send(toJSON(user).exclude(['password']));
    }

    @Get('/auth/google-connect')
    @UseBefore(IsAuthenticated)
    googleConnect(@Req() req: any, @Res() res: any) {
        let authenticator = new GoogleAuth();
        res.redirect(authenticator.getAuthUrl());
    }

    @Get('/auth/google')
    @UseBefore(IsAuthenticated)
    async googleRedirect(@Req() req: any, @Res() res: any) {
        let authenticator = new GoogleAuth();
        await authenticator.storeAccess(req.user, req.query.code);
        let popup = fs.readFileSync(__dirname + '/../views/popup.ejs', 'utf-8');
        return res.end(ejs.render(popup));
    }
}
