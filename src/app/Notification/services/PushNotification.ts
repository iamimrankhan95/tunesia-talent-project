import { userRepository } from '../../User/data/repositories/UserRepository';
import { User } from '../../User/data/models/User';

const admin = require('firebase-admin');

admin.initializeApp({
    credential: admin.credential.cert({
            'type': 'service_account',
            'project_id': 'talentats-fa69d',
            'private_key_id': 'c90e09e909b39304eb15a59197c24429d10cecde',
            'private_key': '-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDfA78gSG9ZmYdr\novZtAuc3fag6ZFcmv+sZQJMjnOirY1irovAtr2LZEYu5yaYKvZrfsQ9k/HRCSrkn\nuGOTdZVaIRy/5u9BDu6F6m0oYEUGTCd0WVP5s6R0aLf9whoRTJ9/69S7wnLt4dX9\nLIEOzSWF3B8qsg6bA2XcVkAr1P84KlFzL3C8TXF3lrL2sydr6sc/1qmubCQNrAJr\n0uNsomR+mLdvvxdvkv0SWPlqwafuQzJEuQ48vC+kZfBbfLPjpUCtw7sJCWGCFWu0\ndUrEuxb6ZbMLHMwjNlfnOUZ8CfLSH5UWIiNptG5qWuGBtLgNB+UoKyVHuAx6y5zn\nZOlCF3WVAgMBAAECggEABUJX3AGJSrIhrOqjaA+09yyJ7pKWMY4+E5LfxWu6WuxV\nV3rYsiMcMCVHR8LXHRK6l8Lbq5R+g1+yvRqOkpgnxP/Z5zahdsXM3zCXkWevyQW7\nunUu00kmvC4KBLxyk+zcKA6eLi1YO37jZnyJsJkq5Ny7iWy4hnROjyMjkUUNHbxq\ndgHLiE5IF5VhPokKPrfrOvXvrE2WGWDcIEHu4mUeLukp50oMbgMwtU3UVKGyxrAo\nRSQpnSJ6VhyemnIAK6zP9lx5mkiwKeBmgA6D4vPorKV+H3Qxi1765/Eou3jywL5X\nOYdhrYUslL66x2cDbOhAwKBJwzWvtFfgTn1wM2NOkwKBgQD6pNktVwsEk3WkeGcQ\nwt+5jL2M4u20/rgR4no/IXB5ASsnfcgk35tTPd2ASJCGIH2tl6lbMCm3hf2CX7Om\ncPk5hFgyiRUdkvUt6jABTSGY6i1I2zOmHDilnXMSmC2k0BkHONCTXMe0XHXbUTSc\nIhjsqGaAUKyeu6cNxL3VkzbsNwKBgQDjx8Bu8Vc6+Ov/L3y9quvBcPqx6oJCgaq5\nm08C0jFo9Ys+NWOSkAfG5rJce+HjNbkaHl8qWFaYJ9tZhBd3BAacitP6ATCRXHBu\nvpcfpdj+when5dD3DptCU7O0aBiPpzz5Dn8psyvR1lpgsOhTli2Ol0hZLx98UXlt\nCQU2fyu+kwKBgQDILxeB/e4/1mJ0XPG8UliLgtv1hV1jXLm5FxCaEWQaUROdc/mB\ncdJFtriNd+duKM8X8XSC70GyYWLrWPJMMhjrlkc2/YOO3kvSQyPaNjdqQUav1Ns4\nhXu80rcQl9iEtOv4d6kmuUiLRfmflAkX1qffhFRxkX19PdUbyxHvXafVGwKBgQCg\nxU+kvsF0BVgFQM5JzQcj/QtlYoFYUc9fvCgzdIqda5pBaUuDmhdzI0fHEUVpqnSg\n48kFyV4tfQxMjXhGb9f+y9o8fnR6VQWilPFzzApyHiq2PfaVOoEJeqy/bC3Rzxex\nLrNAio8mR6Z40sTYooo7N7pAAIu3ooYTGKfOREpq8wKBgQDZFXxRoNYJkHgCUU5Z\n2JD9Mf9KCYloUL0Daxnzu5NzqhSVsV7YQpl/0RTF+Q2NM10eDs6R6D5qAEDJDf3a\nUHdSHU12Prc/eixWV08Kbj7AQzIxnYb3OpvibiwEYzVsOEh4yqMjX12P5MRZRvC0\n2wsVlSOgPQJjYqtzMqir+f/Vrg==\n-----END PRIVATE KEY-----\n',
            'client_email': 'firebase-adminsdk-x75av@talentats-fa69d.iam.gserviceaccount.com',
            'client_id': '113549542413847659566',
            'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
            'token_uri': 'https://oauth2.googleapis.com/token',
            'auth_provider_x509_cert_url': 'https://www.googleapis.com/oauth2/v1/certs',
            'client_x509_cert_url': 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-x75av%40talentats-fa69d.iam.gserviceaccount.com'
        }
    ),
    databaseURL: 'https://talentats-fa69d.firebaseio.com'
});


export class PushNotification {

    constructor() {

    }

    static send(notification: any, user: User) {

        let title = null;
        if (notification.type === 'activityChanged') {
            title = 'Note updated';
        }
        if (notification.type === 'activityAdded') {
            title = 'Note added';
        }
        if (notification.type === 'activityRemoved') {
            title = 'Note removed';
        }
        if (notification.type === 'meetingConfirmed') {
            title = 'Meeting confirmed';
        }
        if (notification.type === 'meetingDeclined') {
            title = 'Meeting declined';
        }
        if (notification.type === 'statusChanged') {
            title = 'Stage updated';
        }
        if (notification.type === 'jobAssigned') {
            title = 'Job assigned';
        }
        if (notification.type === 'jobRevoked') {
            title = 'Job revoked';
        }

        let messaging = admin.messaging();
        if (!user.playerId) {
            return;
        }
        messaging.sendToDevice(user.playerId, {
            notification: {
                title: title,
                body: notification.message,
                icon: 'https://talent.com/assets/img/social-logo.png',
                click_action: notification.url
            }
        });

    }

    static async create(notification: any) {
        let user = await userRepository.findOne({_id: notification.receiver})
            .select('playerId company')
            .populate('company');
        this.send(notification, user);
    }
}
