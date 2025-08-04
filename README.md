<a href="https://flomoapp.com/"><img src="https://raw.githubusercontent.com/Benature/flomo/main/flomo/media/logo-192x192.png" height="100" align="right"></a>

# Open Flomo

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

## 💡 实际应用场景

### 🤖 AI/大模型分析（推荐）

将你的 flomo 知识库导出并喂给 AI 进行深度分析，发现隐藏的思维模式和知识关联：

```bash
# 方案1：导出所有备忘录给 AI 分析（极简格式，节省 token）
flomo list --min -f markdown -o my_knowledge.md
# 然后将 my_knowledge.md 内容复制给 ChatGPT/Claude 等大模型

# 方案2：导出特定主题进行专项分析
flomo search "学习方法" --min -f markdown | pbcopy  # macOS
flomo search "投资思考" --min -f markdown | xclip   # Linux

# 方案3：导出最近的思考进行回顾分析
flomo list -l 100 --min -f markdown --order-by created_at --order-dir desc
```

**AI 分析提示词示例**：
```
请分析我的这些 flomo 笔记，帮我：
1. 总结主要的思考主题和关注领域
2. 发现潜在的思维模式和认知偏好
3. 找出重复出现的概念和想法
4. 提供改进建议和深入思考的方向
5. 生成一份个人知识图谱

[粘贴导出的 flomo 内容]
```

**高级用法 - Python 脚本自动化分析**：
```python
from flomo import Flomo, Parser
import openai  # 或其他 AI SDK

# 获取 flomo 数据
flomo = Flomo("Bearer your_token")
memos = flomo.get_all_memos()

# 准备数据给 AI
knowledge_base = []
for memo_data in memos[:500]:  # 最近 500 条
    memo = Parser(memo_data)
    knowledge_base.append(f"{memo.created_at}: {memo.text}")

# 调用 AI API 进行分析
prompt = f"分析以下知识库内容：\n\n" + "\n".join(knowledge_base)
# ... AI API 调用代码
```

### 定期备份

```bash
# 每日备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d)
flomo list -f markdown -o "backup/flomo_$DATE.md" -q
echo "Backup completed: flomo_$DATE.md"
```

### 周报生成

```python
from datetime import datetime, timedelta
from flomo import Flomo, Parser

flomo = Flomo("Bearer your_token")
memos = flomo.get_all_memos()

# 筛选本周的工作相关备忘录
week_ago = datetime.now() - timedelta(days=7)
work_memos = []

for memo_data in memos:
    memo = Parser(memo_data)
    created = datetime.fromisoformat(memo.created_at.replace(' ', 'T'))
    if created > week_ago and "工作" in memo.text:
        work_memos.append(memo)

# 生成周报
print(f"本周工作备忘录 ({len(work_memos)} 条)")
for memo in work_memos:
    print(f"- {memo.created_at}: {memo.text[:50]}...")
```


## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see [LICENCE](LICENCE) file for details
