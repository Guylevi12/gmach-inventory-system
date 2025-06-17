# Gmach Inventory Management System

## About Us / אודותינו

This project was developed as part of the **Software Engineering for the Community** course at **Azrieli College of Engineering**.

**Development Team:**
- [Guy Levi]
- [Mori Sason]
- [Sawsaw Abu Saama]
- [Ron Astrin]
- [Lidan Beily]

**Course:** Software Engineering for the Community  
**Institution:** Azrieli College of Engineering  
**Academic Year:** 2024-2025

## Project Overview / סקירת הפרויקט

The Gmach Inventory Management System is a comprehensive web application designed to manage lending operations for Jewish community organizations (Gmach). The system provides tools for inventory tracking, loan management, Hebrew calendar integration, and user management.

### Key Features / תכונות עיקריות

- 📦 **Inventory Management** - Track and manage items available for lending
- 📅 **Hebrew Calendar Integration** - Support for Jewish holidays and dates
- 👥 **User Management** - Handle borrowers and administrative users
- 📊 **Dashboard & Analytics** - Overview of lending statistics and activities
- 📱 **Barcode Scanning** - Easy item identification and tracking
- 🔍 **Inspection History** - Track item condition and maintenance
- 💰 **Loan Management** - Complete loan lifecycle management
- 📞 **Contact Management** - Integrated contact bubble system

## Technology Stack / מחסנית טכנולוגיות

### Frontend
- **React** - User interface framework
- **Vite** - Build tool and development server
- **CSS3** - Styling and responsive design
- **JavaScript (ES6+)** - Core programming language

### Backend & Services
- **Firebase** - Backend as a Service (BaaS)
  - Authentication
  - Firestore Database
  - Hosting
  - Cloud Functions

### Development Tools
- **npm** - Package manager
- **ESLint** - Code linting
- **Git** - Version control

## Installation Guide / מדריך התקנה

### Prerequisites / דרישות מוקדמות

Before installing the project, make sure you have the following installed on your system:

1. **Node.js** (version 16.0 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **npm** (usually comes with Node.js)
   - Verify installation: `npm --version`

3. **Git** (for version control)
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

4. **Firebase CLI** (for deployment)
   - Install globally: `npm install -g firebase-tools`
   - Verify installation: `firebase --version`

### Step-by-Step Installation / הוראות התקנה שלב אחר שלב

#### 1. Clone the Repository / שכפול המאגר
```bash
git clone https://github.com/Guylevi12/gmach-inventory-system
cd gmach-inventory-system
```

#### 2. Navigate to Frontend Directory / מעבר לתיקיית הפרונט-אנד
```bash
cd frontend
```

#### 3. Install Dependencies / התקנת תלויות
```bash
npm install
```

**Note:** If you encounter security vulnerabilities with the `xlsx` package, update it:
```bash
npm uninstall xlsx
npm install @sheetjs/xlsx
```

#### 4. Firebase Configuration / הגדרת Firebase

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication, Firestore Database, and Hosting
3. Create a `firebase.json` configuration file in the project root
4. Update Firebase configuration in your project files

#### 5. Environment Variables / משתני סביבה

Create a `.env` file in the frontend directory with your Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

#### 6. Run Development Server / הפעלת שרת הפיתוח
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

#### 7. Build for Production / בנייה לייצור
```bash
npm run build
```

#### 8. Deploy to Firebase / פריסה ל-Firebase
```bash
# Login to Firebase
firebase login

# Deploy the application
firebase deploy
```

### Troubleshooting / פתרון בעיות

#### Common Issues / בעיות נפוצות

1. **Firebase CLI not recognized**
   ```bash
   npm install -g firebase-tools
   ```

2. **Security vulnerabilities in packages**
   ```bash
   npm audit
   npm audit fix
   ```

3. **Large bundle size warning**
   - The application includes many features which may result in a large bundle
   - This is normal for a comprehensive management system

4. **Hebrew text display issues**
   - Ensure your browser supports Hebrew fonts
   - Check that text direction (RTL) is properly configured

## Development / פיתוח

### Project Structure / מבנה הפרויקט

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── HebrewCalendar/  # Hebrew calendar components
│   │   └── NewLoan/         # Loan management components
│   ├── services/            # Firebase and API services
│   ├── firebase/            # Firebase configuration
│   ├── App.jsx             # Main application component
│   └── App.css             # Global styles
├── public/                  # Static assets
├── package.json            # Project dependencies
└── vite.config.js          # Vite configuration
```

### Available Scripts / סקריפטים זמינים

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Contributing / תרומה לפרויקט

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support / תמיכה

For support and questions, please contact the development team or create an issue in the repository.

## License / רישיון

This project is developed for educational purposes as part of the Software Engineering for the Community course at Azrieli College of Engineering.

---

**Developed with ❤️ for the community by Azrieli College of Engineering students**
