# 📦 Gmach Inventory System - Frontend

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app) and customized with [Craco](https://github.com/dilanx/craco) to support aliasing (`@/` ➔ `src/`).

## ⚡ Quick Setup

After cloning the repository:

1. Navigate into the frontend folder:
    ```bash
    cd frontend
    ```
2. Install all dependencies:
    ```bash
    npm install
    ```
3. Copy the environment variables template:
    ```bash
    cp .env.example .env
    ```
4. Fill in your Firebase credentials inside the new `.env` file:
    ```dotenv
    REACT_APP_FIREBASE_API_KEY=your_api_key_here
    REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
    REACT_APP_FIREBASE_PROJECT_ID=your_project_id_here
    REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
    REACT_APP_FIREBASE_APP_ID=your_app_id_here
    REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id_here
    ```
5. Start the development server:
    ```bash
    npm start
    ```

## 📂 Project Structure Highlights

- `src/components/` ➔ React components (pages, layouts, features)
- `src/services/` ➔ Firebase services and API communication
- `src/firebase/` ➔ Firebase configuration
- `src/contexts/` ➔ React Context Providers
- `src/css/` ➔ Stylesheets
- `public/` ➔ Static files (favicon, manifest, images)

**Important:**  
- Use alias imports (e.g., `@/firebase/firebase-config`) instead of relative paths (`../../`) to keep code clean.
- Never commit your personal `.env` file! Use `.env.example` as the shared template.

---


# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
