class Base64 {


    decodeData(dataString: any) {

        let matches = dataString.match(/^data:([0-9A-Za-z-+\/;=]+);base64,(.+)$/),
            response: any = {};

        if (!matches || matches.length !== 3) {
            throw new Error('Invalid base64 input string');
        }

        return {buffer: new Buffer(matches[2], 'base64')};
    }
}

export let base64 = new Base64();
