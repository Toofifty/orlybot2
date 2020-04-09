import PouchDB from 'pouchdb-node';
import { logerror } from './log';

class Database {
    private db: PouchDB.Database;

    constructor(dbKey: string) {
        this.db = new PouchDB(dbKey);
    }

    public async get<T>(id: string): Promise<T | undefined> {
        return this.db.get(id).catch(() => undefined) as any;
    }

    public async put<T>(data: T) {
        return this.db.put(data, { force: true }).catch(logerror);
    }

    public async update<T>(
        key: string,
        callback: (data: T & { _id: string }) => T
    ) {
        return this.put(
            await this.get<T>(key)
                .then(obj => ({ ...obj, _id: key }))
                .then(callback)
        );
    }

    public async all<T>(): Promise<T[]> {
        return (await this.db.allDocs({ include_docs: true })).rows
            .map(({ doc }) => doc)
            .filter(Boolean) as any;
    }
}

const db = new Database('data');
export default db;
