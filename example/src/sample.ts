import { ConsoleLogger } from './logger';
import { MyClass } from './myClass';
import { MyAdvancedClass } from './myAdvancedClass';

async function runSample(): Promise<void> {
    const logger = new ConsoleLogger();

    logger.log("Running sample");
    const sampleObject = new MyClass(logger);
    sampleObject.myMethod();
    await sampleObject.myNetworkCall();

    logger.log("Running advanced sample");
    const advancedSampleObject = new MyAdvancedClass(logger);
    advancedSampleObject.myMethod();
    await advancedSampleObject.aWorkerOperation();
    await advancedSampleObject.myNetworkCall();
}

runSample()
    .then(() => {})
    .catch((e) => {
        console.error("Sample run errored", e);
    });
