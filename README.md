<a href="https://flomoapp.com/"><img src="https://raw.githubusercontent.com/Benature/flomo/main/flomo/media/logo-192x192.png" height="100" align="right"></a>

# Flomo

[![Python Version](https://img.shields.io/badge/python-3.7+-blue.svg)](https://www.python.org/downloads/)
[![License](https://img.shields.io/github/license/Benature/flomo)](https://github.com/Benature/flomo/blob/main/LICENCE)
[![GitHub stars](https://img.shields.io/github/stars/Benature/flomo)](https://github.com/Benature/flomo)

Unofficial [Flomo](https://flomoapp.com) (浮墨) client with both CLI and desktop versions for managing your memos.

## 📦 Versions

### [🖥️ CLI Version](./flomo-cli/)
Python-based command-line tool and API library
- Export memos in multiple formats (JSON, Markdown, Table)
- Full-text search capabilities
- Python API for integration
- AI-friendly export formats

### [🎨 Desktop Version](./flomo-ui/)
Cross-platform desktop application built with Tauri
- Modern UI with dark mode support
- Local SQLite database for offline access
- Data synchronization with Flomo API
- Advanced export with preview

## 🚀 Quick Start

### CLI Version
```bash
# Install
cd flomo-cli
pip install -r requirements.txt
python setup.py install

# Usage
flomo config --token "Bearer your_token"
flomo list -f markdown
flomo search "keyword"
```

### Desktop Version
```bash
# Development
cd flomo-ui
pnpm install
pnpm tauri dev

# Build
pnpm tauri build
```

## 📖 Documentation

- [CLI Documentation](./flomo-cli/README.md) - Detailed CLI usage and API reference
- [Desktop Documentation](./flomo-ui/README.md) - Desktop app features and development guide
- [中文文档](./flomo-cli/README.md#中文) - Chinese documentation

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see [LICENCE](LICENCE) file for details

---

> 💡 Based on [Benature/flomo](https://github.com/Benature/flomo) with enhanced features