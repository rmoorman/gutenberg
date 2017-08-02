/**
 * External dependencies
 */
import { bindActionCreators } from 'redux';
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as SlotFillProvider } from 'react-slot-fill';
import moment from 'moment-timezone';
import 'moment-timezone/moment-timezone-utils';

/**
 * WordPress dependencies
 */
import { EditableProvider, getBlockTypes, getUnknownTypeHandler, getDefaultBlock, getCategories } from '@wordpress/blocks';
import { parse } from '@wordpress/block-api';
import { render } from '@wordpress/element';
import { settings as dateSettings } from '@wordpress/date';

/**
 * Internal dependencies
 */
import './assets/stylesheets/main.scss';
import Layout from './layout';
import { createReduxStore } from './state';
import { undo, createInfoNotice } from './actions';
import EnableTrackingPrompt, { TRACKING_PROMPT_NOTICE_ID } from './enable-tracking-prompt';
import EditorSettingsProvider from './settings/provider';

/**
 * The default editor settings
 * You can override any default settings when calling createEditorInstance
 *
 *  wideImages   boolean   Enable/Disable Wide/Full Alignments
 *
 * @var {Object} DEFAULT_SETTINGS
 */
const DEFAULT_SETTINGS = {
	wideImages: false,
};

// Configure moment globally
moment.locale( dateSettings.l10n.locale );
if ( dateSettings.timezone.string ) {
	moment.tz.setDefault( dateSettings.timezone.string );
} else {
	const momentTimezone = {
		name: 'WP',
		abbrs: [ 'WP' ],
		untils: [ null ],
		offsets: [ -dateSettings.timezone.offset * 60 ],
	};
	const unpackedTimezone = moment.tz.pack( momentTimezone );
	moment.tz.add( unpackedTimezone );
	moment.tz.setDefault( 'WP' );
}

/**
 * Initializes Redux state with bootstrapped post, if provided.
 *
 * @param {Redux.Store} store    Redux store instance
 * @param {Object}      post     Bootstrapped post object
 * @param {Object}      settings Block Types settings
 */
function preparePostState( store, post, settings ) {
	// Set current post into state
	store.dispatch( {
		type: 'RESET_POST',
		post,
	} );

	// Parse content as blocks
	if ( post.content.raw ) {
		store.dispatch( {
			type: 'RESET_BLOCKS',
			blocks: parse( post.content.raw, settings ),
		} );
	}

	// Include auto draft title in edits while not flagging post as dirty
	if ( post.status === 'auto-draft' ) {
		store.dispatch( {
			type: 'SETUP_NEW_POST',
			edits: {
				title: post.title.raw,
			},
		} );
	}
}

/**
 * Initializes and returns an instance of Editor.
 *
 * @param {String} id              Unique identifier for editor instance
 * @param {Object} post            API entity for post to edit  (type required)
 * @param {Object} editorSettings  Editor settings object
 */
export function createEditorInstance( id, post, editorSettings = DEFAULT_SETTINGS ) {
	const store = createReduxStore();
	const settings = {
		...editorSettings,
		blockTypes: getBlockTypes(),
		fallbackBlockName: getUnknownTypeHandler(),
		defaultBlockName: getDefaultBlock(),
		categories: getCategories(),
	};

	store.dispatch( {
		type: 'SETUP_EDITOR',
		settings,
	} );

	if ( window.getUserSetting( 'gutenberg_tracking' ) === '' ) {
		store.dispatch( createInfoNotice(
			<EnableTrackingPrompt />,
			TRACKING_PROMPT_NOTICE_ID
		) );
	}

	preparePostState( store, post, settings );

	render(
		<ReduxProvider store={ store }>
			<SlotFillProvider>
				<EditableProvider {
					...bindActionCreators( {
						onUndo: undo,
					}, store.dispatch ) }
				>
					<EditorSettingsProvider settings={ settings }>
						<Layout />
					</EditorSettingsProvider>
				</EditableProvider>
			</SlotFillProvider>
		</ReduxProvider>,
		document.getElementById( id )
	);
}
