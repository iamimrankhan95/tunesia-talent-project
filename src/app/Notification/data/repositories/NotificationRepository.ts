import { MongooseRepository } from '../../../../lib/mongoose-typescript/MongooseRepository';


class NotificationRepository extends MongooseRepository {
}

export let notificationRepository = new NotificationRepository();
