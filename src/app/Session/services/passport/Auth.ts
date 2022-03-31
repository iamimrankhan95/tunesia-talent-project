import { userRepository } from '../../../User/data/repositories/UserRepository';
import { basic } from './auth/BasicAuth';
import { User } from '../../../User/data/models/User';

const passport = require('passport');

class Auth {

    init() {

        passport.serializeUser(function (user: any, done: Function) {
            return done(null, user._id);
        });

        passport.deserializeUser(function (user: any, done: Function) {
            return userRepository.findOne({_id: user})
                .populate('university')
                .then((currentUser: User) => {
                    return done(null, currentUser);
                });

        });
        basic.init();
    }

}

export let auth = new Auth();
