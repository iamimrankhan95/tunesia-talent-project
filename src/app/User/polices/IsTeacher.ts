import { Middleware, MiddlewareInterface } from 'routing-controllers';
import { userRepository } from '../data/repositories/UserRepository';

@Middleware()
export class IsTeacher implements MiddlewareInterface {

    use(req: any, res: any, next?: (err?: any) => any): any {
        if (req.headers.authorizationtoken) {
            userRepository.findOne({ token: req.headers.authorizationtoken })
                .then((user: any) => {
                    if (!user) {
                        res.status(401).send({ error: 'You are not authenticated' });
                        return;
                    }
                    if (user.type !== 'teacher') {
                        res.status(401).send({ error: `You don't have acess` });
                        return;
                    }
                    req.user = user;
                    next();
                });
        } else {
            if (req.IsTeacher()) {
                next();
            } else {
                res.status(401).send({ error: 'You are not authenticated' });
            }
        }
    }
}
