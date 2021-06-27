## Development

### Running

Local development is broken into two parts (ideally using two tabs).

First, run the compiler to watch your `src/` module and automatically recompile it into `dist/` whenever you make changes.

```bash
npm run build -- --watch
```

The second part will be running the `example/` that's linked to the local version of your module.

```bash
# (in another tab)
cd example
npm run build
npm run sample
```

### Linting

Not available yet.

### Testing :heart_eyes:

```bash
npm run test
```

### Publishing to npm :rocket:

```bash
npm publish
```

This builds `cjs` and `es` versions of your module to `dist/` and then publishes your module to `npm`.

Make sure that any npm modules you want as peer dependencies are properly marked as `peerDependencies` in `package.json`. The rollup config will automatically recognize them as peers and not try to bundle them in your module.
