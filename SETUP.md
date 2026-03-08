# Gomoku Multiplayer - Setup Guide

Welcome to the Gomoku Multiplayer project! This guide will help you set up and run the project locally.

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: For source control

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd gomoku-multiplayer
```

### 2. Install Dependencies

You need to install dependencies for both the backend and frontend.

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Configuration

Copy the example environment files and update them if necessary.

```bash
# Backend config
cd backend
cp .env.example .env

# Frontend config
cd ../frontend
cp .env.example .env
```

Default values are usually sufficient for local development.

### 4. Running the Project

You can start both the backend and frontend using the provided development script:

```bash
# From the project root
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh
```

Alternatively, you can start them separately:

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:5000`.

## Project Structure

- `backend/`: Node.js + Express + Socket.IO server.
- `frontend/`: Vue 3 + Vite + Tailwind CSS application.
- `shared/`: TypeScript types and constants shared between frontend and backend.
- `docs/`: Design documents and API references.

## Development Commands

### Backend
- `npm run dev`: Start development server with watch mode.
- `npm run build`: Compile TypeScript to JavaScript.
- `npm run lint`: Run ESLint to find and fix code style issues.

### Frontend
- `npm run dev`: Start Vite development server.
- `npm run build`: Build for production.
- `npm run lint`: Run ESLint.
- `npm run format`: Format code with Prettier.

## Troubleshooting

If you encounter TypeScript errors during build, ensure that the `shared/` directory is correctly referenced in the `tsconfig.json` of both backend and frontend.

For WebSocket issues, ensure the `CORS_ORIGIN` in backend `.env` matches your frontend URL.
