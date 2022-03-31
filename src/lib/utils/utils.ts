export const lowercaseFirstLetter = (str: string) => {
    return str.charAt(0).toLowerCase() + str.slice(1);
};

export const instanceName = (object: any) => {
    let funcNameRegex = /class \S+/g;
    let results = (funcNameRegex).exec((object).constructor.toString());
    return (results && results.length >= 1) ? results[0].split(' ')[1] : '';
};

export const className = (object: any) => {
    let funcNameRegex = /class \S+/g;
    let results = (funcNameRegex).exec((object).toString());
    return (results && results.length >= 1) ? results[0].split(' ')[1] : '';
};

export const getMethodsNames = (object: any, extraIgnoreMethods?: any): string[] => {
    let classMethods: any;
    if (object.prototype) {
        classMethods = object.prototype;
    } else {
        classMethods = object.constructor.prototype;
    }
    const ignoreMethods: any = {constructor: true, [extraIgnoreMethods]: true};
    return Object.getOwnPropertyNames(classMethods).filter((name) => !ignoreMethods[name]);
};
