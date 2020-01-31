module.exports = {
    "parser": "babel-eslint",
    "parserOptions": {
        "allowImportExportEverywhere": true,
    },
    "env": {
        "es6":     true,
        "browser": true,
        "node":    true,
    },
    "extends": ["eslint:recommended"],
    "settings": {
    },
    "rules": {
        "max-len": [0, {code: 100}],
        "import/no-absolute-path": [0],
        "indent": ["error", 4],
        "switch-colon-spacing": [0],
        "no-invalid-this": [0],
        "new-cap": [0],
        "no-trailing-spaces": [2, {
            skipBlankLines: true
        }],
    },
    "overrides": [{
        files: "*.js",
    }]
};