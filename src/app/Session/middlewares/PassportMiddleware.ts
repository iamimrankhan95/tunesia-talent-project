import { MiddlewareGlobalBefore, MiddlewareInterface } from 'routing-controllers';
import { passport } from '../services/passport/Passport';

@MiddlewareGlobalBefore()
export class PassportMiddleware implements MiddlewareInterface {

    use(request: any, response: any, next?: (err?: any) => any): any {
        passport.init(request, response);
        next();
    }

}
