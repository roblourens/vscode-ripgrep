// @ts-check
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('request');

const { existsP, binPath, getNodeModulesPath } = require('./common.js');

const version = '0.10.0';

getNodeModulesPath().then(nodeModulesPath => {
    if (!nodeModulesPath) {
        throw new Error('node_modules does not exist, postinstall should not be running');
    }

    return existsP(binPath).then(binExists => {
        if (binExists) {
            console.log('bin/ folder already exists');
        } else {
            const download = require('./download');

            const opts = {
                platform: os.platform(),
                version,
                token: process.env['GITHUB_TOKEN']
            };

            switch (opts.platform) {
                case 'darwin':
                    opts.arch = 'x64';
                    break;
                case 'win32':
		    opts.arch = process.env.npm_config_arch || os.arch();
                    break;
                case 'linux':
                    opts.arch = process.env.npm_config_arch || os.arch();
                    break;
                default: throw new Error('Unknown platform: ' + opts.platform);
            }

            return download(opts);
        }
    }).then(() => {
        return cleanup(nodeModulesPath);
    })
}).then(undefined,
(err) => {
   console.log(`${err.toString()} to download, try to build from source`);   
   return build_from_source();
})
.catch(err => {
    console.error(`Downloading ripgrep failed: ${err.toString()}`);
    process.exit(1);
});

function build_from_source() {
	return new Promise((resolve, reject) => {
		const url = 'https://github.com/christkv/node-git/archive/master.zip'


		resolve()
	})
}

function rimrafP(rimraf, path) {
    return new Promise(resolve => {
        rimraf(path, resolve);
    });
}

function cleanup(nodeModulesPath) {
    // Clean up node_modules but only the packed ones in lib/
    if (__dirname === path.dirname(nodeModulesPath)) {
        const rimraf = require('rimraf');
        return rimrafP(rimraf, nodeModulesPath);
    } else {
        console.log('Not removing node_modules in parent folder')
    }
}
