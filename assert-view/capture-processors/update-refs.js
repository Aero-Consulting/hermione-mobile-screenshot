const fs = require('fs-extra')

exports.handleNoRefImage = exports.handleImageDiff = async (
  currImg,
  refImg,
  state,
  { emitter }
) => {
  await fs.copy(currImg.path, refImg.path)
  emitter.emit('updateReference', { state, refImg })
}
