# node-setup

Connected Cars JavaScript/TypeScript development setup

## Use

``` bash
npm install --save-dev @connectedcars/setup
```

### Automatic

Initiate project
``` bash
./node_modules/.bin/setup init
```

Update dependencies
``` bash
./node_modules/.bin/setup update
```

#### Flags

```
-f, --force             Whether to override/remove existing configuration
-h, --help              Output usage information
-t, --template [value]  Which template to use (defaults to "node")
-v, --verbose           Whether to enable verbose logging
-V, --version           Output the version number
```

### Manual

Extend existing configurations from node_modules/setup:

* [Babel](./templates/node/.babelrc)
* [ESlint](./templates/node/.eslintrc)
* [Jest](./templates/node/jest.config.js)
* [TypeScript](./templates/node/tsconfig.json)

And manually install needed dependencies:

* [package.json](./template/package.json)

## VSCode

### Extensions

Required:
 * [EditorConfig](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)
 * [eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

Sugested:
 * [jest-runner](https://marketplace.visualstudio.com/items?itemName=firsttris.vscode-jest-runner)

### extensions.json
``` json5
{
  "recommendations": ["dbaeumer.vscode-eslint", "firsttris.vscode-jest-runner", "editorconfig.editorconfig"]
}
```

### launch.json

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
      "preLaunchTask": "npm: build:js",
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

### settings.json

``` json5
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "eslint.enable": true,
  "eslint.validate": [
    "javascript",
    "typescript"
  ],
  "files.autoSave": "off",
  "files.exclude": {
    "**/.git": true,
    "**/.DS_Store": true,
    "build": true
  },
  "git.ignoreLimitWarning": true,
  "[javascripts][javascriptreact][typescript][typescriptreact][json]": {
    "editor.formatOnSave": false,
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    }
  },
  "[json][jsonc]": {
    "editor.formatOnSave": true
  }
}
```

### tasks.json

``` json5
{
    // See https://go.microsoft.com/fwlink/?LinkId=733558
    // for the documentation about the tasks.json format
    "version": "2.0.0",
    "tasks": [
        {
            "type": "npm",
            "script": "build:js",
            "group": "build",
            "problemMatcher": []
        }
    ]
}
```
