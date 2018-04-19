// @ts-check
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const { existsP, renameP, binPath, getNodeModulesPath } = require('./common.js');

const version = '0.8.1';

getNodeModulesPath().then(nodeModulesPath => {
    if (!nodeModulesPath) {
        throw new Error('node_modules does not exist, postinstall should not be running');
    }

    return existsP(binPath).then(binExists => {
        if (binExists) {
            console.log('bin/ folder already exists');
        } else {
            return downloadAll();
        }
    }).then(() => {
        return cleanup(nodeModulesPath);
    })
}).catch(err => {
    console.error(`Downloading ripgrep failed: ${err.toString()}`);
    process.exit(1);
});

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

function downloadAll() {
    const download = require('./download');

    const opts = {
        version,
        token: process.env['GITHUB_TOKEN']
    };

    const buildsToDownload = [
        {
            platform: 'darwin',
            arch: 'x64'
        },
        {
            platform: 'win32',
            arch: 'ia32'
        },
        {
            platform: 'win32',
            arch: 'x64'
        },
        {
            platform: 'linux',
            arch: 'ia32'
        },
        {
            platform: 'linux',
            arch: 'x64'
        }
    ]

    return Promise.all(buildsToDownload.map(buildOpts => {
        return download({
            ...opts,
            ...buildOpts
        });
    }));
}
