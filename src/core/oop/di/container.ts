export type Constructable<T> = new (...args: any[]) => T;

class ContainerClass {
    private singletons: Map<Constructable<any>, any> = new Map();

    public singleton<T>(service: Constructable<T>, singleton: T) {
        this.singletons.set(service, singleton);
        return this;
    }

    public resolve<T>(service: Constructable<T>) {
        if (this.singletons.has(service)) {
            return this.singletons.get(service);
        }

        const tokens = Reflect.getMetadata('design:paramtypes', service) ?? [];
        const injections = tokens.map(this.resolve.bind(this));

        return new service(...injections);
    }

    /**
     * Execute a method with the require dependencies
     */
    public execute<T>(target: T, property: string, ...args: any[]) {
        const tokens =
            Reflect.getMetadata('design:paramtypes', target, property) ?? [];
        const injections = tokens.map(this.resolve.bind(this));

        return target[property].bind(target)(...injections, ...args);
        // return Function.call(target, property, ...injections, ...args);
    }
}

const Container = new ContainerClass();
export default Container;
