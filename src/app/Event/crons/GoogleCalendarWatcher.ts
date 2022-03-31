import { userRepository } from '../../User/data/repositories/UserRepository';
import { User } from '../../User/data/models/User';
import { GoogleCalendar } from '../services/GoogleCalendar';
import { eventRepository } from '../data/repositories/EventRepository';

const schedule = require('node-schedule');
const moment = require('moment');

class GoogleCalendarWatcher {

    init() {
        this.schedule();
    }

    private schedule() {
        schedule.scheduleJob('* * * * *', () => {
            userRepository.find(
                {
                    'googleCalendarOptions.watching': true
                })
                .then(async (users: User[]) => {
                    for (let user of users) {
                        let googleCalendar = new GoogleCalendar(user);
                        await googleCalendar.init();
                        await googleCalendar.syncMeetings();
                    }
                });

            userRepository.find(
                {
                    'googleCalendarOptions.watching': true,
                    'googleCalendarOptions.expiration': {$gte: moment().add(5, 'm').format('x')}
                })
                .then(async (users: User[]) => {
                    for (let user of users) {
                        let meetings = await eventRepository.find({owner: user._id}).select('status');
                        let havePendingMeetings = meetings.filter((o: any) => o.status === 'pending').length > 0;
                        if (havePendingMeetings) {
                            let googleCalendar = new GoogleCalendar(user);
                            await googleCalendar.init();
                            await googleCalendar.watch();
                        } else {
                            user.googleCalendarOptions = null;
                            await user.save();
                        }
                    }
                });
        });
    }


}

export let googleCalendarWatcher = new GoogleCalendarWatcher();
