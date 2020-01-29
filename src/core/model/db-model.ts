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

    public serialize() {
        throw new Error('Unimplemented serialize');
    }

    public async save() {
        const data: any = this.serialize();
        const stored = await db.get(data._id);

        if (!stored) {
            await db.put(data);
        } else {
            await db.update(data._id, obj => ({ ...obj, ...data }));
        }
    }
}
