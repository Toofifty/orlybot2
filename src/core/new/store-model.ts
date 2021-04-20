import StoreCollection from './store-collection';

export type StoreModelProperties<T> = {
    [K in keyof T]: StoreModel<T[K]> & StoreModelProperties<T[K]>;
};

export class StoreModel<T> {
    /**
     * Database "table" key
     */
    private _key: string;

    /**
     * Path to this data inside document
     */
    private _path: string[];

    protected _data: T;

    public constructor(key: string, path: string[], data?: T) {
        this._key = key;
        this._path = path;
        if (data) {
            this.setData(data);
        }
    }

    public static make<TData>(
        key: string,
        data: TData
    ): StoreModel<TData> & StoreModelProperties<TData> {
        return new StoreModel(key, [], data) as any;
    }

    public setData(data: T) {
        this._data = data;

        Object.keys(data).forEach(key => {
            Object.defineProperty(this, key, {
                get: () => this.getProperty(key),
                set: value => (this._data[key] = value),
            });
        });
    }

    private setProperty(key: string) {}

    private getProperty(key: string) {
        const value = this._data[key];

        if (Array.isArray(value)) {
            return new StoreCollection(key, [...this._path, key], value);
        }

        if (typeof value === 'object') {
            return new StoreModel(key, [...this._path, key], value);
        }

        return value;
    }

    public async save() {}
    public async refresh() {}
    public async fresh() {}
}
