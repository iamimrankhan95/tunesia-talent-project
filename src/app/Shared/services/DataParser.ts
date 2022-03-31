
const cheerio = require('cheerio');

class DataParser {

    parse(content: string, dataContainer: any) {
        content = this.prepareContent(content);

        let fields = this.getFields(content);

        for (let field of fields) {
            let regex = new RegExp('\\{{' + field + '\\}}', 'g');
            content = content.replace(regex, this.getContent(dataContainer, field));
        }

        return content;
    }

    parseToText(content: string, dataContainer: any) {
        return cheerio.load(this.parse(content, dataContainer)).text();
    }

    prepareContent(content: string) {
        const $ = cheerio.load(content);
        $('span').each(function (i: any, elem: any) {
            let varName = elem.attribs['data-original-variable'];
            if (varName) {
                $('[data-original-variable=\'' + varName + '\']').replaceWith(varName);
            }
        });
        return $.html();
    }

    getFields(content: string) {
        let regex = /{{(.*?)}}/ig;
        let found = content.match(regex);
        if (!found) {
            return [];
        }
        return found.map((match) => {
            return match.substr(2, match.length - 4);
        });
    }

    getContent(dataContainer: any, key: string): any {
        key = key.replace(new RegExp('ALIAS', 'g'), '');
        if (key.indexOf('CONSTANT') > -1) {
            return process.env[key.replace('CONSTANT.', '')];
        }
        if (key.indexOf('.') > -1) {
            let keys = key.split('.');
            return this.getContent(dataContainer[keys[0]], key.replace(keys[0] + '.', ''));
        }
        if (typeof dataContainer[key] === 'undefined') {
            console.error(dataContainer);
            console.error(key);
            return '';
        }
        return dataContainer[key];
    }
}

export let dataParser = new DataParser();
