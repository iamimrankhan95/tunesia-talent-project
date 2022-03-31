import { callRepository } from '../data/repositories/CallRepository';
import { Call } from '../data/models/Call';
import { User } from '../../User/data/models/User';
import { liveClassRoomRepository } from '../../LiveClassRoom/data/repositories/LiveClassroomRepository';

const axios = require('axios');

export class LiveClassroomCreator {

    private call: Call;

    private readonly liveClassroomId: string;
    private readonly currentUser: User;
    private readonly haveScreenShare: boolean;

    constructor(liveClassroomId: string, currentUser: User, haveScreenShare: boolean) {
        this.liveClassroomId = liveClassroomId;
        this.haveScreenShare = haveScreenShare;
        this.currentUser = currentUser;
    }

    async build() {
        await this.fetchCall();
        let isNewCall = !!this.call;
        if (this.call) {
            let sessionDoesExist = await this.isSessionExist();
            if (!sessionDoesExist) {
                this.call.sessionId = await this.createSession();
            }
        } else {
            let liveClassroom = await liveClassRoomRepository.findOne({_id: this.liveClassroomId});
            this.call = new Call({
                owner: liveClassroom.owner,
                liveClassroom: this.liveClassroomId
            });
            this.call.sessionId = await this.createSession();
        }
        let tokens = {...this.call.tokens};
        if (this.haveScreenShare) {
            tokens['screen_user' + this.currentUser._id.toString()] = await this.createToken();
        } else {
            tokens['user' + this.currentUser._id.toString()] = await this.createToken();
        }
        this.call.tokens = tokens;
        if (isNewCall) {
            let call = await this.call.save();
            this.call._id = call._id;
            await liveClassRoomRepository.update({_id: this.liveClassroomId}, {
                $set: {call: this.call._id}
            });
        } else {
            await this.call.save();
        }
        return this.call;
    }

    private async fetchCall() {
        this.call = await callRepository.findOne({
            liveClassroom: this.liveClassroomId
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
