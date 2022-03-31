import { mailer } from './Mailer';

const ejs = require('ejs');

export class Mail {

    static send(email: string, mail: Mail) {
        return new Promise((resolve: Function, reject: Function) => {
            let mailOptions: any = mail.build();
            mailOptions.from = '"Talent " <' + process.env.MAILER_FROM + '>';
            mailOptions.to = email;

            ejs.renderFile(mailOptions.template,
                mailOptions.data, {}, (err: any, html: any) => {
                    if (err) {
                        reject(err);
                    }
                    mailOptions.html = html;
                    mailer.send(mailOptions)
                        .then((info: any) => {
                            resolve(info);
                        })
                        .catch((error: any) => {
                            reject(error);
                        });
                });
        });
    }

    build() {

    }

    async send(email: string) {
        await Mail.send(email, this);
    }
}
