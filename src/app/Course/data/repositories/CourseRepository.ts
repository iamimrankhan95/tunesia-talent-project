import { MongooseRepository } from '../../../../lib/mongoose-typescript/MongooseRepository';


class CourseRepository extends MongooseRepository {

}

export let courseRepository = new CourseRepository();
