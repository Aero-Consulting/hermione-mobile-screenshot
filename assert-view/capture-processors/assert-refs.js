const { Image, temp } = require('gemini-core')
const RuntimeConfig = require('../../utils/runtime-config')

const ImageDiffError = require('../errors/image-diff-error')
const NoRefImageError = require('../errors/no-ref-image-error')

exports.handleNoRefImage = (currImg, refImg, state) => {
  return Promise.reject(NoRefImageError.create(state, currImg, refImg))
}

exports.handleImageDiff = async (currImg, refImg, state, opts) => {
  const {
    tolerance,
    antialiasingTolerance,
    canHaveCaret,
    diffAreas,
    config
  } = opts
  const {
    buildDiffOpts,
    system: { diffColor }
  } = config
  buildDiffOpts.ignoreCaret = buildDiffOpts.ignoreCaret && canHaveCaret

  const diffOpts = {
    current: currImg.path,
    reference: refImg.path,
    diffColor,
    tolerance,
    antialiasingTolerance,
    ...buildDiffOpts
  }

  const diffImg = await createDiffImg(diffOpts)

  return Promise.reject(
    ImageDiffError.create(
      state,
      currImg,
      refImg,
      { ...diffOpts, diffImg },
      diffAreas
    )
  )

  async function createDiffImg (diffOptions) {
    const { tempOpts } = RuntimeConfig.getInstance()
    temp.attach(tempOpts)

    const diffPath = temp.path(Object.assign(tempOpts, { suffix: '.png' }))
    const diffBuffer = await Image.buildDiff(diffOptions)

    const diffImgInst = new Image(diffBuffer)
    const diffImg = {
      path: diffPath,
      size: diffImgInst.getSize()
    }

    await diffImgInst.save(diffImg.path)

    return diffImg
  }
}
