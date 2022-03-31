import { Delete, Get, JsonController, Param, Post, Put, Req, Res, UseBefore } from 'routing-controllers';
import { Validate } from '../../../lib/validator/Validator';
import { IsAuthenticated } from '../../Session/policies/IsAuthenticated';
import { chatRepository } from '../data/repositories/ChatRepository';

@JsonController()
export class ChatController {

    @Post('/chats')
    @UseBefore(IsAuthenticated)
    async create(@Req() req: any, @Res() res: any) {
        try {
            await chatRepository.create({
            });
            res.send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/chats')
    @UseBefore(IsAuthenticated)
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
        }, 'keyword'])
    async find(@Req() req: any, @Res() res: any) {
        try {
            const { keyword, skip, limit } = req.query;
            let condition: any = {};
            if (keyword) {
                condition.$or = [{
                    type: { '$regex': keyword, '$options': 'i' }
                }, {
                    createdAt: { '$regex': keyword, '$options': 'i' }
                }];
            }
            // analogy to UserController -> find condition
            // let chatTypes = ['LiveClassRoom'];
            // if (chatTypes.includes(req.chat.type)) {
            //     condition.type = chatTypes;
            // }
            // condition._id = { $not: { $in: [req.chat._id] } };

            let chats = await chatRepository.find(condition)
                .skip(+skip)
                .limit(+limit)
                .sort({ createdAt: -1 })
                .populate('messages', 'origin');

            let total = await chatRepository.count(condition);

            res.send({ items: chats, total });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/chats/:id([0-9a-f]{24})')
    // do we need to be authenticated to get a chat?
    @UseBefore(IsAuthenticated)
    async findOne(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            let chat = await chatRepository.findOne({ _id: id });
            res.send(chat);
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Delete('/chats/:id([0-9a-f]{24})')
    @UseBefore(IsAuthenticated)
    @Validate([
        {
            field: 'id', validation: [
                { value: 'notEmpty', message: 'id is required' }
            ]
        },
    ])
    async delete(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            await chatRepository.destroy({ _id: id }, req.chat);
            res.send({ message: 'deleted successful' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

}
