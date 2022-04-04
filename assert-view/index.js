'use strict'

const fs = require('fs-extra')
const _ = require('lodash')
const sharp = require('sharp')

const { Image, temp } = require('gemini-core')

const { getCaptureProcessors } = require('./capture-processors')
const { getTestContext } = require('../utils/mocha')
const RuntimeConfig = require('../utils/runtime-config')
const AssertViewResults = require('./assert-view-results')
const BaseStateError = require('./errors/base-state-error')
const AssertViewError = require('./errors/assert-view-error')
const WrongPlatformError = require('./errors/wrong-platform-error')

module.exports = async browser => {
  const { publicAPI: session, config } = browser
  const {
    assertViewOpts,
    compareOpts,
    compositeImage,
    screenshotDelay,
    tolerance,
    antialiasingTolerance
  } = config

  const { handleNoRefImage, handleImageDiff } = getCaptureProcessors()

  return session.addCommand(
    'assertMobileView',
    async (state, selector, opts = {}) => {
      if (
        browser.capabilities.platformName != 'iOS' &&
        browser.capabilities.platformName != 'Android'
      ) {
        return Promise.reject(new WrongPlatformError())
      }

      opts = _.defaults(opts, assertViewOpts, {
        compositeImage,
        screenshotDelay,
        tolerance,
        antialiasingTolerance
      })

      const { hermioneCtx } = session.executionContext
      hermioneCtx.assertViewResults =
        hermioneCtx.assertViewResults || AssertViewResults.create()

      session.executionContext.assertMobileViewResults =
        hermioneCtx.assertMobileViewResults || AssertViewResults.create()

      if (hermioneCtx.assertViewResults.hasState(state)) {
        return Promise.reject(
          new AssertViewError(`duplicate name for "${state}" state`)
        )
      }

      const handleCaptureProcessorError = e => {
        if (e instanceof BaseStateError) {
          hermioneCtx.assertViewResults.add(e)
          hermioneCtx.assertMobileViewResults.add(e)
        } else {
          Promise.reject(e)
        }
      }

      temp.init(config.system.tempDir)
      RuntimeConfig.getInstance().extend({ tempOpts: temp.serialize() })

      const { tempOpts } = RuntimeConfig.getInstance()
      temp.attach(tempOpts)

      const element = await session.$(selector)

      const elementScreenshot = await session.takeElementScreenshot(
        element.elementId
      )

      const elementScreenshotBase64Buffer = Buffer.from(
        elementScreenshot,
        'base64'
      )

      const currImgInst = new Image(elementScreenshotBase64Buffer)
      const currImg = {
        path: temp.path(Object.assign(tempOpts, { suffix: '.png' })),
        size: currImgInst.getSize()
      }

      await currImgInst.save(currImg.path)

      const test = getTestContext(session.executionContext)
      const refImg = { path: config.getScreenshotPath(test, state), size: null }
      const { emitter } = browser

      if (!fs.existsSync(refImg.path)) {
        return handleNoRefImage(currImg, refImg, state, { emitter }).catch(e =>
          handleCaptureProcessorError(e)
        )
      }

      const { canHaveCaret } = true
      const imageCompareOpts = {
        tolerance: opts.tolerance,
        antialiasingTolerance: opts.antialiasingTolerance,
        canHaveCaret,
        // pixelRatio,
        compareOpts
      }
      const {
        equal,
        diffBounds,
        diffClusters,
        metaInfo = {}
      } = await Image.compare(refImg.path, currImg.path, imageCompareOpts)
      Object.assign(refImg, metaInfo.refImg)

      if (!equal) {
        const diffAreas = { diffBounds, diffClusters }
        const { tolerance, antialiasingTolerance } = opts
        const imageDiffOpts = {
          tolerance,
          antialiasingTolerance,
          canHaveCaret,
          diffAreas,
          config,
          path: emitter
        }

        return handleImageDiff(currImg, refImg, state, imageDiffOpts).catch(e =>
          handleCaptureProcessorError(e)
        )
      }

      hermioneCtx.assertViewResults.add({ stateName: state, refImg: refImg })
    }
  )
}
