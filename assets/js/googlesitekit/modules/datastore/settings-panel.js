/**
 * `core/modules` data store settings panel
 *
 * Site Kit by Google, Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import invariant from 'invariant';

// Actions
const SET_MODULE_SETTINGS_PANEL_STATE = 'SET_MODULE_SETTINGS_PANEL_STATE';

export const initialState = {
	settingsPanel: {
		currentModule: null,
		isEditing: false,
	},
};

export const actions = {
	/**
	 * Sets the module settings panel state for a given module.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} slug  Slug for module.
	 * @param {string} value New setting for module, one of: closed, edit, view.
	 * @return {Object} Action for SET_MODULE_SETTINGS_PANEL_STATE.
	 */
	setModuleSettingsPanelState( slug, value ) {
		invariant( slug, 'slug is required.' );
		const validValues = [ 'closed', 'edit', 'view' ];
		invariant( validValues.includes( value ), `value should be one of ${ validValues.join() } ` );
		return {
			payload: {
				slug,
				value,
			},
			type: SET_MODULE_SETTINGS_PANEL_STATE,
		};
	},
};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_MODULE_SETTINGS_PANEL_STATE: {
			const { slug, value } = payload;
			const settingsPanel = { ...state.settingsPanel };

			settingsPanel.currentModule = 'closed' === value ? null : slug;
			settingsPanel.isEditing = 'edit' === value;

			return {
				...state,
				settingsPanel,
			};
		}

		default: {
			return state;
		}
	}
};

export const selectors = {
	/**
	 * Gets the settings panel state for a given module.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Slug for panelState.
	 * @return {string} Module's panelState as one of: 'view', 'edit', 'closed', 'locked' or null.
	 */
	getModuleSettingsPanelState: ( state, slug ) => {
		invariant( slug, 'slug is required.' );

		const settingsPanel = { ...state.settingsPanel };

		if ( settingsPanel.currentModule === slug ) {
			return settingsPanel.isEditing ? 'edit' : 'view';
		}

		return 'closed';
	},
};

export default {
	actions,
	initialState,
	reducer,
	selectors,
};
