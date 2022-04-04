const RuntimeConfig = require('./runtime-config')

module.exports = argv => {
  updateRefs = argv.includes('--update-refs')
  RuntimeConfig.getInstance().extend({ updateRefs })
}
