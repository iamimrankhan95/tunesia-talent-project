import { regexUtils } from './RegexUtils';

export class ConditionBuilder {

    body: any;

    constructor(body: any) {
        this.body = body;
        if (!this.body.condition) {
            this.body.condition = {};
        }
    }

    addRanged(field: string, min?: any, max?: any) {
        if (min) {
            this.body[field + 'Min'] = min;
        }
        if (max) {
            this.body[field + 'Max'] = max;
        }
        if (this.body[field + 'Min']) {
            if (!this.body.condition[field]) {
                this.body.condition[field] = {};
            }
            this.body.condition[field]['$gte'] = this.body[field + 'Min'];
        }
        if (this.body[field + 'Max']) {
            if (!this.body.condition[field]) {
                this.body.condition[field] = {};
            }
            this.body.condition[field]['$lte'] = this.body[field + 'Max'];
        }
        return this;
    }

    addNestedMatch(field: string, nestedField: string, value?: any) {
        if (value) {
            this.body[field] = value;
        }
        if (this.body[field]) {
            this.body.condition[field] = {$elemMatch: {[nestedField]: this.body[field]}};
        }
        return this;
    }

    addNestedUnmatch(field: string, nestedField: string, value: any) {
        if (this.body[field]) {
            this.body.condition[field] = {$not: {$elemMatch: {[nestedField]: value}}};
        }
        return this;
    }

    addArray(field: string, value?: any[]) {
        let array: any[];
        if (value) {
            array = value;
        } else {
            if (this.body[field]) {
                if (typeof this.body[field] === 'string') {
                    array = this.body[field].split(',');
                } else {
                    array = this.body[field];
                }
            }
        }
        if (array) {
            this.body.condition[field] = {'$in': array};
        }

        return this;
    }

    add(field: string, value?: any) {
        if (field && value) {
            this.body.condition[field] = value;
        }
        if (this.body[field] && !value) {
            this.body.condition[field] = this.body[field];
        }
        return this;
    }

    addExcluded(field: string) {
        if (this.body[field]) {
            this.body.condition[field] = {'$ne': this.body[field]};
        }
        return this;
    }

    addOr(conditions: any[]) {
        this.body.condition['$or'] = conditions;
        return this;
    }

    addExist(field: string) {
        if (this.body[field]) {
            this.body.condition[field] = {$exists: this.body[field] === 'true'};
        }
        return this;
    }

    addNull(field: string) {
        if (typeof this.body[field] !== 'undefined') {
            this.body.condition[field] = {$eq: null};
        }
        return this;
    }

    addNotNull(field: string) {
        if (this.body[field]) {
            this.body.condition[field] = {$ne: null};
        }
        return this;
    }

    addTextSearch(field: string) {
        if (this.body[field]) {
            this.body.condition['$text'] = {$search: this.body[field]};
        }
        return this;
    }

    addConditionalField(conditionField: string, checkedField: string, exist: boolean) {
        if (this.body[checkedField]) {
            this.body.condition[conditionField] = {$exists: exist};
        }
        return this;
    }

    addRegex(field: string, projection: string[] = ['username'], arrayProjection?: string) {

        if (this.body[field]) {
            let condition = Object.keys(this.body.condition).length > 0 ? [this.body.condition] : [];
            this.body.condition = {$and: condition};
            let regex: any = [];

            projection.forEach((item) => {
                regex.push({[item]: {$regex: new RegExp(regexUtils.escape(this.body[field]), 'i')}});
            });

            if (arrayProjection) {
                regex.push({[arrayProjection]: {$in: [new RegExp(regexUtils.escape(this.body[field]), 'i')]}});
            }

            this.body.condition['$and'].push({$or: regex});
        }

        return this;
    }

    addWhere(field: string, value: string) {
        if (this.body[field] && value) {
            this.body.condition['$where'] = value;
        }
        return this;
    }

    addArrayNotEmpty(field: string, value: boolean) {
        if (value === true) {
            this.body.condition[field] = {$not: {$size: 0}};
        } else if (value === false) {
            this.body.condition[field] = {$size: 0};
        }
        return this;
    }
}
