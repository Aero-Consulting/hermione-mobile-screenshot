module.exports = class AssertViewResults {
  static create (results) {
    return new AssertViewResults(results)
  }

  constructor (results) {
    this._results = results || []
  }

  add (data) {
    this._results.push(data)
  }

  hasFails () {
    return this._results.some(res => res instanceof Error)
  }

  hasState (stateName) {
    return this._results.some(res => res.stateName === stateName)
  }

  toRawObject () {
    return this._results.map(res => ({ ...res }))
  }

  get () {
    return this._results
  }
}
