# node-setup

Connected Cars JavaScript/TypeScript development setup

## Use

``` bash
npm install --save-dev https://github.com/connectedcars/node-setup
```

### Automatic

Don't overwrite existing files:

``` bash
./node_modules/.bin/setup init
```

Overwrite and remove old configurations:

``` bash
./node_modules/.bin/setup init-force
```

### Manual

Extend existing configurations from node_modules/setup:

* [Babel](./template/.babelrc)
* [ESlint](./template/.eslintrc)
* [Jest](./template/jest.config.js)
* [TypeScript](./template/tsconfig.json)

And manually install needed dependencies:

* [package.json](./template/package.json)

## VSCode

launch.json:

``` json5
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "name": "vscode-jest-tests",
      "request": "launch",
      "args": [
        "--runInBand",
        "--coverage=false"
      ],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "program": "${workspaceFolder}/node_modules/jest/bin/jest"
    },
    {
      "name": "setup init",
      "type": "node",
      "request": "launch",
      "protocol": "inspector",
      "cwd": "${workspaceRoot}",
      "preLaunchTask": "npm: build:bin:js",
      "outFiles": [
        "${workspaceRoot}/build/dist/**/**.js"
      ],
      "program": "${workspaceFolder}/bin/setup.ts",
      "sourceMaps": true,
      "args": [
        "init"
      ],
      "env": {
        "TEMPLATES_PATH": "${workspaceFolder}/templates"
      },
      "internalConsoleOptions": "openOnSessionStart"
    }
  ]
}
```

settings.json:

``` json5
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "eslint.enable": true,
  "eslint.autoFixOnSave": true,
  "eslint.validate": [
    {
      "language": "javascript",
      "autoFix": true
    },
    {
      "language": "typescript",
      "autoFix": true
    }
  ],
  "tslint.enable": false,
  "files.autoSave": "off",
  "files.exclude": {
    "**/.git": true,
    "**/.DS_Store": true,
    "build": true
  },
  "jest.showCoverageOnLoad": true,
  "jest.autoEnable": false,
  "jest.runAllTestsFirst": false,
  "jest.enableCodeLens": true,
  "git.ignoreLimitWarning": true
}
```

tasks.json:

``` json5
{
    // See https://go.microsoft.com/fwlink/?LinkId=733558
    // for the documentation about the tasks.json format
    "version": "2.0.0",
    "tasks": [
        {
            "type": "npm",
            "script": "build:bin:js",
            "group": "build",
            "problemMatcher": []
        }
    ]
}
```
