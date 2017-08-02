/**
 * External dependencies
 */
import { Fill } from 'react-slot-fill';

/**
 * WordPress dependencies
 */
import { Toolbar } from 'components';

export default function BlockControls( { controls, children } ) {
	return (
		<Fill name="Block.Toolbar">
			<Toolbar controls={ controls } />
			{ children }
		</Fill>
	);
}
