import { User } from '../../data/models/User';
import { Mail } from '../../../../lib/mail/Mail';

export class ForgetPassword extends Mail {

    private readonly user: User;

    constructor(user: User) {
        super();
        this.user = user;
    }

    build() {

        return {
            template: __dirname + '/forget-password.ejs',
            subject: 'Forget Password',
            data: {
                user: this.user,
                host: process.env.HOST
            }
        };
    }

    async send() {
        super.send(this.user.email);
    }
}
