import { TypeBuilder } from '../type-builder';
import { PrimitiveType } from '../primitive-type';

export class NullBuilder implements TypeBuilder<null> {
    type: string = PrimitiveType.null;

    build(): null {
        return null;
    }
}
