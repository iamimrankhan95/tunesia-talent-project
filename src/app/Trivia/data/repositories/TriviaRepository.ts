import { MongooseRepository } from '../../../../lib/mongoose-typescript/MongooseRepository';


class TriviaRepository extends MongooseRepository {

}

export let triviaRepository = new TriviaRepository();
