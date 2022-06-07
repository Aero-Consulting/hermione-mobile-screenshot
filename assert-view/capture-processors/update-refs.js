const fs = require('fs-extra');

exports.handleNoRefImage = exports.handleImageDiff = async (
	currImg,
	refImg,
	state,
	{ emitter },
	hermioneCtx
) => {
	await fs.copy(currImg.path, refImg.path);

	hermioneCtx.assertViewResults.add({ stateName: state, refImg: refImg });
	emitter.emit('updateReference', { state, refImg });
};
