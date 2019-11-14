module.exports = {
    "sourceMaps": true,
    "plugins": [],
    "presets": [
        [
            "@babel/preset-env",
            {
                "modules": "commonjs",
                "useBuiltIns": "usage",
                "corejs": 3
            }
        ],
        [ "@babel/preset-react" ]
    ]
}
