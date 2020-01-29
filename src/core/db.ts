import PouchDB from 'pouchdb-node';

class Database {
    private db: PouchDB.Database;

    constructor(dbKey: string) {
        this.db = new PouchDB(dbKey);
    }

    public async get(id: string) {
        return this.db.get(id).catch(() => undefined);
    }

    public async put(data: any) {
        return this.db.put(data);
    }
}

const db = new Database('data');
export default db;
