import CommandController from './command-controller';
import { StoreModel, StoreModelProperties } from './store-model';

export class DbStore<T> extends StoreModel<T> {
    protected initial: T;

    public constructor(key: string) {
        super(key, []);
    }

    public static make<T>(
        controller: CommandController
    ): DbStore<T> & StoreModelProperties<T> {
        throw new Error('Not implemented');
    }

    /**
     * Initially load store data, applying the default value
     * if no data is stored.
     *
     * Should only be used inside Controller::before -
     * afterwards use `store::fresh()` or `store::refresh()`
     */
    public async load() {
        await this.refresh();

        if (Object.keys(this._data).length === 0) {
            this.setData(this.initial);
        }
    }

    public async fresh() {
        throw new Error(
            'Tried to load a new copy of the store - use `refresh()` instead'
        );
    }
}
