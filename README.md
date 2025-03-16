# Budget Tracker

A comprehensive budget tracking application built with the MERN stack (MongoDB, Express.js, React.js, Node.js) that allows users to track expenses, visualize spending patterns, and manage their finances effectively.

## Features

- User authentication and profile management
- Expense and income tracking
- Budget creation and management
- Category-based expense organization
- Interactive charts and graphs for financial visualization
- Cross-platform mobile app using React Native
- Responsive web interface

## Project Structure

- `/server` - Backend API built with Node.js and Express
- `/client` - Web frontend built with React.js
- `/mobile` - Mobile app built with React Native
- `/shared` - Shared utilities and components

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies for each component:

```bash
# Server
cd server
npm install

# Web Client
cd client
npm install

# Mobile App
cd mobile
npm install
```

3. Set up environment variables (see `.env.example` files in each directory)
4. Start the development servers:

```bash
# Server
cd server
npm run dev

# Web Client
cd client
npm start

# Mobile App
cd mobile
npm start
```

## Technologies Used

- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Web Frontend**: React.js, Redux, Chart.js, Material-UI
- **Mobile App**: React Native, Expo, Redux
- **Authentication**: JWT, bcrypt
- **Deployment**: Docker, AWS/Heroku

## GitHub Setup

1. Make sure you have Git installed on your machine
2. Initialize Git in your project folder (if not already done):
   ```bash
   git init
   ```
3. Add your GitHub repository as a remote:
   ```bash
   git remote add origin https://github.com/yourusername/your-repo-name.git
   ```
4. Stage your changes:
   ```bash
   git add .
   ```
5. Commit your changes:
   ```bash
   git commit -m "Initial commit"
   ```
6. Push to GitHub:
   ```bash
   git push -u origin main
   ```

## Security Considerations

Before pushing to GitHub:

1. Ensure all sensitive information is in `.env` files and not committed to the repository
2. The `.gitignore` file is set up to exclude:
   - Node modules
   - Environment files (.env)
   - Build directories
   - Log files
   - IDE-specific files

3. Run security audits regularly:
   ```bash
   # Check for vulnerabilities
   npm audit
   
   # Fix vulnerabilities (use with caution)
   npm audit fix
   ```

4. Known vulnerabilities:
   - Server: The nodemon dependency has vulnerabilities that can be fixed with `npm audit fix --force`
   - Client: React-scripts has some dependencies with vulnerabilities. Use `npm audit fix --force` with caution as it may break functionality.
