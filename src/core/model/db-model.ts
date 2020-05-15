import BaseModel from 'core/model/base-model';
import db from 'core/db';

export default class DbModel extends BaseModel {
    _rev?: string;
    id: string;

    public set(data: Record<string, any>) {
        super.set(data);
        this.id = data._id?.split(':')[1] ?? data.id;
        return this;
    }

    /**
     * Serialize the model for storage.
     */
    public serialize() {
        throw new Error('Unimplemented serialize');
    }

    /**
     * Persist the model to the database.
     */
    public async save() {
        const data: any = this.serialize();
        const stored = await db.get(data._id);

        if (!stored) {
            await db.put(data);
        } else {
            await db.update<any>(data._id, ({ messages, ...obj }) => ({
                ...obj,
                ...data,
            }));
        }
    }
}
