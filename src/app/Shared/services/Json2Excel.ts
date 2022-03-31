import { PoolUtils } from '../../../lib/utils/PoolUtils';

const request = require('request').defaults({encoding: null});
const Excel = require('exceljs');
const uuid = require('node-uuid');
const validUrl = require('valid-url');

export class Json2Excel {

    data: any[];
    columns: any[];
    workBook: any;
    workSheet: any;
    specialColumns: any[];

    constructor(data: any[], specialColumns?: any[]) {
        this.data = data;
        this.specialColumns = specialColumns || [];
    }

    init() {
        this.workBook = new Excel.Workbook();
        this.workSheet = this.workBook.addWorksheet('Report');
        let columns = [];
        for (let column of this.columns) {
            let columnContent: any = {header: this.fixHeader(column), key: column};
            columns.push(columnContent);
        }
        this.workSheet.columns = columns;

        for (let item of this.data) {
            this.workSheet.addRow(item);
        }
    }


    fixHeader(column: string) {
        return column.split('.').join('');
    }

    initColumns() {
        this.columns = [];
        for (let item of this.data) {
            for (let key in item) {
                if (item.hasOwnProperty(key)) {
                    if (this.columns.indexOf(key) === -1) {
                        this.columns.push(key);
                    }
                }
            }
        }
    }

    fetchImages() {
        let urls = [];
        for (let column of this.specialColumns) {
            for (let item of this.data) {
                if (item[column] && validUrl.isUri(item[column])) {
                    urls.push(item[column]);
                }
            }
        }
        if (urls.length === 0) {
            return PoolUtils.instantPromise();
        }
        let buffersMap = {};
        let threads = [];

        for (let url of urls) {
            let thread = new Promise((resolve: Function) => {
                request(url, (error, response, body) => {
                    resolve(body);
                });
            });
            threads.push(thread);
        }

        return Promise
            .all(threads)
            .then((images: any[]) => {

                for (let i = 0; i < urls.length; i++) {
                    buffersMap[urls[i]] = images[i];
                }
                return buffersMap;
            });
    }

    getPosition(content: string) {
        for (let i = 0; i < this.data.length; i++) {
            let item = this.data[i];
            for (let j = 0; j < this.columns.length; j++) {
                let column = this.columns[j];
                if (item[column] && item[column] === content) {
                    return {i: i, j: j};
                }
            }
        }
    }


    async convert() {
        this.initColumns();
        this.init();
        let filePath = '/tmp/' + uuid.v1() + '.track-report';
        await this.workBook.xlsx.writeFile(filePath);
        return filePath;
    }

}
