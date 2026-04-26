# Ṣe Ṣe Wá - Handyman & Professional Marketplace

Ṣe Ṣe Wá is a modern, standalone marketplace for finding and booking local handyman and professional services across Nigeria. Built with React, Tailwind CSS, and Firebase, it offers a secure and user-friendly platform connecting customers with verified professionals.

## 🚀 Features

- **Service Discovery**: Browse professionals by category (Plumbing, Electrical, Carpentry, Mechanics, etc.).
- **Smart Search**: Find pros by name, skill, or location.
- **Nearby Search**: Use browser geolocation to find the closest service providers.
- **Escrow Payments**: Secure transactions via Paystack integration. Funds are held in escrow until job completion.
- **Dispute Resolution**: Admin-mediated dispute system for user and professional protection.
- **Professional Verification**: ID document upload and admin vetting workflow for "Verified" badges.
- **Real-time Chat**: Direct messaging between customers and handymen.
- **Lead System**: Professionals can unlock job leads using a credit system.
- **User Authentication**: Secure login via Google or Email/Password.
- **Admin Dashboard**: Manage verifications, disputes, and marketplace settings.
- **Responsive Design**: Optimized for mobile, tablet, and desktop.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4
- **Animations**: Motion (Framer Motion)
- **Icons**: Lucide React
- **Backend**: Firebase (Authentication, Firestore, Cloud Functions)
- **Payments**: Paystack API
- **State Management**: React Hooks (useState, useEffect, useContext)

## 📦 Getting Started

### Prerequisites

- Node.js v22 or higher
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yomz84dm-ops/Sesewa.ng.git
   cd Sesewa.ng
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Fill in your Paystack, Firebase, and ReCAPTCHA credentials.

4. Start the development server:
   ```bash
   npm run dev
   ```

## 🚢 Deployment

### Firebase Hosting (Recommended)

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login:**
   ```bash
   firebase login
   ```

3. **Build and deploy:**
   ```bash
   npm run build
   firebase deploy
   ```

4. **Connect Custom Domain:**
   - Go to the [Firebase Console](https://console.firebase.google.com).
   - Navigate to your project's Hosting section.
   - Click **"Add Custom Domain"**.
   - Follow the DNS instructions provided by Firebase.

### Vercel Deployment

1. **Connect repository to Vercel:**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Configure environment variables in Vercel dashboard**

3. **Deploy:**
   ```bash
   vercel --prod
   ```

### Netlify Deployment

1. **Connect repository to Netlify via GitHub**

2. **Add environment variables in Netlify dashboard**

3. **Configure build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`

## 🔐 Security

- All sensitive environment variables are managed via `.env` files
- Firebase API keys are loaded from environment variables
- Firestore security rules enforce user authentication and data isolation
- Admin access is controlled via Firestore custom claims
- ReCAPTCHA v3 protects against bot attacks

## 📄 License

This project is licensed under the MIT License.
