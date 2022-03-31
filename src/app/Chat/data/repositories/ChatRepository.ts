import { MongooseRepository } from '../../../../lib/mongoose-typescript/MongooseRepository';

class ChatRepository extends MongooseRepository {

}

export let chatRepository = new ChatRepository();
