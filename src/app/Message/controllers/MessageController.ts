import { Delete, Get, JsonController, Param, Post, Put, Req, Res, UseBefore } from 'routing-controllers';
import { Validate } from '../../../lib/validator/Validator';
import { IsAuthenticated } from '../../Session/policies/IsAuthenticated';
import { messageRepository } from '../data/repositories/MessageRepository';

@JsonController()
export class MessageController {

    @Post('/messages')
    @UseBefore(IsAuthenticated)
    @Validate([
        {
            field: 'sender', validation: [
                { value: 'notEmpty', message: 'sender is required' }
            ]
        },
        {
            field: 'chat', validation: [
                { value: 'notEmpty', message: 'chat is required' }
            ]
        },
        {
            field: 'content', validation: [
                { value: 'notEmpty', message: 'content is required' }
            ]
        },
        'createdAt'
    ])
    async create(@Req() req: any, @Res() res: any) {
        try {
            const { sender, chat, createdAt, content } = req.body;
            await messageRepository.create({
                sender,
                chat,
                createdAt,
                content
            });
            res.send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Put('/messages/:id([0-9a-f]{24})')
    @UseBefore(IsAuthenticated)
    @Validate([
        {
            field: 'id', validation: [
                { value: 'notEmpty', message: 'id is required' }
            ]
        }, 'sender', 'chat', 'createdAt', 'content'
    ])
    async update(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            let updateBody: any = {};
            for (let field of ['sender', 'chat', 'createdAt', 'content']) {
                if (typeof req.body[field] !== 'undefined') {
                    updateBody[field] = req.body[field];
                }
            }
            await messageRepository.update({ _id: id }, {
                $set: updateBody
            }, { multi: false });
            res.send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/messages')
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
                    createdAt: { '$regex': keyword, '$options': 'i' }
                }, {
                    content: { '$regex': keyword, '$options': 'i' }
                }];
            }

            let messages = await messageRepository.find(condition)
                .skip(+skip)
                .limit(+limit)
                .sort({ createdAt: -1 })
                .populate('sender', 'chat');

            let total = await messageRepository.count(condition);

            res.send({ items: messages, total });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/messages/:id([0-9a-f]{24})')
    // do we need to be authenticated to get a message?
    @UseBefore(IsAuthenticated)
    async findOne(@Req() req: any, @Res() res: any, @Param('id') id: string) {
        try {
            let message = await messageRepository.findOne({ _id: id }).populate('sender', 'chat');
            res.send(message);
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Delete('/messages/:id([0-9a-f]{24})')
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
            await messageRepository.destroy({ _id: id }, req.message);
            res.send({ message: 'deleted successful' });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

    @Get('/messages/chat')
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
        },
        {
            field: 'chatId', validation: [
                { value: 'notEmpty', message: 'chatId is required' }
            ]
        }])
    async findByChat(@Req() req: any, @Res() res: any) {
        try {
            const {skip, limit, chatId} = req.query;
            let condition: any = {};

            let messages = await messageRepository.find({'chat': chatId})
                .skip(+skip)
                .limit(+limit)
                .sort({ createdAt: -1 });

            let total = await messageRepository.count(condition);

            res.send({ items: messages, total });
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }

}
