import { MongooseModel } from '../../../../lib/mongoose-typescript/MongooseModel';
import { field, pre } from '../../../../lib/mongoose-typescript/Schema';
import { Model } from '../../../../lib/mongoose-typescript/decorators';

const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const otplib = require('otplib');
const uuidv1 = require('uuid/v1');

@Model('User')
export class User extends MongooseModel {

    @field({
        type: String
    })
    email: string;

    @field({
        type: String
    })
    name: string;

    @field({
        type: String
    })
    phone: string;

    @field({
        type: String
    })
    title: string;

    @field({
        type: String,
    })
    password: string;

    @field({
        type: String
    })
    secret: string;

    @field({
        type: Boolean,
        default: false
    })
    useTwoFactorAuth: boolean;

    @field({
        type: Number,
        default: 0
    })
    coursesCount: number;

    @field({
        type: String
    })
    token: string;

    @field({
        type: String,
        default: 'admin',
        enum: ['admin', 'universityOwner', 'universityMember', 'student', 'teacher']
    })
    type: 'admin' | 'universityOwner' | 'universityMember' | 'student' | 'teacher';

    @field({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University'
    })
    university: any;

    @field({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    })
    creator: any;

    @field({
        type: String
    })
    recoveryToken: string;

    @field({
        type: String
    })
    playerId: string;

    @field({
        type: mongoose.Schema.Types.Mixed
    })
    googleAccess: any;

    @field({
        type: mongoose.Schema.Types.Mixed
    })
    googleCalendarOptions: any;

    @field({
        type: Boolean,
        default: true
    })
    isActive: boolean;

    @field({
        type: Date,
        default: new Date()
    })
    createdAt: Date;

    @field({
        type: Date
    })
    updatedAt: Date;

    @field({
        type: String
    })
    location: string;

    @field({
        type: String
    })
    avatar: string;

    @pre('save')
    generateToken(next: Function) {
        if (!this.isNew) {
            next();
            return;
        }
        this.token = uuidv1();
        next();
    }

    @pre('save')
    encryptPassword(next: Function) {
        this.wasNew = this.isNew;
        if (!this.password) {
            next();
        } else {
            return bcrypt
                .hash(this.password, 10).then((hash: any) => {
                    this.password = hash;
                    next();
                });
        }
    }

    isValidPassword(password: string): Promise<boolean> {
        return bcrypt.compare(password, this.password);
    }

    isValidTwoFactorToken(token: string): Promise<boolean> {
        return otplib.authenticator.check(token, this.secret);
    }

    belongToTalent() {
        return this.type === 'admin';
    }

}
