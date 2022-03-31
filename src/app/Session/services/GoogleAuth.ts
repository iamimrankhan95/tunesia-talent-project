import { User } from '../../User/data/models/User';

const {google} = require('googleapis');
const moment = require('moment-timezone');

export class GoogleAuth {

    private connection: any;

    constructor() {
        this.connection = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_CALLBACK_URL
        );
    }

    getAuthUrl() {
        return this.connection.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/calendar.events']
        });
    }

    async storeAccess(user: User, code: string) {
        const {tokens} = await this.connection.getToken(code);
        user.googleAccess = tokens;
        await user.save();
    }

    async getAuthInstance(user: User) {
        if (!user.googleAccess) {
            throw new Error('No Access to google');
        }
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_CALLBACK_URL
        );
        oauth2Client.setCredentials({
            access_token: user.googleAccess.access_token,
            refresh_token: user.googleAccess.refresh_token
        });
        return oauth2Client;
    }

}
