<?php
/**
 * Class Google\Site_Kit\Core\Consent_Mode\Consent_Mode_Settings
 *
 * @package   Google\Site_Kit\Core\Consent_Mode
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Consent_Mode;

use Google\Site_Kit\Core\Storage\Setting;

/**
 * Class to store user Consent Mode settings.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Consent_Mode_Settings extends Setting {

	/**
	 * The user option name for this setting.
	 */
	const OPTION = 'googlesitekit_consent_mode';

	/**
	 * Gets the expected value type.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'object';
	}

	/**
	 * Gets the default value.
	 *
	 * @since n.e.x.t
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array(
			'enabled' => false,
			'regions' => Regions::EEA,
		);
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since n.e.x.t
	 *
	 * @return callable Sanitize callback.
	 */
	protected function get_sanitize_callback() {
		return function ( $value ) {
			$new_value = $this->get();

			if ( isset( $value['enabled'] ) ) {
				$new_value['enabled'] = (bool) $value['enabled'];
			}

			if ( ! empty( $value['regions'] ) && is_array( $value['regions'] ) ) {
				$region_codes = array_reduce(
					$value['regions'],
					static function ( $regions, $region_code ) {
						$region_code = strtoupper( $region_code );
						// Match ISO 3166-2 (`AB` or `CD-EF`).
						if ( ! preg_match( '#^[A-Z]{2}(-[A-Z]{2})?$#', $region_code ) ) {
							return $regions;
						}
						// Store as keys to remove duplicates.
						$regions[ $region_code ] = true;
						return $regions;
					},
					array()
				);

				$new_value['regions'] = array_keys( $region_codes );
			}

			return $new_value;
		};
	}
}
