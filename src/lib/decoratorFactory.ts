import { LogAsyncMethodForSymbol, LogClassForSymbol, LogOptions, LogSyncMethodForSymbol } from './decorators';

export abstract class DecoratorFactory {
    public static createScope<TLogger, TMetadata>(className: string, logOptions: LogOptions<TLogger, TMetadata>): DecoratorScope<TLogger, TMetadata> {
        return new DecoratorScope<TLogger, TMetadata>(className, logOptions);
    }
}

export class DecoratorScope<TLogger, TMetadata> {
    private readonly methodsSymbol: symbol;
    constructor(private readonly className: string,
                private readonly logOptions: LogOptions<TLogger, TMetadata>) {
        this.methodsSymbol = Symbol();
    }

    public LogScope = () => LogClassForSymbol<TLogger, TMetadata>(this.className, this.logOptions, this.methodsSymbol);

    public LogSync = (metadata: TMetadata): MethodDecorator => LogSyncMethodForSymbol<TMetadata>(metadata, this.methodsSymbol);

    public LogAsync = (metadata: TMetadata): MethodDecorator => LogAsyncMethodForSymbol<TMetadata>(metadata, this.methodsSymbol);
}
