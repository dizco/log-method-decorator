## Development

### Running

Local development is broken into two parts (ideally using two tabs).

First, run the compiler to watch the `src/` module and automatically recompile it into `dist/` whenever you make changes.

```bash
npm run build -- --watch
```

The second part will be running the `example/` that's linked to the local version of the module.

```bash
# (in another tab)
cd example
npm run build
npm run sample
```

### Linting

```bash
npm run lint
```

### Testing :heart_eyes:

```bash
npm run test
```

### Publishing to npm (admins only) :rocket:

```bash
npm publish
```

This builds the module to `dist/` and then publishes to `npm`.

Make sure that any npm modules you want as peer dependencies are properly marked as `peerDependencies` in `package.json`. The rollup config will automatically recognize them as peers and not try to bundle them in your module.
