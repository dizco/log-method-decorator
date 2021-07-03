import { Logger } from './logger';
import { LoggingOptions } from './loggingOptions';
import { DecoratorFactory } from 'log-method-decorator';

const logMethodCalls = DecoratorFactory.createScope("MyAdvancedClass1", LoggingOptions.SimpleLog);
const logMethodExecutionTimes = DecoratorFactory.createScope("MyAdvancedClass2", LoggingOptions.AbnormalExecutionTimeLog);
const logMethodInvokations = DecoratorFactory.createScope("MyAdvancedClass3", LoggingOptions.InvokationLog);


@logMethodExecutionTimes.LogScope()
@logMethodCalls.LogScope()
//@logMethodInvokations.LogScope()
export class MyAdvancedClass {
    constructor(public readonly logger: Logger) {}

    @logMethodCalls.LogSync({})
    public myMethod(): void {
        this.myPrivateMethod();
    }

    @logMethodInvokations.LogAsync({})
    @logMethodExecutionTimes.LogAsync({ normalExecutionTimeMs: 100 })
    public aWorkerOperation(): Promise<void> {
        return Promise.resolve();
    }

    @logMethodExecutionTimes.LogAsync({ normalExecutionTimeMs: 100 })
    public async myNetworkCall(): Promise<void> {
        let timeout: NodeJS.Timeout | null = null;

        try {
            const promise = new Promise<void>((resolve) => {
                timeout = setTimeout(() => resolve(), 100);
            });

            await promise;
        }
        finally {
            if (timeout)
                clearTimeout(timeout);
        }
    }

    @logMethodInvokations.LogSync({})
    private myPrivateMethod(): void {
        // Do something
    }
}
