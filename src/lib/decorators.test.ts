import { LogClass, LogAsyncMethod, LogSyncMethod, LogOptions } from "./decorators";

const normalMethodDurationMs = 50;

interface MethodMetadata {
    normalDurationMs: number;
}

interface Logger {
    log: (message: string) => void;
}

const logOptions: LogOptions<Logger, MethodMetadata> = {
    onMethodStart: ((logger, method) => {
        logger.log(`[${method.className}.${method.methodName}] was invoked`);
    }),
    onMethodEnd: ((logger, method, executionTimeResult) => {
        logger.log(`[${method.className}.${method.methodName}] completed in ${executionTimeResult.executionTimeMs}ms`);
    }),
};
@LogClass<Logger, MethodMetadata>(DecoratedDummy.name, logOptions)
class DecoratedDummy {
    constructor(public readonly logger: Logger) { }

    public normalMethod(arg: number): number {
        return arg;
    }

    public callSyncPrivateMethod(delay: () => void, arg: number): number {
        return this.decoratedSyncPrivateMethod(delay, arg);
    }

    @LogSyncMethod<MethodMetadata>({ normalDurationMs: normalMethodDurationMs })
    private decoratedSyncPrivateMethod(delay: () => void, arg: number): number {
        delay();
        return arg;
    }

    @LogSyncMethod<MethodMetadata>({ normalDurationMs: normalMethodDurationMs })
    public decoratedSyncMethod(delay: () => void, arg: number): number {
        delay();
        return arg;
    }

    @LogSyncMethod<{ potato: string }>({ potato: "" })
    public decoratedSyncMethodWithBadMetadata(arg: number): number {
        return arg;
    }

    public callAsyncPrivateMethod(delay: Promise<void>, arg: number): Promise<number> {
        return this.decoratedAsyncPrivateMethod(delay, arg);
    }

    @LogAsyncMethod<MethodMetadata>({ normalDurationMs: normalMethodDurationMs })
    private async decoratedAsyncPrivateMethod(delay: Promise<void>, arg: number): Promise<number> {
        await delay;
        return arg;
    }

    @LogAsyncMethod<MethodMetadata>({ normalDurationMs: normalMethodDurationMs })
    public async decoratedAsyncMethod(delay: Promise<void>, arg: number): Promise<number> {
        await delay;
        return arg;
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BasicClassDecorator<T extends { new (...args: any[]): { myValue: string } }>(constructor: T) {
    return class extends constructor {
        myValue = "my value has been overridden by the class decorator";
    };
}
function BasicMethodDecorator() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args: unknown[]) {
            console.log(`Method ${propertyKey} called!`);
            return originalMethod.apply(this, args);
        };
    };
}

@BasicClassDecorator
@LogClass<Logger, MethodMetadata>(MultipleDecoratorsDummy.name, logOptions)
class MultipleDecoratorsDummy {
    public myValue = "i am the default value";
    constructor(public readonly logger: Logger) { }

    @BasicMethodDecorator()
    @LogSyncMethod<MethodMetadata>({ normalDurationMs: normalMethodDurationMs })
    public myMethod(): void {
        //
    }
}

// TODO: Add tests with other method and class decorators

describe("decorators", () => {
    const timeouts: NodeJS.Timeout[] = [];
    let logger: Logger;

    beforeEach(() => {
        logger = {
            log: jest.fn()
        }
    });

    afterEach(() => {
        timeouts.forEach((timeout) => clearTimeout(timeout));
    });

    describe("notDecoratedMethod", () => {
        test("doesntAlterResult", () => {
            // Arrange
            const dummy = new DecoratedDummy(logger);

            const expectedResult = 3;

            // Act
            const result = dummy.normalMethod(expectedResult);

            // Assert
            expect(result).toBe(expectedResult);
        });

        test("doesntLog", () => {
            // Arrange
            const loggerSpy = jest.spyOn(logger, "log");
            const dummy = new DecoratedDummy(logger);

            // Act
            dummy.normalMethod(3);

            // Assert
            expect(loggerSpy).not.toHaveBeenCalled();
        });
    });

    describe(LogSyncMethod.name, () => {
        test("doesntAlterResult", () => {
            // Arrange
            const dummy = new DecoratedDummy(logger);

            const expectedResult = 3;

            // Act
            const result = dummy.decoratedSyncMethod(() => null, expectedResult);

            // Assert
            expect(result).toBe(expectedResult);
        });

        test("logsExecutionTime", () => {
            // Arrange
            const loggerSpy = jest.spyOn(logger, "log");
            const dummy = new DecoratedDummy(logger);

            // Act
            dummy.decoratedSyncMethod(() => null, 3);

            // Assert
            expect(loggerSpy).toHaveBeenNthCalledWith(1, "[DecoratedDummy.decoratedSyncMethod] was invoked");
            expect(loggerSpy).toHaveBeenNthCalledWith(2, "[DecoratedDummy.decoratedSyncMethod] completed in 0ms");
        });

        test("worksOnPrivateMethods", () => {
            // Arrange
            const loggerSpy = jest.spyOn(logger, "log");
            const dummy = new DecoratedDummy(logger);

            // Act
            dummy.callSyncPrivateMethod(() => null, 3);

            // Assert
            expect(loggerSpy).toHaveBeenNthCalledWith(1, "[DecoratedDummy.decoratedSyncPrivateMethod] was invoked");
            expect(loggerSpy).toHaveBeenNthCalledWith(2, "[DecoratedDummy.decoratedSyncPrivateMethod] completed in 0ms");
        });

        test("withLongOperation_logsAppropriateDuration", async () => {
            // Arrange
            const loggerSpy = jest.spyOn(logger, "log");
            const dummy = new DecoratedDummy(logger);

            const syncDelay = (delayMs: number) => {
                // See https://stackoverflow.com/a/63595313/6316091
                const sleep = (milliseconds: number) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
                return () => sleep(delayMs);
            };

            // Act
            dummy.decoratedSyncMethod(syncDelay(100), 3);

            // Assert
            expect(loggerSpy).toHaveBeenNthCalledWith(1, "[DecoratedDummy.decoratedSyncMethod] was invoked");
            const abnormalLogMatch = "\\[DecoratedDummy\\.decoratedSyncMethod\\] completed in ([1-9][0-9]+)ms"; // Any number of ms 10 or above
            expect(loggerSpy).toHaveBeenNthCalledWith(2, expect.stringMatching(abnormalLogMatch));
        });

        // TODO: This is not implemented yet
        test.skip("withWrongMetadataType_doesntLog", () => {
            // Arrange
            const loggerSpy = jest.spyOn(logger, "log");
            const dummy = new DecoratedDummy(logger);

            // Act
            dummy.decoratedSyncMethodWithBadMetadata(3);

            // Assert
            expect(loggerSpy).not.toHaveBeenCalled();
        });
    });

    describe(LogAsyncMethod.name, () => {
        test("doesntAlterResult", async () => {
            // Arrange
            const dummy = new DecoratedDummy(logger);

            const promise = new Promise<void>((resolve) => {
                resolve();
            });

            const expectedResult = 3;

            // Act
            const result = await dummy.decoratedAsyncMethod(promise, expectedResult);

            // Assert
            expect(result).toBe(expectedResult);
        });

        test("logsExecutionTime", async () => {
            // Arrange
            const loggerSpy = jest.spyOn(logger, "log");
            const dummy = new DecoratedDummy(logger);

            const promise = new Promise<void>((resolve) => {
                resolve();
            });

            // Act
            await dummy.decoratedAsyncMethod(promise, 3);

            // Assert
            expect(loggerSpy).toHaveBeenNthCalledWith(1, "[DecoratedDummy.decoratedAsyncMethod] was invoked");
            const logMatch = "\\[DecoratedDummy\\.decoratedAsyncMethod\\] completed in ([0-9])ms"; // Any number of ms between 0 and 9
            expect(loggerSpy).toHaveBeenNthCalledWith(2, expect.stringMatching(logMatch));
        });


        test("worksOnPrivateMethods", async () => {
            // Arrange
            const loggerSpy = jest.spyOn(logger, "log");
            const dummy = new DecoratedDummy(logger);

            const promise = new Promise<void>((resolve) => {
                resolve();
            });

            // Act
            await dummy.callAsyncPrivateMethod(promise, 3);

            // Assert
            expect(loggerSpy).toHaveBeenNthCalledWith(1, "[DecoratedDummy.decoratedAsyncPrivateMethod] was invoked");
            const logMatch = "\\[DecoratedDummy\\.decoratedAsyncPrivateMethod\\] completed in ([0-9])ms"; // Any number of ms between 0 and 9
            expect(loggerSpy).toHaveBeenNthCalledWith(2, expect.stringMatching(logMatch));
        });

        test("withLongOperation_logsAppropriateDuration", async () => {
            // Arrange
            const loggerSpy = jest.spyOn(logger, "log");
            const dummy = new DecoratedDummy(logger);

            const promise = new Promise<void>((resolve) => {
                const timeout = setTimeout(() => resolve(), 100);
                timeouts.push(timeout);
            });

            // Act
            await dummy.decoratedAsyncMethod(promise, 3);

            // Assert
            expect(loggerSpy).toHaveBeenNthCalledWith(1, "[DecoratedDummy.decoratedAsyncMethod] was invoked");
            const abnormalLogMatch = "\\[DecoratedDummy\\.decoratedAsyncMethod\\] completed in ([1-9][0-9]+)ms"; // Any number of ms 10 or above
            expect(loggerSpy).toHaveBeenNthCalledWith(2, expect.stringMatching(abnormalLogMatch));
        });
    });

    describe("multipleDecorators", () => {
        test("doesntInterfere", () => {
            // Arrange
            const consoleSpy = jest.spyOn(console, "log");
            const dummy = new MultipleDecoratorsDummy(logger);

            // Act
            dummy.myMethod();

            // Assert
            expect(dummy.myValue).toBe("my value has been overridden by the class decorator");
            expect(consoleSpy).toHaveBeenNthCalledWith(1, "Method myMethod called!");
        });

        test("logs", () => {
            // Arrange
            const loggerSpy = jest.spyOn(logger, "log");
            const dummy = new MultipleDecoratorsDummy(logger);

            // Act
            dummy.myMethod();

            // Assert
            expect(loggerSpy).toHaveBeenNthCalledWith(1, "[MultipleDecoratorsDummy.myMethod] was invoked");
            const logMatch = "\\[MultipleDecoratorsDummy\\.myMethod\\] completed in ([0-9])ms"; // Any number of ms between 0 and 9
            expect(loggerSpy).toHaveBeenNthCalledWith(2, expect.stringMatching(logMatch));
        });
    });
});
