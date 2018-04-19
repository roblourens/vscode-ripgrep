'use strict';

const path = require('path');
const os = require('os');

const platform = os.platform();
const arch = process.env.npm_config_arch || os.arch();
const binFolderName = path.join('../bin', `${platform}-${arch}`);
const binName = `/rg${process.platform === 'win32' ? '.exe' : ''}`;

module.exports.rgPath = path.join(__dirname, binFolderName, binName);