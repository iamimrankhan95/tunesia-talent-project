import { Get, JsonController, Put, Req, Res, UseBefore } from 'routing-controllers';
import { Validate } from '../../../lib/validator/Validator';
import { IsAuthenticated } from '../../Session/policies/IsAuthenticated';
import { notificationRepository } from '../data/repositories/NotificationRepository';

@JsonController()
export class NotificationController {

    @Get('/notifications')
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
        }])
    @UseBefore(IsAuthenticated)
    async find(@Req() req: any, @Res() res: any) {
        try {
            const {skip, limit} = req.query;
            let notifications = await notificationRepository.find({receiver: req.user._id})
                .skip(+skip)
                .limit(+limit)
                .sort({createdAt: -1});

            let total = await notificationRepository.count({receiver: req.user._id});

            res.send({items: notifications, total});
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/notifications/count-not-read')
    @UseBefore(IsAuthenticated)
    async countNotRead(@Req() req: any, @Res() res: any) {
        try {
            let count = await notificationRepository.count({receiver: req.user._id, isRead: false});
            res.send({count});
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Put('/notifications/read-all')
    @UseBefore(IsAuthenticated)
    async readAll(@Req() req: any, @Res() res: any) {
        try {
            await notificationRepository.update({receiver: req.user._id, isRead: false}, {$set: {isRead: true}}, {multi: true});
            res.send({message: 'ok'});
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

}
