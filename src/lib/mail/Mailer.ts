const nodemailer = require('nodemailer');

class Mailer {

    transporter: any;

    init() {
        const smtpConfig = {
            host: process.env.MAILER_HOST,
            port: process.env.MAILER_PORT,
            // secure: true,
            auth: {
                user: process.env.MAILER_USERNAME,
                pass: process.env.MAILER_PASSWORD
            }
        };
        this.transporter = nodemailer.createTransport(smtpConfig);
    }

    send(mailOptions: any) {
        return new Promise((resolve: Function, reject: Function) => {
            this.transporter.sendMail(mailOptions, (error: any, info: any) => {
                if (error) {
                    console.error(error);
                    reject(error);
                } else {
                    console.info(info);
                    resolve(info);
                }

            });
        });
    }

}

export let mailer = new Mailer();
