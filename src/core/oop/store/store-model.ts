import { NoUndefined } from './types';

export class StoreModel<T> {
    protected data: NoUndefined<T>;

    constructor(
        protected key: string,
        private path: string[],
        data?: NoUndefined<T>
    ) {
        if (data) {
            this.data = data;
            this.createFields();
        }
    }

    createFields() {
        Object.keys(this.data).forEach(key => {
            Object.defineProperty(this, key, {
                get: () => this.data[key],
                set: value => (this.data[key] = value),
            });
        });
    }

    getPath() {
        return this.path;
    }

    getData() {
        return this.data;
    }

    toString() {
        return this.data.toString();
    }
}

export default StoreModel;
