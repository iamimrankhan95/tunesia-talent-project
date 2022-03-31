import { Middleware, MiddlewareInterface } from 'routing-controllers';
import { userRepository } from '../../User/data/repositories/UserRepository';
import { liveClassRoomRepository } from '../data/repositories/LiveClassroomRepository';

@Middleware()
export class CanJoinLiveClassRoom implements MiddlewareInterface {

  use(req: any, res: any, next?: (err?: any) => any): any {
    liveClassRoomRepository.findOne({_id: req.params.id}).populate(
      {
        path: 'section',
        populate: [
          {
            path: 'class',
            populate: {
              path: 'students'
            }
          },
          {path: 'subject'},
          {path: 'teacher'}
        ]
      })
      .then(async (liveClassRoom: any) => {
        if (!liveClassRoom) {
          res.status(404).send({error: 'Live Classroom not found'});
          return;
        }
        let user = await userRepository.findOne({token: req.headers.authorizationtoken});
        let isParticipant = false;
        if (user.id === liveClassRoom.section.teacher.id) {
          isParticipant = true;
        } else {
          liveClassRoom.section.class.students.forEach(o => {
            if (o.id === user.id) {
              isParticipant = true;
            }
          });
        }
        if (!isParticipant) {
          res.status(400).send({error: 'You are not a participant of this live classroom'});
          return;
        }
        let currentTime = new Date();
        if (currentTime < liveClassRoom.startTime) {
          res.status(400).send({error: 'Live Class has not started yet'});
          return;
        } else if (currentTime > liveClassRoom.endTime) {
          res.status(400).send({error: 'Live Class has ended'});
          return;
        } else {
          req.liveClassRoom = liveClassRoom;
          next();
        }
      });
  }
}
