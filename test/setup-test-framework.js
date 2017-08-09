// `babel-jest` should be doing this instead, but apparently it's not working.
require( 'core-js/modules/es7.object.values' );

// TODO: This is only necessary so long as we're running React 15.x in the Node
// context, since createPortal is only available in 16.x
jest.mock( '@wordpress/element', () => {
	const element = require.requireActual( '@wordpress/element' );

	return {
		...element,
		createPortal: ( ...args ) => {
			/* eslint-disable no-console */
			const consoleWarn = console.error;
			// Shhhh...
			console.error = () => {};
			element.render( ...args );
			console.error = consoleWarn;
			/* eslint-enable no-console */
		},
	};
} );
