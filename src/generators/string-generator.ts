import * as uuid from 'uuid/v4';

import { ValueGenerator } from './value-generator';

export class StringGenerator implements ValueGenerator<string> {
    generate(): string {
        return uuid();
    }
}
