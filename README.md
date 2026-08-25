# AttendIt - Smart Attendance Management System

AttendIt is a full-stack automated attendance tracking and anti-proxy verification platform designed for universities and academic institutions. The system enables faculty to launch live lecture sessions with rotating dynamic QR codes and allows students to record verified attendance seamlessly using their mobile device camera or web browser.

---

## Tech Stack Overview

### Frontend
- **Framework**: React 19 (Functional Components & Hooks)
- **Language**: TypeScript 5.8
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Icons**: Lucide React (`lucide-react`)
- **Animation**: Motion (`motion/react`)
- **QR Scanner**: `jsqr` (Real-time HTML5 Camera video stream canvas frame decoding)
- **Typography**: Plus Jakarta Sans (body & metrics) paired with Playfair Display (editorial serif display headings)

### Backend & Server
- **Runtime**: Node.js (v18+)
- **Server Framework**: Express 4.x
- **Development Execution**: `tsx` (TypeScript execute with automatic hot reloading)
- **Production Bundler**: `esbuild` (Compiles server into standalone CommonJS executable)
- **Real-Time Engine**: `Socket.io` (v4.8) for live WebSocket attendance broadcasting and synchronizing student rosters
- **QR Code Generation**: `qrcode` (Dynamic cryptographic payload rendering)

### Authentication & Security
- **Tokens**: JSON Web Tokens (`jsonwebtoken`)
- **Password Security**: `bcryptjs` salted hashing
- **Anti-Proxy Security**:
  - Rotating 15-second dynamic QR code expiration windows
  - One-time-use cryptographic session verification
  - Timestamp-drift validation and duplicate submission prevention

### Database & Storage Architecture
- Structured in-memory and file-persisted JSON data stores for:
  - User Accounts (Faculty and Students)
  - Departments, Branches, Divisions, Semesters, and Subjects
  - Academic Timetable & Scheduling
  - Live Active Sessions and Historical Attendance Logs
  - Low Attendance Parent Notice Records

---

## How to Run on Your Local Computer (VS Code)

Follow these steps to set up and run the application locally on your computer using Visual Studio Code.

### Step 1: Prerequisites
Ensure you have the following installed on your machine:
1. **Node.js**: Version 18.0.0 or higher ([Download Node.js](https://nodejs.org/))
2. **npm**: Comes bundled with Node.js (Verify with `node -v` and `npm -v`)
3. **VS Code**: Visual Studio Code editor ([Download VS Code](https://code.visualstudio.com/))

---

### Step 2: Open Project in VS Code
1. Open Visual Studio Code.
2. Select **File > Open Folder...** and choose the project root folder.
3. Open the integrated terminal in VS Code using the shortcut:
   - **Windows / Linux**: `Ctrl + ` ` (Backtick)
   - **macOS**: `Cmd + ` ` (Backtick)

---

### Step 3: Install Dependencies
In the VS Code terminal, execute:

```bash
npm install
```

This will automatically install all required frontend and backend packages:
- `express`, `socket.io`, `socket.io-client`, `jsonwebtoken`, `bcryptjs`, `qrcode`
- `react`, `react-dom`, `lucide-react`, `motion`, `jsqr`
- `vite`, `@tailwindcss/vite`, `tsx`, `esbuild`, `typescript`, `@types/node`

---

### Step 4: Configure Environment Variables (Optional)
The project comes pre-configured with safe defaults. If you wish to customize port or JWT secrets, create a `.env` file in the root directory:

```env
PORT=3000
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

---

### Step 5: Start the Development Server
Run the development command in the terminal:

```bash
npm run dev
```

The Express backend and Vite frontend will boot together on **Port 3000**:
- **Local Application URL**: `http://localhost:3000`

Open your web browser (Chrome, Firefox, Safari, or Edge) and navigate to:
```
http://localhost:3000
```

---

## Production Build & Standalone Run

To verify and test production deployment locally:

1. **Build the Application**:
   ```bash
   npm run build
   ```
   *This compiles the Vite frontend into `dist/` and bundles `server.ts` into `dist/server.cjs` via `esbuild`.*

2. **Start the Production Server**:
   ```bash
   npm start
   ```

---

## Demo User Accounts

You can log in immediately using any of the following pre-configured test profiles or use the **1-Click Test Login** buttons in the authentication modal:

### Faculty / Teacher Account
- **Email**: `anjali.sharma@attendit.edu`
- **Password**: `teacher123`
- **Role**: Professor / Faculty (Computer Science & Engineering)

### Student Accounts
- **Student 1**:
  - **Email / Roll No**: `aditya.verma.001@attendit.edu` or `22CS001`
  - **Password**: `student123`
  - **Class**: CSE-A (Semester 4)
- **Student 2**:
  - **Email / Roll No**: `sneha.patil.002@attendit.edu` or `22CS002`
  - **Password**: `student123`
  - **Class**: CSE-A (Semester 4)
- **Student 3**:
  - **Email / Roll No**: `vikram.patel.009@attendit.edu` or `22CS009`
  - **Password**: `student123`
  - **Class**: CSE-B (Semester 4)

---

## Project Directory Structure

```
├── src/
│   ├── components/
│   │   ├── ClassesManagement.tsx     # Timetable, branch, division, semester management
│   │   ├── Dashboard.tsx             # Faculty dashboard with lectures and low attendance alerts
│   │   ├── LandingPage.tsx           # Entry portal & authentication modal
│   │   ├── LiveAttendanceDashboard.tsx # Active session dynamic QR display & real-time roster
│   │   ├── Navbar.tsx                # Navigation bar with user switcher and role indicator
│   │   └── StudentDashboard.tsx      # Student portal with camera QR scanner & status
│   ├── types.ts                      # Shared TypeScript data models and interfaces
│   ├── App.tsx                       # Main application state and routing controller
│   ├── index.css                     # Tailwind CSS v4 styling rules and typography
│   └── main.tsx                      # React root rendering entry point
├── server.ts                         # Express server, Socket.io, auth APIs & session engine
├── vite.config.ts                    # Vite configuration with Tailwind CSS integration
├── package.json                      # Scripts and npm dependencies
└── README.md                         # Project documentation and run guide
```

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts development server with hot-reloading (`tsx server.ts`) on port 3000 |
| `npm run build` | Builds frontend with Vite and packages backend with esbuild into `dist/` |
| `npm start` | Runs the compiled production server (`node dist/server.cjs`) |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) |
