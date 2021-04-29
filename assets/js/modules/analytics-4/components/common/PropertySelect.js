/**
 * GA4 Property Select component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Select, Option } from '../../../../material-components';
import ProgressBar from '../../../../components/ProgressBar';
import { STORE_NAME, PROPERTY_CREATE } from '../../datastore/constants';
import { MODULES_ANALYTICS } from '../../../analytics/datastore/constants';
import { isValidAccountID } from '../../../analytics/util';
import { trackEvent } from '../../../../util';
const { useSelect, useDispatch } = Data;

export default function PropertySelect() {
	const {
		accountID,
		properties,
		isResolvingProperties,
	} = useSelect( ( select ) => {
		const data = {
			accountID: select( MODULES_ANALYTICS ).getAccountID(),
			properties: [],
			isResolvingProperties: false,
		};

		if ( data.accountID ) {
			// TODO: Update this select hook to pull accountID from the modules/analytics-4 datastore when GA4 module becomes separated from the Analytics one
			data.properties = select( STORE_NAME ).getProperties( data.accountID );
			data.isResolvingProperties = select( STORE_NAME ).isResolving( 'getProperties', [ data.accountID ] );
		}

		return data;
	} );

	const propertyID = useSelect( ( select ) => select( STORE_NAME ).getPropertyID() );
	const hasResolvedAccounts = useSelect( ( select ) => select( MODULES_ANALYTICS ).hasFinishedResolution( 'getAccounts' ) );

	const { selectProperty } = useDispatch( STORE_NAME );
	const onChange = useCallback( ( index, item ) => {
		const newPropertyID = item.dataset.value;
		if ( propertyID !== newPropertyID ) {
			selectProperty( newPropertyID );
			trackEvent( 'analytics_setup', 'property_change', newPropertyID );
		}
	}, [ propertyID, selectProperty ] );

	if ( ! hasResolvedAccounts || isResolvingProperties ) {
		return <ProgressBar small />;
	}

	return (
		<Select
			className="googlesitekit-analytics__select-property"
			label={ __( 'Property', 'google-site-kit' ) }
			value={ propertyID }
			onEnhancedChange={ onChange }
			disabled={ ! isValidAccountID( accountID ) }
			enhanced
			outlined
		>
			{ ( properties || [] )
				.concat( {
					_id: PROPERTY_CREATE,
					displayName: __( 'Set up a new property', 'google-site-kit' ),
				} )
				.map( ( { _id, displayName }, index ) => (
					<Option
						key={ index }
						value={ _id }
						data-internal-id={ _id }
					>
						{
							/* translators: 1: Property name. 2: Property ID. */
							_id === PROPERTY_CREATE ? displayName : sprintf( __( '%1$s (%2$s)', 'google-site-kit' ), displayName, _id )
						}
					</Option>
				) ) }
		</Select>
	);
}
