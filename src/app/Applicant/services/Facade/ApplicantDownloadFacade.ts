import { applicantRepository } from '../../data/repositories/ApplicantRepository';
import { User } from '../../../User/data/models/User';
import { eventRepository } from '../../../Event/data/repositories/EventRepository';
import { Json2Excel } from '../../../Shared/services/Json2Excel';
import { callRepository } from '../../../Call/data/repositories/CallRepository';

const moment = require('moment');

export class ApplicantDownloadFacade {

    private readonly params: any;
    private readonly user: User;

    private condition: any = {};
    private sort: any = {updatedAt: -1};
    private applicants: any[];
    private items: any[];

    constructor(params: any, user: User) {
        this.params = params;
        this.user = user;
    }

    async create() {
        await this.createCondition();
        await this.fetchApplicants();
        await this.bindEvents();
        this.createItems();
        let converter = new Json2Excel(this.items);
        return converter.convert();
    }

    private async createItems() {
        this.items = [];
        for (let applicant of this.applicants) {
            let item = {
                'Name': applicant.name,
                'Email': applicant.email
            };
            if (applicant.event) {
                if (moment().diff(applicant.event.date) > 0) {
                    if (applicant.calls.length === 0) {
                        item['Status'] = 'Absent';
                    } else {
                        let chosenCall;
                        for (let call of applicant.calls) {
                            if (call.rate) {
                                chosenCall = call;
                                break;
                            }
                        }
                        if (chosenCall.rate) {
                            item['Status'] = 'Taken';
                            for (let criteria of chosenCall.rate) {
                                item[criteria.title + ' Score'] = criteria.score;
                                item[criteria.title + ' Comments'] = criteria.comments;
                            }
                        } else {
                            item['Status'] = 'Absent';
                        }

                    }
                } else {
                    item['Status'] = 'Not Taken Yet';
                }
                item['Interview date'] = moment(applicant.event.date).tz('Asia/Kolkata').format('dddd, MMMM Do YYYY, h:mm a');
                item['Interviewer'] = applicant.event.owner.name;
            }
            this.items.push(item);
        }
    }

    private async fetchApplicants() {
        let query = applicantRepository.find(this.condition).populate('university');
        this.applicants = await query.sort(this.sort).lean();
    }

    private async createCondition() {
        if (!this.user.belongToTalent()) {
            this.condition.university = this.user.university._id;
        }
        if (this.user.type === 'universityMember') {
            let events = await eventRepository.find({owner: this.user._id});
            this.condition._id = {$in: events.map(o => o.data.applicant)};
        }
    }

    private async bindEvents() {
        let events = await eventRepository.find({'data.applicant': this.applicants}).populate('owner', ['name']).select('_id owner data date').sort({createdAt: -1}).lean();
        let calls = await callRepository.find({event: events.map(o => o._id)}).select('event rate').sort({createdAt: -1}).lean();
        for (let applicant of this.applicants) {
            let applicantEvents = events.filter(o => o.data.applicant.toString() === applicant._id.toString());
            let applicantEventIds = applicantEvents.map(o => o._id.toString());
            if (applicantEvents.length > 0) {
                applicant.event = applicantEvents[0];
                applicant.calls = calls.filter(o => applicantEventIds.indexOf(o.event.toString()) > -1);
            }
        }
    }
}
