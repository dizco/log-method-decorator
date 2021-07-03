import { LogAsyncMethod, LogClass, LogSyncMethod } from 'log-method-decorator';
import { Logger } from './logger';
import { Metadata, LoggingOptions } from './loggingOptions';

function syncDelay(delayMs: number) {
    const start = Date.now();
    let now = start;
    while (now - start < delayMs) {
        now = Date.now();
    }
}

@LogClass<Logger, Metadata>(MyClass.name, LoggingOptions.SimpleLog)
export class MyClass {
    constructor(public readonly logger: Logger) {}

    @LogSyncMethod<Metadata>({})
    public myMethod(): void {
        // Do some random stuff
        syncDelay(50);
    }

    @LogAsyncMethod<Metadata>({})
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
}
