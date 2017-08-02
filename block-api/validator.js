/**
 * Internal dependencies
 */
import { getBeautifulContent, getSaveContent } from './serializer';

/**
 * Returns true if the parsed block is valid given the input content. A block
 * is considered valid if, when serialized with assumed attributes, the content
 * matches the original value.
 *
 * Logs to console in development environments when invalid.
 *
 * @param  {String}  rawContent Original block content
 * @param  {String}  blockType  Block type
 * @param  {Object}  attributes Parsed block attributes
 * @return {Boolean}            Whether block is valid
 */
export function isValidBlock( rawContent, blockType, attributes ) {
	const [ actual, expected ] = [
		rawContent,
		getSaveContent( blockType, attributes ),
	].map( getBeautifulContent );

	const isValid = ( actual === expected );

	if ( ! isValid && 'development' === process.env.NODE_ENV ) {
		// eslint-disable-next-line no-console
		console.error(
			'Invalid block parse\n' +
				'\tExpected: ' + expected + '\n' +
				'\tActual:   ' + actual
		);
	}

	return isValid;
}
