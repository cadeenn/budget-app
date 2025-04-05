# Budget Tracker Mobile App

A mobile client for the Budget Tracker web application built with Expo (version 52).

## Features

- User authentication (login/register)
- Dashboard with financial summary
- Expense tracking and management
- Income tracking and management
- Budget planning and tracking
- User profile management
- Connects to existing MERN stack backend

## Prerequisites

- Node.js (14.x or later)
- npm or yarn
- Expo CLI
- Android Studio (for Android development) or Xcode (for iOS development)

## Getting Started

1. Clone the repository:
```
git clone <repository-url>
cd budget-app/mobile
```

2. Install dependencies:
```
npm install
```

3. Configure the API endpoint:
Edit `src/services/api.js` and update the `BASE_URL` to point to your backend server:

```javascript
// For Android Emulator:
const BASE_URL = 'http://10.0.2.2:5000/api';

// For iOS Simulator:
// const BASE_URL = 'http://localhost:5000/api'; 

// For physical device testing, use your computer's IP address:
// const BASE_URL = 'http://192.168.1.100:5000/api';

// For tunnel connections (see tunneling section below):
// const BASE_URL = 'https://your-tunnel-url.loca.lt/api';
```

4. Start the Expo development server:
```
npm start
```

5. Run on a device or emulator:
   - Press `a` in the terminal to open in an Android emulator
   - Press `i` to open in an iOS simulator
   - Scan the QR code with the Expo Go app on your physical device

## Connecting to Backend with Tunneling

When developing on your local machine and trying to connect from a physical device, direct IP connections often have limitations (especially on different networks). Tunneling solves this by creating a public URL that forwards to your local server.

### Setting Up Tunneling

1. Make sure the backend server is running in a separate terminal:
```
cd ../server
npm run dev
```

2. Start a tunnel for the backend server (already set up in package.json):
```
cd ../server
npm run tunnel
```
This will create a public URL (e.g., https://your-random-subdomain.loca.lt) that forwards to your local server.

3. Update the `BASE_URL` in `src/services/api.js` to use the tunnel URL:
```javascript
const BASE_URL = 'https://your-random-subdomain.loca.lt/api';
```

4. For Expo Go on physical devices, you can use tunnel mode to expose your Expo server:
```
npm run tunnel
```
This uses the tunnel script in package.json which runs `expo start --tunnel`.

### Troubleshooting Tunnel Issues

- If tunneling fails to start, try:
  ```
  npx kill-port 4040  # Kill any process using ngrok's default port
  ```
- Ensure you don't have any firewall or VPN blocking the connections
- Check that the backend server is actually running before starting the tunnel
- Some corporate networks block tunneling services; try using a mobile hotspot instead

## Fixing Dependency Issues

If you encounter dependency issues:

### Updating Dependencies

To update packages to the latest compatible versions:
```
npm update
```

### Reinstalling Dependencies

For a complete reset of dependencies:
```
rm -rf node_modules
rm package-lock.json
npm install
```

### Specific Expo Issues

Expo has specific version requirements. If you encounter Expo-related errors:
```
npx expo install --fix
```

This command attempts to fix version mismatches automatically.

### Metro Bundler Issues

If the Metro bundler fails to start:
```
npm start -- --reset-cache
```

## Common Issues and Solutions

### Network Error: Network request failed

- Check that backend server is running
- Verify the BASE_URL in api.js is correct
- For physical devices, ensure they're on the same network as your development machine or use tunneling
- Check for CORS issues in the backend (should allow requests from Expo)

### Expo Error: Unable to resolve module...

- Clear the Metro bundler cache: `npm start -- --reset-cache`
- Restart the Expo development server
- Check that all dependencies are installed correctly

### Date/Timezone Issues

The app uses date formatting with timezone considerations. If dates appear incorrect:
- Check the date handling in `ExpensesScreen.js`, `IncomesScreen.js`, and `BudgetsScreen.js`
- Note that dates are stored with a fixed time (noon) to prevent timezone shifts

## Project Structure

```
mobile/
├── src/
│   ├── components/       # Reusable UI components
│   ├── context/          # React context providers
│   │   ├── AuthContext.js    # Authentication state management
│   │   └── DataContext.js    # Application data management
│   ├── hooks/            # Custom React hooks
│   ├── navigation/       # Navigation configuration
│   ├── screens/          # App screens
│   └── services/         # API services
│       └── api.js        # API connection configuration
├── App.js                # Main app entry point
├── package.json          # Project dependencies
└── README.md             # This file
```

## Building for Production

To create a production build:

```
expo build:android    # For Android
expo build:ios        # For iOS
```

For more information on deploying Expo apps, refer to the [Expo documentation](https://docs.expo.dev/distribution/introduction/).

## License

This project is licensed under the MIT License. 