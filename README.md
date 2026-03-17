# 🏗️ WageMate: Smart Construction Workforce Management

[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?logo=nodedotjs)](https://nodejs.org/)
[![React Native](https://img.shields.io/badge/Frontend-React_Native-61DAFB?logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Framework-Expo-000020?logo=expo)](https://expo.dev/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Cloudinary](https://img.shields.io/badge/Storage-Cloudinary-3448C5?logo=cloudinary)](https://cloudinary.com/)

**WageMate** is a high-performance, specialized mobile solution designed for construction site owners and supervisors. It simplifies the complexities of daily labor management, attendance tracking, and financial payouts through an intuitive, real-time interface.

---

## 🌟 Core Features

### 📸 Mandatory Face Identification
Never lose track of who is on-site. Every worker registration requires a **live photo**, securely stored on Cloudinary. This photo follows the worker through every aspect of the app—from the attendance card to the final payout confirmation.

### 🔍 Instant QR Attendance
Ditch the paperwork. Every worker has a unique ID that can be scanned via the **integrated QR scanner**. One scan marks them present, calculates their daily wage, and timestamps their entry.

### 💰 Dynamic Financial Tracking
- **Real-time Balance**: Instantly see a worker's total pending balance (Total Earned - Total Paid).
- **Flexible Payouts**: Support for Daily, Weekly, and Monthly payroll cycles.
- **Advance Management**: Deduct advances or add bonuses directly during attendance marking.

### 📍 Multi-Site Management
Effortlessly manage multiple construction projects. Switch between sites and track exactly how many laborers are present at each location today.

---

## 📁 Project Structure

```text
WageMate/
├── backend-server/     # Node.js, Express, MongoDB, Cloudinary API
├── mobile-app/         # React Native (Expo) - iOS & Android
└── db_export/          # Database backups & Seed data
```

---

## 🚀 Getting Started

### 1️⃣ Backend Setup
```bash
cd backend-server
npm install
```
- Copy `.env.example` to `.env`.
- Add your `MONGO_URI` and `CLOUDINARY` credentials.
- `npm start` to launch the API on Port 5000.

### 2️⃣ Mobile App Setup
```bash
cd mobile-app
npm install
```
- Copy `.env.example` to `.env`.
- Update your local IP address for physical device testing.
- `npx expo start` to launch the Metro Bundler.

---

## 🛠️ Tech Stack

- **Frontend**: React Native, Expo, React Navigation, Axios.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Mongoose ODM).
- **Storage**: Cloudinary (Image Hosting).
- **Auth**: JWT (JSON Web Tokens).

---

## 💾 Data Backup & Restore

Initial worker data and site configurations are stored in the `/db_export` directory. To import this into your local MongoDB:

```bash
mongoimport --db wagemate --collection workers --file db_export/workers.json --jsonArray
mongoimport --db wagemate --collection sites --file db_export/sites.json --jsonArray
```

---

## 🛡️ License
This project is built for professional construction management. Contact the developer for licensing details.

---
*Developed with ❤️ for precision and efficiency in the construction industry.*
