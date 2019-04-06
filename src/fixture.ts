import { Customization } from './customization';
import TypeComposer from './type-composer';
import { ValueGenerator } from './generators/value-generator';
import { isObject, ensure } from './utils';
import ObjectBuilder from './object-builder';

export class Fixture implements FixtureContext {
    private _frozenTypes: {[type: string]: any};
    private readonly _generator: ValueGenerator<number>;
    private readonly _customizations: Customization;

    constructor(generator: ValueGenerator<number>) {
        this._generator = generator;
        this._customizations = new Customization();
        this._frozenTypes = {};
    }

    get customizations(): Customization {
        return this._customizations;
    }

    customize(customization: Customization): this {
        customization.builders.forEach(b => this._customizations.add(b));

        return this;
    }

    freeze(type: string): this {
        if (this._frozenTypes[type]) return this;

        const value = this.create<any>(type);
        this._frozenTypes[type] = isObject(value) ? Object.freeze(value) : value;

        return this;
    }

    use<T>(type: string, value: T): this {
        this._frozenTypes[type] = value;
        return this;
    }

    create<T>(type: string): T {
        const builder = this._customizations.get(type);

        ensure(() => !!builder, `No builder defined for type or alias '${type}'`, ReferenceError);

        if (this._frozenTypes[type]) {
            return this._frozenTypes[type];
        }

        return builder.build(this);
    }

    createMany<T>(type: string, size?: number): T[] {
        const list: T[] = [];
        size = !!size ? size : this._generator.generate();

        for (let i = 0; i < size; i++) {
            list.push(this.create<T>(type));
        }

        return list;
    }

    build<T extends object>(type: string): TypeComposer<T> {
        return new TypeComposer<T>(type, this, this._generator);
    }

    from(template: object): ObjectBuilder {
        return new ObjectBuilder(template, this, this._generator);
    }

    reset() {
        this._frozenTypes = {};
    }
}

export interface FixtureContext {
    create<T>(type: string): T;
    createMany<T>(type: string, size?: number): T[];
    build<T extends object>(type: string): TypeComposer<T>;
    from(template: object): ObjectBuilder;
}
