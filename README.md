<h1 align="center" style="border-bottom: none;">log-method-decorator</h1>
<h3 align="center">Easily log method calls in Typescript without boilerplate</h3>
<p align="center">
  <a href="https://travis-ci.com/dizco/react-scrollable-feed">
    <img alt="Build Status" src="https://travis-ci.com/dizco/react-scrollable-feed.svg?branch=master">
  </a>
  <a href="https://www.npmjs.com/package/log-method-decorator">
    <img alt="NPM latest version" src="https://img.shields.io/npm/v/log-method-decorator/latest.svg">
  </a>
  <a href="https://standardjs.com">
    <img alt="JavaScript Style Guide" src="https://img.shields.io/badge/code_style-standard-brightgreen.svg">
  </a>
  <a href="http://makeapullrequest.com">
    <img alt="PRs Welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square">
  </a>
</p>
<p align="center">
  <a href="https://david-dm.org/dizco/log-method-decorator">
    <img alt="dependencies Status" src="https://david-dm.org/dizco/log-method-decorator/status.svg">
  </a>
  <a href="https://david-dm.org/dizco/log-method-decorator?type=peer">
    <img alt="peerDependencies Status" src="https://david-dm.org/dizco/log-method-decorator/peer-status.svg">
  </a>
  <a href="https://david-dm.org/dizco/log-method-decorator?type=dev">
    <img alt="devDependencies Status" src="https://david-dm.org/dizco/log-method-decorator/dev-status.svg">
  </a>
</p>

Logging all method calls can add a lot of boilerplate inside your methods. This clutters your actual code and reduces code readability. Here comes **log-method-decorator**! By leveraging the _experimental feature_ of [typescript decorators](https://www.typescriptlang.org/docs/handbook/decorators.html), we can log all function calls with a reusable one-liner :)

## Install

```bash
npm install --save log-method-decorator
```

## Usage

```ts
interface Logger {
    log(message: string): void;
}

interface Metadata {}

const logOptions: LogOptions<Logger, Metadata> = {
    onMethodStart: ((logger, method) => {
        logger.log(`[${method.className}.${method.methodName}] was invoked`);
    }),
    onMethodEnd: ((logger, method, executionTimeResult) => {
        logger.log(`[${method.className}.${method.methodName}] completed in ${executionTimeResult.executionTimeMs}ms`);
    }),
}

@LogClass<Logger, Metadata>(MyClass.name, logOptions)
class MyClass {
    constructor(public readonly logger: Logger) {}

    @LogSyncMethod<Metadata>({})
    public myMethod(): void {
        // Do something
    }

    @LogAsyncMethod<Metadata>({})
    public async myNetworkCall(): Promise<void> {
        // Do something
    }
}
```

**Note:** You are responsible to make sure that the `Metadata` typing is compatible between the class decorator and the method decorator. This package does not yet support this.

## FAQ

### How do I log all method calls?
Easy! Add the decorators on all the methods that you want to be logged :)

### Why do we actually need the class decorator? Isn't the method decorator enough?
We need the class decorator in order to have the class name available and to be able to type check the logger instance. Simple method decorators don't have access to the class scope. _log-method-decorator_ uses a logger from the class scope, rather than having to create a new logger.

## For more details

For more details on how to integrate _log-method-decorator_ in your application, have a look at the [example](example) folder.

## Contibuting
- Star this GitHub repo :star: (it really helps)
- Create pull requests, submit bugs, suggest new features or documentation updates :wrench:. See [contributing doc](CONTRIBUTING.md).

## License

MIT © [Gabriel Bourgault](https://github.com/dizco)
