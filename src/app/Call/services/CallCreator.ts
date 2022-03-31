import { callRepository } from '../data/repositories/CallRepository';
import { Call } from '../data/models/Call';
import { User } from '../../User/data/models/User';
import { eventRepository } from '../../Event/data/repositories/EventRepository';

const axios = require('axios');

export class CallCreator {

    private call: Call;

    private readonly eventId: string;
    private readonly applicantId: string;
    private readonly currentUser: User;
    private readonly haveScreenShare: boolean;

    constructor(eventId: string, currentUser: User, applicantId: string, haveScreenShare: boolean) {
        this.eventId = eventId;
        this.applicantId = applicantId;
        this.haveScreenShare = haveScreenShare;
        this.currentUser = currentUser;
    }

    async build() {
        await this.fetchCall();
        if (this.call) {
            let sessionDoesExist = await this.isSessionExist();
            if (!sessionDoesExist) {
                this.call.sessionId = await this.createSession();
            }
        } else {
            let event = await eventRepository.findOne({_id: this.eventId});
            this.call = new Call({
                owner: event.owner,
                event: this.eventId
            });
            this.call.sessionId = await this.createSession();
        }
        let tokens = {...this.call.tokens};
        tokens[this.applicantId ? 'applicant' + this.applicantId : 'user' + this.currentUser._id.toString()] = await this.createToken();
        if (this.haveScreenShare) {
            tokens[this.applicantId ? 'screen_applicant' + this.applicantId : 'screen_user' + this.currentUser._id.toString()] = await this.createToken();
        }
        this.call.tokens = tokens;
        await this.call.save();
        return this.call;
    }

    private async fetchCall() {
        this.call = await callRepository.findOne({
            event: this.eventId
        });
    }

    private async isSessionExist() {
        try {
            let sessionResult = await axios({
                method: 'GET',
                headers: {
                    'content-type': 'application/json',
                    'Authorization': 'Basic ' + Buffer.from('OPENVIDUAPP:amine96295751').toString('base64')
                },
                url: 'https://openvidu.talent.social/api/sessions/' + this.call.sessionId
            });
            return sessionResult.status === 200;
        } catch (error) {
            return false;
        }

    }

    private async createSession() {
        let session = await axios({
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from('OPENVIDUAPP:amine96295751').toString('base64')
            },
            data: {},
            url: 'https://openvidu.talent.social/api/sessions'
        });
        return session.data.id;
    }

    private async createToken() {
        let tokenResult = await axios({
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from('OPENVIDUAPP:amine96295751').toString('base64')
            },
            data: {session: this.call.sessionId, role: 'PUBLISHER'},
            url: 'https://openvidu.talent.social/api/tokens'
        });
        return tokenResult.data.token;
    }

}
