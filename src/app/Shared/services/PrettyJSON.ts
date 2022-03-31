class PrettyJSON {

    data: any;
    json: any;

    constructor(data: any) {
        this.data = data;
    }

    getAcceptableFields(fields: string[], object: any) {
        let acceptedFields: string[] = [];
        for (let field in object) {
            if (object.hasOwnProperty(field)) {
                if (fields.indexOf(field) === -1) {
                    acceptedFields.push(field);
                }
            }
        }
        return acceptedFields;
    }

    // TODO replace convert to set by .filter(function(item, i, allItems) {return i == allItems.indexOf(item);});
    getAllFields(fields: string[]): string[] {
        if (!(this.data instanceof Array)) {
            return this.getAcceptableFields(fields, this.getJson(this.data));
        }
        let acceptedFields: string[] = [];
        for (let object of this.data) {
            acceptedFields = acceptedFields.concat(this.getAcceptableFields(fields, this.getJson(object)));
            acceptedFields = Array.from(new Set(acceptedFields));
        }
        return acceptedFields;

    }

    exclude(fields: string[]) {
        this.assignValues(this.getAllFields(fields));
        return this;
    }

    only(fields: string[]) {
        this.assignValues(fields);
        return this;
    }

    assignValues(keys: any[], isField: boolean = true) {
        if (this.data instanceof Array) {
            if (!this.json) {
                this.json = [];
            }
            for (let i = 0; i < this.data.length; i++) {
                if (!this.json[i]) {
                    this.json[i] = {};
                }
                Object.assign(this.json[i], this.getValues(keys, this.data[i], isField));
            }
        } else {
            if (!this.json) {
                this.json = {};
            }
            Object.assign(this.json, this.getValues(keys, this.data, isField));
        }
    }

    getValues(keys: string[], data: any, isField: boolean) {
        let obj: any = {};
        for (let key of keys) {
            obj[key] = isField ? data[key] : data[key]();
        }
        return obj;
    }

    methods(methods: string[]) {
        this.assignValues(methods, false);
        return this;
    }

    add(fieldName: string, method: any, field: string) {
        if (this.data instanceof Array) {
            for (let i = 0; i < this.data.length; i++) {
                this.addMethod(fieldName, method, this.data[i], this.json[i], field);
            }
        } else {
            this.addMethod(fieldName, method, this.data, this.json, field);
        }
        return this;
    }

    addMethod(fieldName: string, method: any, data: any, json: any, field: string) {
        this.assignField(json, fieldName, method.call(this, data[field]));
    }

    assignField(obj: any, fieldName: string, value: any) {
        if (fieldName.indexOf('.') > -1) {
            let fieldParts = fieldName.split('.');
            let firstFieldName = fieldParts.shift();
            if (!obj[firstFieldName]) {
                obj[firstFieldName] = {};
            }
            this.assignField(obj[firstFieldName], fieldParts.join('.'), value);
        } else {
            obj[fieldName] = value;
        }
    }

    toJSON() {
        return this.json;
    }

    getJson(value: any) {
        if (typeof value.toJSON === 'function') {
            return value.toJSON();
        }
        return value;
    }
}

export const toJSON = (data: any) => {
    return new PrettyJSON(data);
};
