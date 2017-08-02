/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import { text } from '../query';
import {
	getBlockAttributes,
	parseBlockAttributes,
	createBlockWithFallback,
	default as parse,
} from '../parser';

describe( 'block parser', () => {
	const defaultBlockType = {
		name: 'core/test-block',
		save: ( { attributes } ) => attributes.fruit,
	};

	describe( 'parseBlockAttributes()', () => {
		it( 'should use the function implementation', () => {
			const attributes = function( rawContent ) {
				return {
					content: rawContent + ' & Chicken',
				};
			};

			expect( parseBlockAttributes( 'Ribs', attributes ) ).toEqual( {
				content: 'Ribs & Chicken',
			} );
		} );

		it( 'should use the query object implementation', () => {
			const attributes = {
				emphasis: text( 'strong' ),
				ignoredDomMatcher: ( node ) => node.innerHTML,
			};

			const rawContent = '<span>Ribs <strong>& Chicken</strong></span>';

			expect( parseBlockAttributes( rawContent, attributes ) ).toEqual( {
				emphasis: '& Chicken',
			} );
		} );

		it( 'should return an empty object if no attributes defined', () => {
			const attributes = {};
			const rawContent = '<span>Ribs <strong>& Chicken</strong></span>';

			expect( parseBlockAttributes( rawContent, attributes ) ).toEqual( {} );
		} );
	} );

	describe( 'getBlockAttributes()', () => {
		it( 'should merge attributes with the parsed and default attributes', () => {
			const blockType = {
				attributes: function( rawContent ) {
					return {
						content: rawContent + ' & Chicken',
					};
				},
				defaultAttributes: {
					content: '',
					topic: 'none',
				},
			};

			const rawContent = 'Ribs';
			const attrs = { align: 'left' };

			expect( getBlockAttributes( blockType, rawContent, attrs ) ).toEqual( {
				align: 'left',
				topic: 'none',
				content: 'Ribs & Chicken',
			} );
		} );
	} );

	describe( 'createBlockWithFallback', () => {
		it( 'should create the requested block if it exists', () => {
			const block = createBlockWithFallback(
				'core/test-block',
				'content',
				{ attr: 'value' },
				{ blockTypes: [ defaultBlockType ] }
			);
			expect( block.name ).toEqual( 'core/test-block' );
			expect( block.attributes ).toEqual( { attr: 'value' } );
		} );

		it( 'should create the requested block with no attributes if it exists', () => {
			const block = createBlockWithFallback(
				'core/test-block',
				'content',
				undefined,
				{ blockTypes: [ defaultBlockType ] }
			);
			expect( block.name ).toEqual( 'core/test-block' );
			expect( block.attributes ).toEqual( {} );
		} );

		it( 'should fall back to the unknown type handler for unknown blocks if present', () => {
			const unknownBlockType = {
				...defaultBlockType,
				name: 'core/unknown-block',
			};
			const config = {
				blockTypes: [ unknownBlockType ],
				fallbackBlockName: 'core/unknown-block',
			};

			const block = createBlockWithFallback(
				'core/test-block',
				'content',
				{ attr: 'value' },
				config
			);
			expect( block.name ).toEqual( 'core/unknown-block' );
			expect( block.attributes ).toEqual( { attr: 'value' } );
		} );

		it( 'should fall back to the unknown type handler if block type not specified', () => {
			const unknownBlockType = {
				...defaultBlockType,
				name: 'core/unknown-block',
			};
			const config = {
				blockTypes: [ unknownBlockType ],
				fallbackBlockName: 'core/unknown-block',
			};

			const block = createBlockWithFallback( null, 'content', undefined, config );
			expect( block.name ).toEqual( 'core/unknown-block' );
			expect( block.attributes ).toEqual( {} );
		} );

		it( 'should not create a block if no unknown type handler', () => {
			const config = {
				blockTypes: [],
			};
			const block = createBlockWithFallback( 'core/test-block', 'content', undefined, config );
			expect( block ).toBeUndefined();
		} );
	} );

	describe( 'parse()', () => {
		it( 'should parse the post content, including block attributes', () => {
			const testBlockType = {
				name: 'core/test-block',
				// Currently this is the only way to test block content parsing?
				attributes: function( rawContent ) {
					return {
						content: rawContent,
					};
				},
				save: noop,
			};
			const config = {
				blockTypes: [ testBlockType ],
			};

			const parsed = parse(
				'<!-- wp:core/test-block {"smoked":"yes","url":"http://google.com","chicken":"ribs & \'wings\'"} -->' +
				'Brisket' +
				'<!-- /wp:core/test-block -->',
				config
			);

			expect( parsed ).toHaveLength( 1 );
			expect( parsed[ 0 ].name ).toBe( 'core/test-block' );
			expect( parsed[ 0 ].attributes ).toEqual( {
				content: 'Brisket',
				smoked: 'yes',
				url: 'http://google.com',
				chicken: 'ribs & \'wings\'',
			} );
			expect( typeof parsed[ 0 ].uid ).toBe( 'string' );
		} );

		it( 'should parse empty post content', () => {
			const parsed = parse( '', { blockTypes: [] } );

			expect( parsed ).toEqual( [] );
		} );

		it( 'should parse the post content, ignoring unknown blocks', () => {
			const blockType = {
				name: 'core/test-block',
				attributes: function( rawContent ) {
					return {
						content: rawContent + ' & Chicken',
					};
				},
				save: noop,
			};
			const config = {
				blockTypes: [ blockType ],
			};

			const parsed = parse(
				'<!-- wp:core/test-block -->\nRibs\n<!-- /wp:core/test-block -->' +
				'<p>Broccoli</p>' +
				'<!-- wp:core/unknown-block -->Ribs<!-- /wp:core/unknown-block -->',
				config
			);

			expect( parsed ).toHaveLength( 1 );
			expect( parsed[ 0 ].name ).toBe( 'core/test-block' );
			expect( parsed[ 0 ].attributes ).toEqual( {
				content: 'Ribs & Chicken',
			} );
			expect( typeof parsed[ 0 ].uid ).toBe( 'string' );
		} );

		it( 'should parse the post content, using unknown block handler', () => {
			const unknownBlockType = {
				...defaultBlockType,
				name: 'core/unknown-block',
			};

			const config = {
				blockTypes: [ defaultBlockType, unknownBlockType ],
				fallbackBlockName: 'core/unknown-block',
			};

			const parsed = parse(
				'<!-- wp:core/test-block -->Ribs<!-- /wp:core/test-block -->' +
				'<p>Broccoli</p>' +
				'<!-- wp:core/unknown-block -->Ribs<!-- /wp:core/unknown-block -->',
				config
			);

			expect( parsed ).toHaveLength( 3 );
			expect( parsed.map( ( { name } ) => name ) ).toEqual( [
				'core/test-block',
				'core/unknown-block',
				'core/unknown-block',
			] );
		} );

		it( 'should parse the post content, including raw HTML at each end', () => {
			const unknownBlockType = {
				name: 'core/unknown-block',
				attributes: function( rawContent ) {
					return {
						content: rawContent,
					};
				},
				save: noop,
			};

			const config = {
				blockTypes: [ defaultBlockType, unknownBlockType ],
				fallbackBlockName: 'core/unknown-block',
			};

			const parsed = parse(
				'<p>Cauliflower</p>' +
				'<!-- wp:core/test-block -->Ribs<!-- /wp:core/test-block -->' +
				'\n<p>Broccoli</p>\n' +
				'<!-- wp:core/test-block -->Ribs<!-- /wp:core/test-block -->' +
				'<p>Romanesco</p>',
				config
			);

			expect( parsed ).toHaveLength( 5 );
			expect( parsed.map( ( { name } ) => name ) ).toEqual( [
				'core/unknown-block',
				'core/test-block',
				'core/unknown-block',
				'core/test-block',
				'core/unknown-block',
			] );
			expect( parsed[ 0 ].attributes.content ).toEqual( '<p>Cauliflower</p>' );
			expect( parsed[ 2 ].attributes.content ).toEqual( '<p>Broccoli</p>' );
			expect( parsed[ 4 ].attributes.content ).toEqual( '<p>Romanesco</p>' );
		} );

		it( 'should parse blocks with empty content', () => {
			const config = {
				blockTypes: [ defaultBlockType ],
			};
			const parsed = parse(
				'<!-- wp:core/test-block --><!-- /wp:core/test-block -->',
				config
			);

			expect( parsed ).toHaveLength( 1 );
			expect( parsed.map( ( { name } ) => name ) ).toEqual( [
				'core/test-block',
			] );
		} );

		it( 'should parse void blocks', () => {
			const voidBlockType = {
				...defaultBlockType,
				name: 'core/void-block',
			};
			const config = {
				blockTypes: [ defaultBlockType, voidBlockType ],
			};
			const parsed = parse(
				'<!-- wp:core/test-block --><!-- /wp:core/test-block -->' +
				'<!-- wp:core/void-block /-->',
				config
			);

			expect( parsed ).toHaveLength( 2 );
			expect( parsed.map( ( { name } ) => name ) ).toEqual( [
				'core/test-block', 'core/void-block',
			] );
		} );
	} );
} );
