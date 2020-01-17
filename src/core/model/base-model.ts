export default class BaseModel {
    isModel: true;

    static async from(data: any): Promise<BaseModel> {
        return data.isModel ? data : await new this().set(data).finalise(data);
    }

    public set(data: Record<string, any>) {
        Object.entries(data).forEach(([k, v]) => (this[k] = v));
        return this;
    }

    protected async finalise(data: any) {
        return this;
    }
}
