import { MongooseRepository } from '../../../../lib/mongoose-typescript/MongooseRepository';


class LectureRepository extends MongooseRepository {

}

export let lectureRepository = new LectureRepository();
