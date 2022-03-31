import { Middleware, MiddlewareInterface } from 'routing-controllers';
import { userRepository } from '../../User/data/repositories/UserRepository';

@Middleware()
export class IsAuthenticated implements MiddlewareInterface {

    use(req: any, res: any, next?: (err?: any) => any): any {
        if (req.headers.authorizationtoken) {
            userRepository.findOne({token: req.headers.authorizationtoken})
                .then((user: any) => {
                    if (!user) {
                        res.status(401).send({error: 'You are not authenticated'});
                        return;
                    }
                    req.user = user;
                    next();
                });
        } else {
            if (req.isAuthenticated()) {
                next();
            } else {
                res.status(401).send({error: 'You are not authenticated'});
            }
        }
    }
}
