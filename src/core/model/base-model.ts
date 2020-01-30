export default class BaseModel {
    /**
     * If this field is available at runtime, then we know
     * this is already a model (not database or API data).
     */
    isModel = true;

    /**
     * Create a new model with the properties in data.
     */
    static async from(data: any): Promise<BaseModel> {
        return data.isModel ? data : await new this().set(data).finalise(data);
    }

    /**
     * Set the properties in the model to those of the
     * data passed in.
     */
    public set(data: Record<string, any>) {
        Object.entries(data).forEach(([k, v]) => {
            if (typeof this[k] !== 'function') {
                this[k] = v;
            }
        });
        return this;
    }

    /**
     * Run any necessary steps after the model is initialised.
     */
    protected async finalise(data: any) {
        return this;
    }
}
