export default {
  extensions: {
    js: true,
    ts: 'module'
  },
  files: [ 'test/**/*' ],
  nodeArguments: [
    '--import=tsimp/import'
  ]
};
