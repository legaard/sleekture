import { FixtureContext } from './fixture';
import { isObject, isArray, ensure } from './utils';
import { ValueGenerator } from './generators';

/**
 * Class for creating object(s) with custom values.
 * The class makes it easy to update/overwrite/remove properties or property values from objects.
 */
export default class TypeComposer<T extends object> {
    private readonly _context: FixtureContext;
    private readonly _type: string;
    private readonly _generator: ValueGenerator<number>;
    private readonly _modifications: {
        type: 'do' | 'with' | 'without',
        property?: keyof T,
        action?: (value: T | T[keyof T]) => any
    }[];

    /**
     * Create a new `TypeComposer`
     * @param type - type to compose
     * @param context - fixture context use when generating data
     * @param generator - number generator to use
     */
    constructor(type: string, context: FixtureContext, generator: ValueGenerator<number>) {
        this._context = context;
        this._type = type;
        this._generator = generator;
        this._modifications = [];
    }

    /**
     * Perform action on object
     * @param action - function to apply on object
     * @returns `this`
     */
    do(action: (type: T) => any): this {
        this._modifications.push({
            type: 'do',
            action
        });

        return this;
    }

    /**
     * Overwrite or update value on object
     * @param property - property to overwrite/update
     * @param value - function returning the new value
     * @returns `this`
     */
    with<K extends keyof T>(property: K, value: (selected: T[K]) => T[K]): this {
        this._modifications.push({
            type: 'with',
            property,
            action: value
        });

        return this;
    }

    /**
     * Remove property from object
     * @param property - property to remove from object
     * @returns `this`
     */
    without<K extends keyof T>(property: K): this {
        this._modifications.push({
            type: 'without',
            property
        });

        return this;
    }

    /**
     * Create custom type
     * @returns single custom type
     * @throws if input is invalid
     */
    create(): T {
        const object = this._context.create<T>(this._type);
        ensure(() => isObject(object), "TypeComposer can only be used with type 'object'", TypeError);

        this._modifications.forEach(a => {
            switch (a.type) {
                case 'do':
                    a.action(object);
                    break;
                case 'with':
                    const currentValue = object[a.property];
                    ensure(
                        () => currentValue !== undefined,
                        `Property '${a.property}' does not exist on type '${this._type}'`,
                        ReferenceError);

                    if (isArray(currentValue)) {
                        object[a.property] = a.action([...currentValue] as unknown as T[keyof T]);
                    } else if (isObject(currentValue)) {
                        object[a.property] = a.action({...currentValue});
                    } else {
                        object[a.property] = a.action(currentValue);
                    }
                    break;
                case 'without':
                    delete object[a.property];
                    break;
            }
        });

        return object;
    }

    /**
     * Create array of custom types
     * @param size - size of array to create (optional)
     * @returns `Array` of custom types
     * @throws if input is invalid
     */
    createMany(size?: number): T[] {
        const list: T[] = [];
        size = size ? size : this._generator.generate();

        for (let i = 0; i < size; i++) {
            list.push(this.create());
        }

        return list;
    }
}
