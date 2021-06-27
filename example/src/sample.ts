import { ConsoleLogger } from './logger';
import { MyClass } from './myClass';

async function runSample(): Promise<void> {
    const sampleObject = new MyClass(new ConsoleLogger());
    sampleObject.myMethod();
    await sampleObject.myNetworkCall();
}

runSample()
    .then(() => {})
    .catch((e) => {
        console.error("Sample run errored", e);
    });
