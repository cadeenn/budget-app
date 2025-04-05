import Constants from 'expo-constants';

/**
 * Utility to help with tunnel connections in Expo
 */
class TunnelProxy {
  /**
   * Get the manifest URL from Expo
   * This is useful for debugging connection issues
   */
  static getManifestUrl() {
    try {
      // Try to get the host in different ways since Expo structure varies by version
      const debuggerHost = 
        Constants.expoConfig?.hostUri ||
        Constants.manifest2?.extra?.expoClient?.debuggerHost || 
        Constants.manifest?.debuggerHost ||
        Constants.manifest?.packagerOpts?.dev
          ? Constants.manifest?.packagerOpts?.hostType === 'tunnel' 
            ? Constants.manifest?.bundleUrl?.split('/')[2].split(':')[0]
            : null
          : null;
      
      if (debuggerHost) {
        console.log('Expo Debug Host Found:', debuggerHost);
        // Extract just the hostname part (without the port)
        const host = debuggerHost.split(':')[0];
        return `http://${host}`;
      }
      
      console.warn('Could not determine Expo debug host');
      return 'https://localhost'; // Use HTTPS as fallback
    } catch (error) {
      console.error('Error getting manifest URL:', error);
      return 'https://localhost';
    }
  }

  /**
   * Creates a URL to the host server based on the Expo tunnel
   * @param {string} path - API path to append to the host URL
   * @returns {string} The full URL
   */
  static getServerUrl(path = '') {
    try {
      // When using tunnel mode, we should use a publicly accessible endpoint
      // For local dev, this is typically your machine's public IP or a tunnel service

      // Try to use an environment variable or predefined server URL if available
      const isProduction = process.env.NODE_ENV === 'production';
      
      if (isProduction) {
        // Use your production API endpoint in a real app
        return `https://your-production-api.com${path}`;
      } else {
        // For development, we can use ngrok or a similar tunnel service
        // Expo's tunnel sometimes exposes your local server, check terminal output
        
        // Try to get host from Expo config first
        const host = this.getManifestUrl();
        
        // If we couldn't determine the host, use a default value that can be changed
        const serverUrl = host || 'https://localhost';
        const port = '5000'; // Your server port
        
        const url = `${serverUrl}:${port}${path}`;
        console.log('Server URL:', url);
        return url;
      }
    } catch (error) {
      console.error('Error constructing server URL:', error);
      return `https://localhost:5000${path}`;
    }
  }

  /**
   * Tests the connection to the backend server through the tunnel
   * @returns {Promise<boolean>} True if connected successfully
   */
  static async testServerConnection() {
    try {
      const url = this.getServerUrl('/api');
      console.log('Testing server connection at:', url);
      
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-cache',
      });
      
      const success = response.ok;
      console.log('Server connection test:', success ? 'SUCCESS' : 'FAILED');
      return success;
    } catch (error) {
      console.error('Server connection test failed:', error.message);
      return false;
    }
  }

  /**
   * Get network information for debugging
   * @returns {Object} Network information
   */
  static getNetworkInfo() {
    const info = {
      manifestUrl: this.getManifestUrl(),
      serverUrl: this.getServerUrl(),
      constants: {
        expoConfig: Constants.expoConfig,
        debuggerHost: Constants.manifest?.debuggerHost,
        hostUri: Constants.expoConfig?.hostUri
      }
    };
    
    console.log('Network Info:', JSON.stringify(info, null, 2));
    return info;
  }
}

export default TunnelProxy; 