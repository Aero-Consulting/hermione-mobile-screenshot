const fs = require('fs-extra');

const { Image, temp, ScreenShooter } = require('gemini-core');

const { getCaptureProcessors } = require('./capture-processors');
const { getTestContext } = require('../utils/mocha');
const RuntimeConfig = require('../utils/runtime-config');
const AssertViewResults = require('./assert-view-results');
const BaseStateError = require('./errors/base-state-error');
const AssertViewError = require('./errors/assert-view-error');
const WrongPlatformError = require('./errors/wrong-platform-error');

module.exports = async (browser) => {
	const platformName = browser?.capabilities?.platformName;
	const browserName = browser?.capabilities?.browserName;
	const isMobile =
		(platformName === 'iOS' && !browserName) ||
		(platformName === 'Android' && !browserName);

	let screenShooter;
	if (!isMobile) {
		screenShooter = ScreenShooter.create(browser);
	}

	const { publicAPI: session, config } = browser;
	const {
		assertViewOpts,
		compareOpts,
		compositeImage,
		screenshotDelay,
		tolerance,
		antialiasingTolerance,
	} = config;

	const { handleNoRefImage, handleImageDiff } = getCaptureProcessors();

	return session.addCommand(
		'assertMobileView',
		async (state, selectors, opts = {}) => {
			opts = {
				...assertViewOpts,
				...opts,
				compositeImage,
				screenshotDelay,
				tolerance,
				antialiasingTolerance,
			};

			const { hermioneCtx } = session.executionContext;
			hermioneCtx.assertViewResults =
				hermioneCtx.assertViewResults || new AssertViewResults();

			if (hermioneCtx.assertViewResults.hasState(state)) {
				return Promise.reject(
					new AssertViewError(`duplicate name for "${state}" state`)
				);
			}

			const handleCaptureProcessorError = (e) => {
				if (e instanceof BaseStateError) {
					hermioneCtx.assertViewResults.add(e);
				} else {
					Promise.reject(e);
				}
			};

			let page;
			if (!isMobile) {
				page = await browser.prepareScreenshot([].concat(selectors), {
					ignoreSelectors: [].concat(opts.ignoreElements),
					allowViewportOverflow: opts.allowViewportOverflow,
					captureElementFromTop: opts.captureElementFromTop,
					selectorToScroll: opts.selectorToScroll,
				});
			}

			temp.init(config.system.tempDir);
			RuntimeConfig.getInstance().extend({ tempOpts: temp.serialize() });

			const { tempOpts } = RuntimeConfig.getInstance();
			temp.attach(tempOpts);

			let currImgInst;

			if (isMobile) {
				const element = await session.$(selectors);
				const elementScreenshot = await session.takeElementScreenshot(
					element.elementId
				);

				const elementScreenshotBase64Buffer = Buffer.from(
					elementScreenshot,
					'base64'
				);

				currImgInst = new Image(elementScreenshotBase64Buffer);
			} else {
				const {
					allowViewportOverflow,
					compositeImage,
					screenshotDelay,
					selectorToScroll,
				} = opts;

				const screenshoterOpts = {
					allowViewportOverflow,
					compositeImage,
					screenshotDelay,
					selectorToScroll,
				};

				currImgInst = await screenShooter.capture(page, screenshoterOpts);
			}

			const currImg = {
				path: temp.path(Object.assign(tempOpts, { suffix: '.png' })),
				size: currImgInst.getSize(),
			};

			await currImgInst.save(currImg.path);

			const test = getTestContext(session.executionContext);
			const refImg = {
				path: config.getScreenshotPath(test, state),
				size: null,
			};

			const { emitter } = browser;

			if (!fs.existsSync(refImg.path)) {
				return handleNoRefImage(currImg, refImg, state, { emitter }).catch(
					(e) => handleCaptureProcessorError(e)
				);
			}

			let caretRatioOptions;
			if (isMobile) {
				caretRatioOptions = { canHaveCaret: true };
			} else {
				caretRatioOptions = {
					canHaveCaret: page.canHaveCaret,
					pixelRatio: page.pixelRatio,
				};
			}

			const imageCompareOpts = {
				tolerance: opts.tolerance,
				antialiasingTolerance: opts.antialiasingTolerance,
				...caretRatioOptions,
				compareOpts,
			};

			const {
				equal,
				diffBounds,
				diffClusters,
				metaInfo = {},
			} = await Image.compare(refImg.path, currImg.path, imageCompareOpts);

			Object.assign(refImg, metaInfo.refImg);

			if (!equal) {
				const diffAreas = { diffBounds, diffClusters };
				const { tolerance, antialiasingTolerance } = opts;
				const imageDiffOpts = {
					tolerance,
					antialiasingTolerance,
					...caretRatioOptions,
					diffAreas,
					config,
					emitter,
				};

				if (isMobile) {
					imageDiffOpts.push({ path: emitter });
				}

				return handleImageDiff(currImg, refImg, state, imageDiffOpts).catch(
					(e) => handleCaptureProcessorError(e)
				);
			}

			hermioneCtx.assertViewResults.add({ stateName: state, refImg: refImg });
		}
	);
};
