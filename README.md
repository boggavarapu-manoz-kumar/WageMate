# WageMate: Construction Workforce Management

WageMate is a specialized mobile application designed for construction site owners to manage their workforce, track attendance via QR codes, and handle payouts seamlessly.

## Project Structure
- **/backend-server**: Node.js & Express API with MongoDB.
- **/mobile-app**: React Native & Expo mobile application.
- **/db_export**: JSON exports of the initial database structure and sample data.

## Getting Started

### 1. Backend Setup
1. CD into `backend-server`.
2. Run `npm install`.
3. Create a `.env` file based on `.env.example`.
4. Run `npm start`.

### 2. Mobile App Setup
1. CD into `mobile-app`.
2. Run `npm install`.
3. Create a `.env` file based on `.env.example`.
4. Run `npx expo start`.

## Features
- **QR Scanner**: Quickly mark attendance by scanning worker IDs.
- **Worker Management**: Register workers with mandatory photo identification (Cloudinary).
- **Attendance History**: detailed logs of where and when workers were present.
- **Financial Tracking**: Automatic calculation of daily wages and pending balances.
- **Project Specific**: Assign attendance records to specific construction sites.

## Database Export
You can find the database data in the `/db_export` folder. To import:
`mongoimport --db wagemate --collection workers --file db_export/workers.json`
`mongoimport --db wagemate --collection sites --file db_export/sites.json`
