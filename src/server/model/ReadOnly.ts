import '../../../node_modules/reflect-metadata/Reflect.js';
// import 'reflect-metadata'; // Fully qualified path to accomodate ES6 imports

const READ_ONLY_KEY = Symbol('read-only');

type DecoratorFunction = {
    (target: Function): void;
    (target: Object, propertyKey: string | symbol): void;
}

export function readOnly(readOnly: boolean = true): DecoratorFunction {
    return Reflect.metadata(READ_ONLY_KEY, readOnly);
}

export function getReadOnly(instance: any, propertyName: string): boolean {
    return Reflect.getMetadata(READ_ONLY_KEY, instance, propertyName);
}
