export const pluginsSymbol = Symbol('plugins');

export const Plugin = (plugin: any, param: any) => {
    return (Class: any) => {
        Class[pluginsSymbol] = Class[pluginsSymbol] || [];
        Class[pluginsSymbol].push({plugin, param});
        return Class;
    };
};
