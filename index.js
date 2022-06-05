const assertMobileView = require('./assert-view');
const updateRefsCheck = require('./utils/updateRefsCheck');

module.exports = async (hermione, opts) => {
	if (!opts.enabled) {
		return;
	}

	updateRefsCheck(process.argv);

	hermione.on(hermione.events.NEW_BROWSER, (browser, { browserId }) => {
		hermione._runner._browserPool._browsers[browserId].forEach(
			(existingBrowser) => {
				assertMobileView(existingBrowser);
			}
		);
	});
};
