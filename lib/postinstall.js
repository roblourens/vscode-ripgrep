// @ts-check
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const octokit = require('@octokit/rest')();
const decompress = require('decompress');
const decompressUnzip = require('decompress-unzip');
const { exec } = require('child_process');

const { existsP, binPath, getNodeModulesPath } = require('./common.js');

const version = '0.10.0';

getNodeModulesPath().then(nodeModulesPath => {
    if (!nodeModulesPath) {
        throw new Error('node_modules does not exist, postinstall should not be running');
    }

    return existsP(binPath)
    .then(binExists => {
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
    }).then(()=>{
        console.log("download and unzip ok");
        return prepare_source_code();
})
.catch((err) => {
    console.error(`Downloading ripgrep failed: ${err.toString()}`);
    process.exit(1);
});

function prepare_source_code(downloadDest) {
    var opts = {
        owner : 'roblourens', 
        repo : 'ripgrep', 
        archive_format : 'zipball', 
        ref : 'master'
    };

    const zipfile = 'ripgrep.zip';
    const destdir = 'ripgrep-dist';    
    return new Promise ((resolve, reject) => {
        const rg = path.join('bin', 'rg');
        if(fs.existsSync(rg) == true) {
            var errmsg = 'file ' + rg + ' exiists.';
            reject(errmsg);            
        }
    }).then( () => {
        if(fs.existsSync(destdir) == true) {
            const rimraf = require('rimraf');
            return rimrafP(rimraf, destdir);
        }
    }).then( () => {
        if(fs.existsSync(zipfile) == true) {
            const rimraf = require('rimraf');
            return rimrafP(rimraf, zipfile);
        }
    }).then(() => {
        return new Promise((resolve, reject) => {
            octokit.repos.getArchiveLink(opts,
                (err, result) => {
                    if(err) reject();
                    fs.writeFile(zipfile, result.data, (err) => {
                        if(err) reject();    
                        resolve(result)            
                    });
                }
            );
        })
    }).then((result) => {
        return decompress(result.data, destdir, {
            plugins: [
                decompressUnzip()
            ]
        })
    }).then((files) => {
        console.log('Files decompressed');
        var coderoot = files[0].path;
        var code_path = path.join(destdir, coderoot);
        return build_source_code(code_path);
    }).then((code_path) => {
        // copy artifacts
        return new Promise((resolve, reject) => {
            const binPath = 'bin';
            if(fs.existsSync(binPath) == false) {
                fs.mkdirSync(binPath);
                const binfile = path.join(code_path, 'target', 'release', 'rg');
                fs.copyFileSync(binfile, binPath);
                resolve();
            }else{
                reject();
            }            
        });     
    });
}

function build_source_code(code_path) {
    const cwd = process.cwd();
    return new Promise((resolve, reject) => {
        process.chdir(code_path);
        exec('cargo build --release', (error, stdout, stderr) => {
            if(error) reject();
            if(stderr) reject();
            resolve(code_path)        
        })
    });
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
