const { Image, temp } = require('gemini-core');
const RuntimeConfig = require('../../utils/runtime-config');

const ImageDiffError = require('../errors/image-diff-error');
const NoRefImageError = require('../errors/no-ref-image-error');

exports.handleNoRefImage = (currImg, refImg, state) => {
	return Promise.reject(NoRefImageError.create(state, currImg, refImg));
};

exports.handleImageDiff = async (currImg, refImg, state, opts) => {
	const {
		tolerance,
		antialiasingTolerance,
		canHaveCaret,
		diffAreas,
		config,
	} = opts;

	const {
		buildDiffOpts,
		system: { diffColor },
	} = config;

	buildDiffOpts.ignoreCaret = buildDiffOpts.ignoreCaret && canHaveCaret;

	const diffOpts = {
		current: currImg.path,
		reference: refImg.path,
		diffColor,
		tolerance,
		antialiasingTolerance,
		...buildDiffOpts,
	};

	return Promise.reject(
		ImageDiffError.create(state, currImg, refImg, diffOpts, diffAreas)
	);
};
