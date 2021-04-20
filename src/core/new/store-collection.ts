export default class StoreCollection<T> {
    public constructor(key: string, path: string[], data: T[]) {
        // this._key = key;
        // this._path = path;
        // this._data = data;
        // Object.keys(data).forEach(key => {
        //     Object.defineProperty(this, key, {
        //         get: () => this._data[key],
        //         set: value => (this._data[key] = value),
        //     });
        // });
    }
}
