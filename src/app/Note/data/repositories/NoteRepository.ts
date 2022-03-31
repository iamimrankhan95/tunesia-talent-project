import { MongooseRepository } from '../../../../lib/mongoose-typescript/MongooseRepository';


class NoteRepository extends MongooseRepository {

}

export let noteRepository = new NoteRepository();
