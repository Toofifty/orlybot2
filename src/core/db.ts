import PouchDB from 'pouchdb-node';
import { logerror } from './log';

class Database {
    private db: PouchDB.Database;

    constructor(dbKey: string) {
        this.db = new PouchDB(dbKey);
    }

    public async get(id: string) {
        return this.db.get(id).catch(() => undefined);
    }

    public async put(data: any) {
        return this.db.put(data).catch(logerror);
    }

    public async update(key: string, callback: (data: any) => any) {
        return this.put(
            await this.get(key)
                .then(obj => ({ ...obj, _id: key }))
                .then(callback)
                .catch(logerror)
        ).catch(logerror);
    }
}

const db = new Database('data');
export default db;
