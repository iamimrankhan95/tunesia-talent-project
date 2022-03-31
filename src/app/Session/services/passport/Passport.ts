import { User } from '../../../User/data/models/User';

const passportLib = require('passport');

class Passport {

    req: any;
    res: any;

    init(req: any, res: any) {
        this.req = req;
        this.res = res;
    }

    login(user: User) {
        return new Promise((resolve: Function, reject: Function) => {
            this.req.login(user, (err: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(user);
                }
            });
        });
    }

    authenticate(strategy: string) {
        return new Promise((resolve: Function, reject: Function) => {
            passportLib.authenticate(strategy, (err: any, user: User) => {
                if (err || !user) {
                    if (err) {
                        reject({message: err});
                    } else {
                        reject({message: 'Something wrong'});
                    }
                    return;
                }

                this.login(user)
                    .then(() => {
                        resolve(user);
                    })
                    .catch((error) => {
                        reject(error);
                    });

            })(this.req, this.res);
        });
    }

}

export let passport = new Passport();
