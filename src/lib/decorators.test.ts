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

    @LogSyncMethod<MethodMetadata>({ normalDurationMs: normalMethodDurationMs })
    public decoratedSyncMethod(delay: () => void, arg: number): number {
        delay();
        return arg;
    }

    @LogSyncMethod<{ potato: string }>({ potato: "" })
    public decoratedSyncMethodWithBadMetadata(arg: number): number {
        return arg;
    }

    @LogAsyncMethod<MethodMetadata>({ normalDurationMs: normalMethodDurationMs })
    public async decoratedAsyncMethod(delay: Promise<void>, arg: number): Promise<number> {
        await delay;
        return arg;
    }
}

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

        test("withWrongMetadataType_doesntLog", () => {
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
});
