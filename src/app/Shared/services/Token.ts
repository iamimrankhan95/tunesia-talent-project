const jwt = require('jsonwebtoken');

export class Token {

    private readonly data: any;

    constructor(data: any) {
        this.data = data;
    }

    static extract(token: string) {
        return jwt.verify(token, process.env.JWT_SECRET);
    }

    generate() {
        return jwt.sign(this.data, process.env.JWT_SECRET, {expiresIn: process.env.JWT_TIMEOUT || '6h'});
    }

}
