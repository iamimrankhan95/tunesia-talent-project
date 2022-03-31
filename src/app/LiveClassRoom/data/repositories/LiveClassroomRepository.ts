import { MongooseRepository } from '../../../../lib/mongoose-typescript/MongooseRepository';
import { chatRepository } from '../../../Chat/data/repositories/ChatRepository';

class LiveClassRoomRepository extends MongooseRepository {
    async createChat(liveClassroomId: string) {
        let classroom = await this.findOne({_id: liveClassroomId});
        let chat = await chatRepository.create({liveClassroom: liveClassroomId});
        classroom.chat = chat._id;
        await classroom.save();
    }
}

export let liveClassRoomRepository = new LiveClassRoomRepository();
