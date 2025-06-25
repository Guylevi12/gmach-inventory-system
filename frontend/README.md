# 📦 Gmach Inventory System - Frontend

A comprehensive rental management system for non-profit organizations (עמותות) with automated email reminders, inventory tracking, and loan management.

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
    VITE_FIREBASE_API_KEY=
    VITE_FIREBASE_AUTH_DOMAIN=
    VITE_FIREBASE_PROJECT_ID=
    VITE_FIREBASE_STORAGE_BUCKET=
    VITE_FIREBASE_MESSAGING_SENDER_ID=
    VITE_FIREBASE_APP_ID=
    VITE_FIREBASE_MEASUREMENT_ID=
    ```

## 📧 Email Reminder System Setup

This system automatically sends email reminders to customers 2 days before their return date.

### Step 1: Create EmailJS Account
1. Go to [EmailJS.com](https://www.emailjs.com)
2. Sign up with your organization email
3. Verify your email address

### Step 2: Setup Email Service
1. In EmailJS Dashboard, click **"Email Services"**
2. Click **"Add New Service"**
3. Choose **"Gmail"** (recommended)
4. Connect your Gmail account with **full permissions**
5. Copy your **Service ID** (looks like `service_abc123`)

### Step 3: Create Email Template
1. Click **"Email Templates"**
2. Click **"Create New Template"**
3. **Template Name:** "Rental Return Reminder"
4. **Subject:** `תזכורת: החזרת פריטים בעוד יומיים - {{client_name}}`
5. **Content:** Use the Hebrew template provided in setup documentation
6. Copy your **Template ID** (looks like `template_xyz789`)

### Step 4: Get Public Key
1. Go to **"Account" → "General"**
2. Copy your **Public Key** (looks like `abcdefghijklmnop`)

### Step 5: Configure EmailJS in Code
Update `src/components/EmailReminderSystem.jsx`:
```javascript
const EMAILJS_CONFIG = {
  serviceId: 'your_actual_service_id',     // Replace with your Service ID
  templateId: 'your_actual_template_id',   // Replace with your Template ID  
  publicKey: 'your_actual_public_key'      // Replace with your Public Key
};
```

### Step 6: Test the System
1. Create a test order with return date = today + 2 days
2. Go to "היסטוריות השאלות" (Loan History)
3. Click "🔍 בדוק תזכורות" (Check Reminders)
4. Verify email delivery

## 🚀 Deployment

1. Build the app for production:
    ```bash
    npm run build
    ```
2. Deploy to Firebase Hosting:
    ```bash
    firebase deploy
    ```

## 📂 Project Structure

```
frontend/
├── src/
│   ├── components/           # React components
│   │   ├── EmailReminderSystem.jsx    # Email automation system
│   │   ├── LoanHistory.jsx            # Loan management & statistics
│   │   ├── LoanStatisticsModal.jsx    # Analytics dashboard
│   │   └── ...
│   ├── services/            # Firebase services
│   ├── firebase/            # Firebase configuration
│   ├── contexts/            # React Context Providers
│   └── css/                # Stylesheets
├── public/                  # Static files
└── functions/              # Firebase Cloud Functions (optional)
```

## ✨ Key Features

### 📧 **Automated Email Reminders**
- Sends Hebrew email reminders 2 days before return date
- Professional templates with organization branding
- Automatic daily checks at 9:00 AM (Israel time)
- Admin dashboard for testing and monitoring

### 📊 **Analytics & Statistics**
- Comprehensive loan statistics and trends
- Most popular items and active clients
- Monthly comparison and performance metrics
- Return inspection analytics

### 🎯 **Inventory Management**
- Real-time stock tracking
- Barcode scanning for quick item identification
- Image management with Cloudinary integration
- Advanced search and filtering

### 📅 **Hebrew Calendar Integration**
- Jewish calendar support for religious events
- Visual loan scheduling and conflict detection
- Multi-day event handling

### 🔐 **User Management**
- Role-based access control
- Firebase Authentication integration
- Admin and volunteer permission levels

## 🛠️ Development Scripts

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm test`
Launches the test runner in interactive watch mode

### `npm run build`
Builds the app for production to the `build` folder

### `npm run eject`
⚠️ **One-way operation!** Ejects from Create React App for full control

## 🔧 Configuration Notes

### Import Aliases
Use alias imports for cleaner code:
```javascript
// ✅ Good
import { db } from '@/firebase/firebase-config';

// ❌ Avoid
import { db } from '../../firebase/firebase-config';
```

### Environment Variables
- Never commit your `.env` file
- Use `.env.example` as the shared template
- All environment variables must start with `VITE_`

### Firebase Configuration
- Ensure Firestore security rules are properly configured
- Set up proper authentication rules for admin features
- Configure storage rules for image uploads

## 📱 Mobile Compatibility

The system is fully responsive and optimized for:
- ✅ Desktop administrators
- ✅ Tablet volunteers
- ✅ Mobile field workers

## 🌐 Browser Support

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge

## 🔒 Security Features

- Firebase Authentication with role-based access
- Secure API endpoints with proper validation
- Client-side form validation and sanitization
- Proper error handling and user feedback

## 📞 Support & Maintenance

### For Developers:
- React 18+ with modern hooks
- Firebase v9 modular SDK
- Responsive design with CSS Grid/Flexbox
- EmailJS for reliable email delivery

### For Organizations:
- Simple admin interface requiring no technical knowledge
- Visual email template editor through EmailJS dashboard
- Clear documentation for daily operations
- Backup and export capabilities

## 🎯 Perfect for Non-Profits

This system is specifically designed for:
- **עמותות** (Non-profit organizations)
- **גמחים** (Free loan societies) 
- **Community centers**
- **Religious institutions**
- **Event rental services**

## 📈 Scalability

- Handles thousands of items and loans
- Efficient Firebase querying with pagination
- Optimized image loading and caching
- Email system scales with organization growth

## 🏆 Production Ready

- Comprehensive error handling
- Loading states and user feedback
- Data validation and sanitization
- Professional Hebrew UI/UX
- Mobile-first responsive design

---

- [Create React App Documentation](https://facebook.github.io/create-react-app/docs/getting-started)
- [React Documentation](https://reactjs.org/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [EmailJS Documentation](https://www.emailjs.com/docs/)