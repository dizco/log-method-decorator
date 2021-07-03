import { performance } from "perf_hooks";

const SubMethods = Symbol("SubMethods"); // just to be sure there won't be collisions

// Pattern is inspired by https://stackoverflow.com/a/61448736/6316091

interface MethodMetadata<TMetadata> {
    metadata: TMetadata;
    isAsync: boolean;
}

export interface MethodDescriptor<TMetadata> extends MethodMetadata<TMetadata> {
    className: string;
    methodName: string;
}

export interface LogOptions<TLogger, TMetadata> {
    onMethodStart: (logger: TLogger, method: MethodDescriptor<TMetadata>) => void;
    onMethodEnd: (logger: TLogger, method: MethodDescriptor<TMetadata>, executionTimeResult: ExecutionTimeResult<unknown>) => void;
}

export interface ExecutionTimeResult<T> {
    value: T;
    start: Date;
    end: Date;
    executionTimeMs: number;
}

/**
 * Method decorator to indicate that the method calls should be logged
 * To be used in conjunction with LogClass
 * @see LogClass
 * @constructor
 */
export function LogSyncMethod<TMetadata>(metadata: TMetadata): MethodDecorator {
    return LogSyncMethodForSymbol(metadata, SubMethods);
}

export function LogSyncMethodForSymbol<TMetadata>(metadata: TMetadata, methodsSymbol: symbol): MethodDecorator {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars
    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        target[methodsSymbol] = target[methodsSymbol] || new Map<string, MethodMetadata<TMetadata>>();
        // Add some information that class decorator will use
        (target[methodsSymbol] as Map<string, MethodMetadata<TMetadata>>).set(propertyKey.toString(), {
            metadata,
            isAsync: false,
        });
    };
}

/**
 * Method decorator to indicate that the method calls should be logged
 * To be used in conjunction with LogClass
 * @see LogClass
 * @constructor
 */
export function LogAsyncMethod<TMetadata>(metadata: TMetadata): MethodDecorator {
    return LogAsyncMethodForSymbol(metadata, SubMethods);
}

export function LogAsyncMethodForSymbol<TMetadata>(metadata: TMetadata, methodsSymbol: symbol): MethodDecorator {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars
    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        target[methodsSymbol] = target[methodsSymbol] || new Map<string, MethodMetadata<TMetadata>>();
        // Add some information that class decorator will use
        (target[methodsSymbol] as Map<string, MethodMetadata<TMetadata>>).set(propertyKey.toString(), {
            metadata,
            isAsync: true,
        });
    };
}

/**
 * Class decorator to allow some methods to be logged
 * To be used in conjunction with LogSyncMethod or LogAsyncMethod
 * @see LogSyncMethod
 * @see LogAsyncMethod
 * @param className
 * @param logOptions
 * @constructor
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function LogClass<TLogger, TMetadata>(className: string, logOptions: LogOptions<TLogger, TMetadata>) {
    return LogClassForSymbol(className, logOptions, SubMethods);
}

export function LogClassForSymbol<TLogger, TMetadata>(className: string, logOptions: LogOptions<TLogger, TMetadata>, methodsSymbol: symbol) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function <T extends { new(...args: any[]): { readonly logger: TLogger } }>(Base: T): any {
        return class extends Base {
            constructor(...args: any[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
                super(...args);
                console.log("Object prototype", className, methodsSymbol, Base.prototype);
                const subMethods: Map<string, MethodMetadata<TMetadata>> = Base.prototype[methodsSymbol];
                console.log("Object prototype", Base.prototype);
                if (subMethods) {
                    const logger = this.logger;

                    subMethods.forEach((metadata: MethodMetadata<TMetadata>, method: string) => {
                        //if (!(metadata instanceof TMetadata))
                        //  return;

                        const descriptor = Object.getOwnPropertyDescriptor(Base.prototype, method);
                        if (!descriptor)
                            return;

                        const methodDescriptor: MethodDescriptor<TMetadata> = {
                            ...metadata,
                            className: className,
                            methodName: method,
                        };

                        const originalMethod = descriptor.value;
                        if (metadata.isAsync) {
                            descriptor.value = async function (...args: unknown[]) {
                                return trackAsyncStep(originalMethod.apply(this, args), logger, logOptions, methodDescriptor);
                            };
                        }
                        else {
                            descriptor.value = function (...args: unknown[]) {
                                return trackSyncStep(() => originalMethod.apply(this, args), logger, logOptions, methodDescriptor);
                            };
                        }

                        // Wrap the original method with our step tracker
                        Object.defineProperty(Base.prototype, method, descriptor);
                    });
                }
            }
        };
    };
}

function trackSyncStep<TResult, TLogger, TMetadata>(step: () => TResult, logger: TLogger,
                                                    logOptions: LogOptions<TLogger, TMetadata>, methodDescriptor: MethodDescriptor<TMetadata>): TResult {

    logOptions.onMethodStart(logger, methodDescriptor);

    const start = performance.now();
    const startDate = new Date();

    const result = step();

    const end = performance.now();
    const executionTimeMs = Math.floor(end - start);

    const executionTimeResult: ExecutionTimeResult<TResult> = {
        value: result,
        start: startDate,
        end: new Date(),
        executionTimeMs,
    };
    logOptions.onMethodEnd(logger, methodDescriptor, executionTimeResult);

    return result;
}

async function trackAsyncStep<TResult, TLogger, TMetadata>(step: Promise<TResult>, logger: TLogger,
                                                           logOptions: LogOptions<TLogger, TMetadata>, methodDescriptor: MethodDescriptor<TMetadata>): Promise<TResult> {

    logOptions.onMethodStart(logger, methodDescriptor);

    const start = performance.now();
    const startDate = new Date();

    const result = await step;

    const end = performance.now();
    const executionTimeMs = Math.floor(end - start);

    const executionTimeResult: ExecutionTimeResult<TResult> = {
        value: result,
        start: startDate,
        end: new Date(),
        executionTimeMs,
    };
    logOptions.onMethodEnd(logger, methodDescriptor, executionTimeResult);

    return result;
}
