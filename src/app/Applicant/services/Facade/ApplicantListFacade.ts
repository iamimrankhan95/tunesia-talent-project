import { applicantRepository } from '../../data/repositories/ApplicantRepository';
import { User } from '../../../User/data/models/User';
import { eventRepository } from '../../../Event/data/repositories/EventRepository';

export class ApplicantListFacade {

    private readonly params: any;
    private readonly user: User;

    private condition: any = {};
    private sort: any = {updatedAt: -1};
    private applicants: any[];
    private total: number;
    private generatedSkip: number;

    constructor(params: any, user: User) {
        this.params = params;
        this.user = user;
    }

    async create() {
        await this.createCondition();
        await this.createSort();
        await this.fetchApplicants();
        await this.fetchTotal();
        let result: any = {items: this.applicants, total: this.total};
        if (this.generatedSkip) {
            result.generateSkip = this.generatedSkip;
        }
        return result;
    }

    private async fetchTotal() {
        this.total = await applicantRepository.count(this.condition);
    }

    private async fetchApplicants() {
        let {skip, limit, includeApplicantId} = this.params;

        let query = applicantRepository.find(this.condition).populate('university').populate('latestEvent');
        if (typeof skip !== 'undefined') {
            query.skip(+skip).limit(+limit);
        }

        let applicants = await query.sort({latestEventAt: -1}).lean();
        if (includeApplicantId) {
            let applicantIndex = applicants.findIndex((o: any) => o._id.toString() === includeApplicantId);
            let generatedSkip = Math.floor(applicantIndex / (+limit)) * (+limit);
            applicants = applicants.slice(generatedSkip, generatedSkip + (+limit));
            this.generatedSkip = generatedSkip;
        }
        this.applicants = applicants;
    }

    private async createCondition() {
        let {keyword} = this.params;
        if (keyword) {
            this.condition.$or = [
                {
                    name: {'$regex': keyword, '$options': 'i'}
                },
                {
                    email: {'$regex': keyword, '$options': 'i'}
                }
            ];
        }
        if (!this.user.belongToTalent()) {
            this.condition.university = this.user.university._id;
        }
        if (this.user.type === 'universityMember') {
            let events = await eventRepository.find({owner: this.user._id})
                .sort({date: -1, createdAt: -1}).lean();
            this.condition._id = {$in: events.map(o => o.data.applicant)};
        }
    }

    private createSort() {
        let {sortKey, sortValue} = this.params;
        if (sortKey) {
            this.sort = {['lower' + sortKey]: (sortValue === 'descend' ? 1 : -1)};
        }
    }
}
