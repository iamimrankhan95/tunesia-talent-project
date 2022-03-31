import { MongooseRepository } from '../../../../lib/mongoose-typescript/MongooseRepository';


class ApplicantRepository extends MongooseRepository {

}

export let applicantRepository = new ApplicantRepository();
