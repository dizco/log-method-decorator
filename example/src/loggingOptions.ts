import { LogOptions } from '../../dist';
import { Logger } from './logger';

export interface Metadata {}

export interface NormalExecutionMetadata {
    normalExecutionTimeMs: number;
}

export abstract class LoggingOptions {
    public static readonly SimpleLog: LogOptions<Logger, Metadata> = {
        onMethodStart: ((logger, method) => {
            logger.log(`[${method.className}.${method.methodName}] was invoked`);
        }),
        onMethodEnd: ((logger, method, executionTimeResult) => {
            logger.log(`[${method.className}.${method.methodName}] completed in ${executionTimeResult.executionTimeMs}ms`);
        }),
    }

    public static readonly AbnormalExecutionTimeLog: LogOptions<Logger, NormalExecutionMetadata> = {
        onMethodStart: ((logger, method) => {}),
        onMethodEnd: ((logger, method, executionTimeResult) => {
            if (executionTimeResult.executionTimeMs > method.metadata.normalExecutionTimeMs) {
                logger.log(`WARNING: [${method.className}.${method.methodName}] completed in ${executionTimeResult.executionTimeMs}ms, which exceeds normal execution time of ${method.metadata.normalExecutionTimeMs}ms`);
            }
            logger.log(`[${method.className}.${method.methodName}] completed in ${executionTimeResult.executionTimeMs}ms`);
        }),
    }

    public static readonly InvokationLog: LogOptions<Logger, Metadata> = {
        onMethodStart: ((logger, method) => {
            logger.log(`[${method.className}.${method.methodName}] was invoked`);
        }),
        onMethodEnd: ((logger, method, executionTimeResult) => {}),
    }
}
