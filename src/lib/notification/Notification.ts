import { NotificationType } from './NotificationType';

export class Notification {

    static send(user: any, notification: any) {
        notification
            .via(user)
            .then((methods: NotificationType[]) => {
                methods.push(NotificationType.Database);
                for (let method of methods) {
                    notification['to' + method](user);
                }
            });
    }

}
