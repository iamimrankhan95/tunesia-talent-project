import { applicantRepository } from '../data/repositories/ApplicantRepository';
import { Applicant } from '../data/models/Applicant';
import { User } from '../../User/data/models/User';

export class ApplicantUpdator {

    private readonly requestBody: any;
    private readonly applicantId: string;
    private readonly currentUser: User;

    private applicant: Applicant;

    private updateBody: any;


    constructor(requestBody: any, applicantId: string, currentUser: User) {
        this.currentUser = currentUser;
        this.requestBody = requestBody;
        this.applicantId = applicantId;
        this.updateBody = {};
    }

    async update() {
        await this.fetchApplicant();
        this.prepareUpdateBody();
        await this.updateApplicant();
    }

    private async updateApplicant() {
        await applicantRepository.update({_id: this.applicantId}, {
            $set: this.updateBody
        }, {multi: false});
    }

    private async fetchApplicant() {
        this.applicant = await applicantRepository.findOne({_id: this.applicantId}).populate('job');
    }

    private prepareUpdateBody() {
        for (let field of ['name', 'email', 'phone', 'location']) {
            if (typeof this.requestBody[field] !== 'undefined') {
                this.updateBody[field] = this.requestBody[field];
            }
        }
        if (this.updateBody['name']) {
            this.updateBody['lowername'] = this.updateBody['name'].toLowerCase();
        }
        if (this.updateBody['email']) {
            this.updateBody['loweremail'] = this.updateBody['email'].toLowerCase();
        }
    }
}
