const RuntimeConfig = require('./runtime-config');

module.exports = function (argv) {
	updateRefs = argv.includes('--update-refs');
	RuntimeConfig.getInstance().extend({ updateRefs });
};
