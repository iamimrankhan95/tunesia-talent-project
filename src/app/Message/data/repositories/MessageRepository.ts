import { MongooseRepository } from '../../../../lib/mongoose-typescript/MongooseRepository';

class MessageRepository extends MongooseRepository {

}

export let messageRepository = new MessageRepository();
