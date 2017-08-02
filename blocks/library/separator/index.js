/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './block.scss';
import { registerBlockType } from '../../api';

registerBlockType( 'core/separator', {
	title: __( 'Separator' ),

	icon: 'minus',

	category: 'layout',

	transforms: {
		from: [
			{
				type: 'pattern',
				regExp: /^-{3,}$/,
				transform: () => ( { name: 'core/separator', attributes: {} } ),
			},
		],
	},

	edit( { className } ) {
		return <hr className={ className } />;
	},

	save() {
		return <hr />;
	},
} );
