import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Utility to help debug network connectivity issues in Expo apps
 */
class NetworkDebugger {
  /**
   * Gets the current device and environment information
   * @returns {Object} The device and environment information
   */
  static getDeviceInfo() {
    const deviceInfo = {
      platform: Platform.OS,
      platformVersion: Platform.Version,
      isDevice: Constants.isDevice,
      deviceName: Constants.deviceName,
      expoVersion: Constants.expoVersion,
    };
    
    console.log('Device Info:', JSON.stringify(deviceInfo, null, 2));
    return deviceInfo;
  }

  /**
   * Tests the connection to a given URL
   * @param {string} url - The URL to test
   * @returns {Promise<Object>} The result of the connection test
   */
  static async testConnection(url = 'https://www.google.com') {
    console.log(`Testing connection to: ${url}`);
    
    try {
      const startTime = Date.now();
      const response = await fetch(url, {
        method: 'HEAD',
        cache: 'no-cache',
      });
      const endTime = Date.now();
      
      const result = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        latency: endTime - startTime,
        url,
      };
      
      console.log('Connection test result:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        error: error.message,
        url,
      };
      
      console.error('Connection test failed:', JSON.stringify(errorResult, null, 2));
      return errorResult;
    }
  }

  /**
   * Tests the connection to the API server
   * @param {string} apiUrl - The API URL to test
   * @returns {Promise<Object>} The result of the API connection test
   */
  static async testApiConnection(apiUrl) {
    return this.testConnection(apiUrl);
  }

  /**
   * Logs the current network state
   */
  static async logNetworkState() {
    console.log('--- Network Debug Information ---');
    this.getDeviceInfo();
    await this.testConnection();
    console.log('--------------------------------');
  }
}

export default NetworkDebugger; 