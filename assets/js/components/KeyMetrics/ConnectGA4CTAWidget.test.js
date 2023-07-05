/**
 * ConnectGA4CTAWidget component tests.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import ConnectGA4CTAWidget from './ConnectGA4CTAWidget';
import {
	CORE_USER,
	KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
	KM_ANALYTICS_LOYAL_VISITORS,
	KM_ANALYTICS_NEW_VISITORS,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
	KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
	KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
} from '../../googlesitekit/datastore/user/constants';
import {
	render,
	createTestRegistry,
	provideModules,
	provideKeyMetrics,
	provideUserAuthentication,
	provideUserCapabilities,
} from '../../../../tests/js/test-utils';
import { CORE_WIDGETS } from '../../googlesitekit/widgets/datastore/constants';
import { AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY } from '../../googlesitekit/widgets/default-areas';
import { CONTEXT_MAIN_DASHBOARD_KEY_METRICS } from '../../googlesitekit/widgets/default-contexts';

describe( 'ConnectGA4CTAWidget', () => {
	let registry;

	const DISMISSED_ITEM_KEY = 'key-metrics-connect-ga4-cta-widget';

	const Widget = ( { children } ) => <div>{ children }</div>;
	const WidgetNull = () => <div>NULL</div>;

	beforeEach( () => {
		registry = createTestRegistry();

		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		provideKeyMetrics( registry );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( true );

		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: false,
				connected: false,
			},
		] );
	} );

	it( 'should not render when the widget is dismissed', async () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [ DISMISSED_ITEM_KEY ] );

		const { container, waitForRegistry } = render(
			<ConnectGA4CTAWidget Widget={ Widget } WidgetNull={ WidgetNull } />,
			{
				registry,
			}
		);
		await waitForRegistry();
		expect( container ).toHaveTextContent( 'NULL' );
	} );

	it( 'should not render if user input is not completed', async () => {
		global._googlesitekitUserData.isUserInputCompleted = false;
		await registry
			.dispatch( CORE_USER )
			.receiveIsUserInputCompleted( false );

		const { container, waitForRegistry } = render(
			<ConnectGA4CTAWidget Widget={ Widget } WidgetNull={ WidgetNull } />,
			{
				registry,
			}
		);
		await waitForRegistry();
		expect( container ).toHaveTextContent( 'NULL' );
	} );

	it( 'should not render if GA4 is connected', async () => {
		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );

		const { container, waitForRegistry } = render(
			<ConnectGA4CTAWidget Widget={ Widget } WidgetNull={ WidgetNull } />,
			{
				registry,
			}
		);
		await waitForRegistry();
		expect( container ).toHaveTextContent( 'NULL' );
	} );

	it( 'should not render unless at least 3 analytics dependant metrics are registered', async () => {
		const keyMetricWidgets = {
			[ KM_ANALYTICS_LOYAL_VISITORS ]: [ 'analytics-4' ],
			[ KM_ANALYTICS_NEW_VISITORS ]: [ 'analytics-4' ],
			[ KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT ]: [ 'adsense' ],
			[ KM_SEARCH_CONSOLE_POPULAR_KEYWORDS ]: [ 'search-console' ],
		};

		provideKeyMetrics( registry, {
			widgetSlugs: Object.keys( keyMetricWidgets ),
		} );

		registry
			.dispatch( CORE_WIDGETS )
			.registerWidgetArea( AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY, {
				title: 'Key metrics',
			} );
		registry
			.dispatch( CORE_WIDGETS )
			.assignWidgetArea(
				AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY,
				CONTEXT_MAIN_DASHBOARD_KEY_METRICS
			);

		Object.keys( keyMetricWidgets ).forEach( ( slug ) => {
			registry.dispatch( CORE_WIDGETS ).registerWidget( slug, {
				Component: () => <div>Hello test.</div>,
				modules: keyMetricWidgets[ slug ],
			} );
			registry
				.dispatch( CORE_WIDGETS )
				.assignWidget( slug, AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY );
		} );

		const { container, waitForRegistry } = render(
			<ConnectGA4CTAWidget Widget={ Widget } WidgetNull={ WidgetNull } />,
			{
				registry,
			}
		);
		await waitForRegistry();
		expect( container ).toHaveTextContent( 'NULL' );
	} );

	it( 'should render if CTA is dismissed, user input is completed, GA4 is not connected, and at least 3 analytics dependant metrics are registered', async () => {
		const keyMetricWidgets = [
			KM_ANALYTICS_LOYAL_VISITORS,
			KM_ANALYTICS_NEW_VISITORS,
			KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
			KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
		];

		provideKeyMetrics( registry, {
			widgetSlugs: keyMetricWidgets,
		} );

		registry
			.dispatch( CORE_WIDGETS )
			.registerWidgetArea( AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY, {
				title: 'Key metrics',
			} );
		registry
			.dispatch( CORE_WIDGETS )
			.assignWidgetArea(
				AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY,
				CONTEXT_MAIN_DASHBOARD_KEY_METRICS
			);

		keyMetricWidgets.forEach( ( slug ) => {
			registry.dispatch( CORE_WIDGETS ).registerWidget( slug, {
				Component: () => <div>Hello test.</div>,
				modules: [ 'analytics-4' ],
			} );
			registry
				.dispatch( CORE_WIDGETS )
				.assignWidget( slug, AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY );
		} );

		const { container, getByRole, waitForRegistry } = render(
			<ConnectGA4CTAWidget Widget={ Widget } WidgetNull={ WidgetNull } />,
			{
				registry,
			}
		);
		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-publisher-win__title' )
		).toHaveTextContent( 'Google Analytics is disconnected' );
		const button = getByRole( 'button', {
			name: /Connect Google Analytics/i,
		} );
		expect( button ).toBeInTheDocument();
	} );
} );
