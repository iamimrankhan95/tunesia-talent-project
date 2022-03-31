import { userRepository } from '../../../../User/data/repositories/UserRepository';
import { User } from '../../../../User/data/models/User';

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

class BasicAuth {

    init() {
        passport.use(new LocalStrategy(
            {
                usernameField: 'email',
                passwordField: 'password'
            },
            (email: any, password: any, done: any) => {
                let currentUser: User;
                return userRepository
                    .findOne({email})
                    .populate('university')
                    .then((user: any) => {
                        if (!user) {
                            done('Email / Password don\'t match', false);
                        } else {
                            currentUser = user;
                            if (currentUser.useTwoFactorAuth) {
                                return currentUser.isValidTwoFactorToken(password);
                            } else {
                                return currentUser.isValidPassword(password);
                            }
                        }
                    })
                    .then((result: boolean) => {
                        if (!result) {
                            done('Email / Password don\'t match', false);
                        } else {
                            done(null, currentUser);
                        }
                    })
                    .catch((err: any) => {
                        console.error(err);
                        done(err);
                    });
            }
        ));
    }

}

export let basic = new BasicAuth();
