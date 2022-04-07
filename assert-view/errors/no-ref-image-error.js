const BaseSateError = require('./base-state-error')

module.exports = class NoRefImageError extends BaseSateError {
  static create (...args) {
    return new this(...args)
  }

  constructor (stateName, currImg, refImg) {
    super(stateName, currImg, refImg)

    this.message = `can not find reference image at ${this.refImg.path} for "${stateName}" state`
  }
}
