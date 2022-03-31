import { mailer } from './Mailer';

const ejs = require('ejs');

export abstract class AsyncMail {

    send(email?: string) {
        return new Promise((resolve: Function, reject: Function) => {
            this.build().then((mailOptions: any) => {
                mailOptions.from = '"Talent " <' + process.env.MAILER_FROM + '>';
                if (email) {
                    mailOptions.to = email;
                }

                ejs.renderFile(mailOptions.template, mailOptions.data, {}, (err: any, html: any) => {
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
        });
    }

    protected abstract build(): Promise<any>;
}
