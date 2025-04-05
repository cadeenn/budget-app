// This script creates a tunnel to your local server so mobile devices can access it
const localtunnel = require('localtunnel');
const { spawn } = require('child_process');
const path = require('path');

// Start the server
console.log('Starting the server...');
const server = spawn('node', [path.join(__dirname, 'src', 'index.js')], {
  stdio: 'inherit'
});

// Create tunnel when server is running
setTimeout(async () => {
  try {
    console.log('Creating tunnel to expose your local server...');
    const tunnel = await localtunnel({ 
      port: 5000,
      subdomain: 'budget-tracker-' + Math.floor(Math.random() * 1000)
    });
    
    console.log(`🚀 Server is publicly accessible at: ${tunnel.url}`);
    console.log('---------------------------------------------------');
    console.log('👉 USE THIS URL IN YOUR MOBILE APP: ' + tunnel.url + '/api');
    console.log('---------------------------------------------------');
    console.log('Copy this URL and update in mobile/src/services/api.js if needed');
    
    tunnel.on('close', () => {
      console.log('Tunnel closed');
      process.exit(1);
    });
    
    process.on('SIGINT', () => {
      console.log('Shutting down...');
      tunnel.close();
      server.kill();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Error creating tunnel:', error);
    process.exit(1);
  }
}, 3000); // Wait for server to start 