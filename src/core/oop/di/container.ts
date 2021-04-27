export type Constructable<T> = new (...args: any[]) => T;

class ContainerClass {
    private singletons: Map<Constructable<any>, any> = new Map();

    public singleton<T>(service: Constructable<T>, singleton: T) {
        this.singletons.set(service, singleton);
        return this;
    }

    public async resolve<T>(service: Constructable<T>): Promise<T> {
        if (this.singletons.has(service)) {
            return this.singletons.get(service);
        }

        const tokens = Reflect.getMetadata('design:paramtypes', service) ?? [];
        const injections = await Promise.all(
            tokens.map(this.resolve.bind(this))
        );

        const constructed = new service(...injections);

        if ('init' in constructed) {
            await (constructed as any).init();
        }

        return constructed;
    }

    /**
     * Execute a method with the require dependencies
     */
    public async execute<T>(
        target: T,
        property: string | symbol,
        args?: any[]
    ) {
        if ('prototype' in target) {
            const obj = await this.resolve(target as any);
            return this.execute(obj, property, args);
        }

        const tokens: object[] =
            Reflect.getMetadata('design:paramtypes', target, property) ?? [];

        const injections = await Promise.all(
            tokens
                .filter(
                    token =>
                        !token.toString().startsWith('function String()') &&
                        !token.toString().startsWith('function Object()')
                )
                .map(this.resolve.bind(this))
        );

        return target[property].bind(target)(...injections, ...(args ?? []));
    }
}

const Container = new ContainerClass();
export default Container;
