# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Flomo is an unofficial Python API library and CLI tool for interacting with the Flomo (浮墨) note-taking service. It provides programmatic access to fetch, parse, and export Flomo memos.

This repository also contains **Flomo Garden** (in `/flomo-garden/`), a Tauri-based desktop application built with React and TypeScript that provides a beautiful GUI for managing Flomo notes.

## Development Commands

### Build and Install
```bash
# Install dependencies
make prepare

# Build and install locally (uninstalls, cleans, builds, and reinstalls)
make all

# Clean build artifacts
make clean

# Uninstall the package
make uninstall

# Upload to PyPI
make upload
```

### Testing and Running
```bash
# Install from PyPI
pip install -U flomo

# Run CLI
flomo --help
flomo list
flomo search <keyword>
flomo config <token>

# Run example script
python main_simple.py
```

## Architecture

### Core Components

1. **`flomo/__init__.py`** - Main library containing:
   - `Flomo` class: API client using Bearer token authentication
   - `Parser` class: Converts HTML memos to text/markdown
   - `notify()` function: Cross-platform notifications

2. **`flomo/cli.py`** - Command-line interface with commands:
   - `list`: Export memos in various formats (json, markdown, table, minimal)
   - `search`: Search memos by keyword
   - `config`: Manage authentication tokens

### Key Design Patterns

- **Authentication**: Bearer token stored in `~/.flomo/config.json` or `FLOMO_AUTHORIZATION` env var
- **API Endpoint**: Uses `/api/v1/memo/updated/` with pagination and MD5 signature
- **Content Parsing**: HTML → Markdown conversion using html2text library
- **Output Formats**: Flexible formatting system for different use cases (AI feeding, archiving, viewing)

### Important Notes

- Version is managed in `flomo/__init__.py` as `__version__`
- Main branch for PRs is `dev`, not `main`
- Package name on PyPI is `flomo`
- Python 3.7+ required
- Dependencies: requests, bs4, html2text, twine

## Flomo Garden Desktop App

Located in `/flomo-garden/` subdirectory. See `/flomo-garden/CLAUDE.md` for detailed information about the desktop application.

### Quick Start
```bash
cd flomo-garden
pnpm install
pnpm tauri dev
```

### Key Features
- Local SQLite database for offline access
- Data synchronization from Flomo API
- Export with customizable date formats
- Code Inspector support for development
- Two-column export preview interface