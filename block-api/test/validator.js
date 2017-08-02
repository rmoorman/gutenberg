/**
 * Internal dependencies
 */
import { isValidBlock } from '../validator';

describe( 'block validator', () => {
	const defaultBlockType = {
		name: 'core/test-block',
		save: ( { attributes } ) => attributes.fruit,
	};

	describe( 'isValidBlock', () => {
		it( 'returns false is block is not valid', () => {
			expect( isValidBlock(
				'Apples',
				defaultBlockType,
				{ fruit: 'Bananas' }
			) ).toBe( false );
		} );

		it( 'returns true is block is valid', () => {
			expect( isValidBlock(
				'Bananas',
				defaultBlockType,
				{ fruit: 'Bananas' }
			) ).toBe( true );
		} );
	} );
} );
