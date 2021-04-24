import db from 'core/db';
import StoreModel, { StoreModel as StoreModelClass } from './store-model';
import { NoUndefined } from './types';

export class Store<T> extends StoreModel<T> {
    protected initial: NoUndefined<T>;
    protected data: NoUndefined<T>;

    constructor(key: string) {
        super(key, []);
    }

    async init() {
        await this.load();
    }

    /**
     * Attempt to load store data from disk.
     * If not data is found, this will be
     * populated with the `initial` data.
     */
    async load() {
        this.data = (await db.get<NoUndefined<T>>(this.key))!;

        if (!this.data) {
            this.data = this.initial;
            this.createFields();
            await this.save();
        }
    }

    /**
     * Save the entire store. The store will
     * be refreshed with new data.
     */
    async save(): Promise<void>;
    /**
     * Save a single model in the store. The model
     * will automatically be updated with the new data,
     * and the store data will also include the mutation.
     */
    async save<TModel extends StoreModelClass<any>>(
        model?: TModel
    ): Promise<void>;
    async save(model?: StoreModelClass<any>) {
        if (model) {
            const [finalProperty, ...reversedPath] = model.getPath().reverse();
            let target = this.data;
            reversedPath
                .reverse()
                .forEach(property => (target = target[property]));
            target[finalProperty] = model.getPath();
        }

        await db.update<T>(this.key, data => ({ ...data, ...this.data }));
        this.data = (await db.get<T>(this.key)) as NoUndefined<T>;
    }
}
