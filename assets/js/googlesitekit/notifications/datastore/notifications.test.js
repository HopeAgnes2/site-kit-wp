/**
 * `core/notifications` data store: notifications tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
 * Internal dependencies
 */
import {
	createTestRegistry,
	untilResolved,
} from '../../../../../tests/js/utils';
import { render } from '../../../../../tests/js/test-utils';
import { CORE_NOTIFICATIONS, NOTIFICATION_AREAS } from './constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../constants';
import { CORE_USER } from '../../datastore/user/constants';

describe( 'core/notifications Notifications', () => {
	const fetchGetDismissedItems = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismissed-items'
	);
	const fetchDismissItem = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-item'
	);

	let registry;
	let store;

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ CORE_NOTIFICATIONS ].store;
	} );

	afterEach( () => {} );

	describe( 'actions', () => {
		describe( 'registerNotification', () => {
			const id = 'test-notification-id';
			function TestNotificationComponent( props ) {
				return <div>Hello { props.children }!</div>;
			}

			it( 'should require a Component to be provided', () => {
				expect( () =>
					registry
						.dispatch( CORE_NOTIFICATIONS )
						.registerNotification( id, {} )
				).toThrow(
					'Component is required to register a notification.'
				);
			} );

			it( 'should require a valid areaSlug to be provided', () => {
				expect( () =>
					registry
						.dispatch( CORE_NOTIFICATIONS )
						.registerNotification( id, {
							Component: TestNotificationComponent,
							areaSlug: 'some-random-area',
						} )
				).toThrow( 'Notification area should be one of:' );
			} );

			it( 'should require a valid array of view contexts to be provided', () => {
				expect( () =>
					registry
						.dispatch( CORE_NOTIFICATIONS )
						.registerNotification( id, {
							Component: TestNotificationComponent,
							areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
							viewContexts: [ 'some-random-view-context' ],
						} )
				).toThrow( 'Notification view context should be one of:' );
			} );

			it( 'should register the notification with the given settings and component', () => {
				registry
					.dispatch( CORE_NOTIFICATIONS )
					.registerNotification( id, {
						Component: TestNotificationComponent,
						areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
						viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
						priority: 11,
						checkRequirements: () => true,
						isDismissible: false,
					} );

				const { notifications } = store.getState();

				expect( notifications[ id ].Component ).toEqual(
					TestNotificationComponent
				);
				expect( notifications[ id ].areaSlug ).toBe(
					NOTIFICATION_AREAS.BANNERS_ABOVE_NAV
				);
				expect( notifications[ id ].viewContexts ).toEqual( [
					VIEW_CONTEXT_MAIN_DASHBOARD,
				] );
				expect( notifications[ id ].priority ).toBe( 11 );
				expect( typeof notifications[ id ].checkRequirements ).toBe(
					'function'
				);

				// Ensure we can render a component with the notification's component, verifying it's still a
				// usable React component.
				const { Component } = store.getState().notifications[ id ];
				const { container } = render( <Component>world</Component> );
				expect( container.firstChild ).toMatchSnapshot();
			} );

			it( 'should not overwrite an existing notification', () => {
				function NotificationOne() {
					return <div>Hello world!</div>;
				}
				function NotificationOneRedone() {
					return <div>Goodbye you!</div>;
				}
				registry
					.dispatch( CORE_NOTIFICATIONS )
					.registerNotification( id, {
						Component: NotificationOne,
						areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
						viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					} );

				registry
					.dispatch( CORE_NOTIFICATIONS )
					.registerNotification( id, {
						Component: NotificationOneRedone,
						areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
						viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					} );
				expect( console ).toHaveWarnedWith(
					`Could not register notification with ID "${ id }". Notification "${ id }" is already registered.`
				);

				// Ensure original notification's component is registered.
				expect( store.getState().notifications[ id ].Component ).toBe(
					NotificationOne
				);
			} );
		} );
		describe( 'dismissNotification', () => {
			it( 'should require a valid id to be provided', () => {
				expect( () =>
					registry
						.dispatch( CORE_NOTIFICATIONS )
						.dismissNotification()
				).toThrow(
					'A notification id is required to dismiss a notification.'
				);
			} );
			it( 'should dismiss a notification without a given expiry time', async () => {
				fetchMock.postOnce( fetchDismissItem, {
					body: [ 'foo' ],
				} );

				await registry
					.dispatch( CORE_NOTIFICATIONS )
					.dismissNotification( 'foo' );

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched( fetchDismissItem, {
					body: {
						data: {
							slug: 'foo',
							expiration: 0,
						},
					},
				} );

				const isNotificationDismissed = registry
					.select( CORE_NOTIFICATIONS )
					.isNotificationDismissed( 'foo' );
				expect( isNotificationDismissed ).toBe( true );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );
			it( 'should dismiss a notification with a given expiry time', async () => {
				fetchMock.postOnce( fetchDismissItem, {
					body: [ 'foo' ],
				} );

				await registry
					.dispatch( CORE_NOTIFICATIONS )
					.dismissNotification( 'foo', { expiresInSeconds: 3 } );

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched( fetchDismissItem, {
					body: {
						data: {
							slug: 'foo',
							expiration: 3,
						},
					},
				} );

				const isNotificationDismissed = registry
					.select( CORE_NOTIFICATIONS )
					.isNotificationDismissed( 'foo' );
				expect( isNotificationDismissed ).toBe( true );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'isNotificationDismissed', () => {
			it( 'should return undefined if getDismissedItems selector is not resolved yet', async () => {
				fetchMock.getOnce( fetchGetDismissedItems, { body: [] } );
				expect(
					registry
						.select( CORE_NOTIFICATIONS )
						.isNotificationDismissed( 'foo' )
				).toBeUndefined();
				await untilResolved( registry, CORE_USER ).getDismissedItems();
			} );

			it( 'should return TRUE if the notification is dismissed', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetDismissedItems( [ 'foo', 'bar' ] );
				expect(
					registry
						.select( CORE_NOTIFICATIONS )
						.isNotificationDismissed( 'foo' )
				).toBe( true );
			} );

			it( 'should return FALSE if the notification is not dismissed', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetDismissedItems( [ 'foo', 'bar' ] );
				expect(
					registry
						.select( CORE_NOTIFICATIONS )
						.isNotificationDismissed( 'baz' )
				).toBe( false );
			} );
		} );
	} );
} );
