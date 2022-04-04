'use strict'

const assertMobileView = require('./assert-view')
const addUpdateRefs = require('./utils/readEnvs')

module.exports = async (hermione, opts) => {
  if (!opts.enabled) {
    return
  }

  addUpdateRefs(process.argv)

  hermione.on(hermione.events.NEW_BROWSER, async (browser, { browserId }) => {
    hermione._runner._browserPool._browsers[browserId].forEach(
      async existingBrowser => {
        await assertMobileView(existingBrowser)
      }
    )
  })
}
