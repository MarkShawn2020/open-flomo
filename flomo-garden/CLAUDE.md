# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Flomo Garden is a Tauri-based desktop application built with React and TypeScript. It combines a Rust backend with a React frontend to create a cross-platform desktop application.

## Development Commands

### Frontend Development
```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build frontend
pnpm build

# Preview production build
pnpm preview
```

### Tauri Development
```bash
# Run the full Tauri application in development mode
pnpm tauri dev

# Build the Tauri application for production
pnpm tauri build

# Run other Tauri commands
pnpm tauri [command]
```

### TypeScript
```bash
# Type checking is done automatically during build
pnpm build
```

## Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Rust with Tauri v2
- **Package Manager**: pnpm

### Project Structure
- `/src/` - React frontend source code
  - `App.tsx` - Main React component
  - `main.tsx` - Application entry point
- `/src-tauri/` - Rust backend source code
  - `src/lib.rs` - Tauri command handlers and app initialization
  - `src/main.rs` - Application entry point
  - `tauri.conf.json` - Tauri configuration
- `/dist/` - Built frontend assets (generated)

### Key Configuration
- **App Identifier**: `dev.neurora.flomo-garden`
- **Frontend Dev Server**: http://localhost:1420
- **Tauri Commands**: Defined in `src-tauri/src/lib.rs` using `#[tauri::command]`
- **Frontend-Backend Communication**: Uses `@tauri-apps/api/core` invoke function

### Important Notes
- The project uses strict TypeScript settings with no unused locals/parameters allowed
- The Rust library is named `flomo_garden_lib` to avoid Windows naming conflicts
- Tauri plugin `tauri-plugin-opener` is included for opening external links
- API authentication uses MD5 hashing for signature generation (matching Flomo's requirements)
- Debug logging is enabled in development mode - check console output for API troubleshooting