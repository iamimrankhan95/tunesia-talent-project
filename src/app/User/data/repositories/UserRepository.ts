import { MongooseRepository } from '../../../../lib/mongoose-typescript/MongooseRepository';

class UserRepository extends MongooseRepository {

}

export let userRepository = new UserRepository();
