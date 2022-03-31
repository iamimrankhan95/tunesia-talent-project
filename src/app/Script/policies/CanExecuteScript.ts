import { Middleware, MiddlewareInterface } from 'routing-controllers';

@Middleware()
export class CanExecuteScript implements MiddlewareInterface {

    use(req: any, res: any, next?: (err?: any) => any): any {
        let token = req.query.token || req.body.token;
        if (token === '7f870b21bad041c91f1b5a2227a7fcb4') {
            next();
        } else {
            res.status(400).send({message: 'Whot ?'});
        }
    }
}
