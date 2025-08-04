# Flomo CLI

Python API library and command-line tool for [Flomo](https://flomoapp.com) (浮墨).

**[中文](#中文) | [English](#english)**

<a name="中文"></a>
## 简介

flomo-cli 是一个非官方的 Flomo Python API 库和命令行工具，让你能够通过代码或命令行管理你的备忘录。**特别适合将你的知识库导出给 AI 大模型进行深度分析。**

## ✨ 核心特性

- 🤖 **AI 分析友好** - 专为导出数据给大模型分析而优化，支持极简格式输出
- 🐍 **Python API** - 完整的 Python 接口，轻松集成到你的项目
- 🖥️ **强大的 CLI** - 功能丰富的命令行工具，支持列表、搜索、导出等操作
- 📊 **多格式导出** - 支持 JSON、Markdown、表格和极简格式
- 🔍 **全文搜索** - 快速定位你需要的备忘录
- ⚡ **高性能** - 批量获取，智能分页
- 🎯 **灵活排序** - 支持按创建/更新时间升序或降序排列

## 📦 安装

```bash
# 从源码安装（推荐）
git clone https://github.com/Benature/flomo.git
cd flomo/flomo-cli
pip install -r ../requirements.txt
python ../setup.py install
```

**系统要求**: Python 3.7+

## 🚀 快速开始

### 1. 获取 Token

1. 在浏览器中登录 [flomo](https://flomoapp.com)
2. 打开开发者工具（F12）→ Network 标签
3. 刷新页面，找到任意 API 请求（如 `/api/v1/memo/updated/`）
4. 在请求头中复制 `Authorization` 字段的完整值（包含 `Bearer` 前缀）

### 2. 配置认证

```bash
# 推荐：使用配置命令
flomo config --token "Bearer your_token_here"

# 或使用环境变量
export FLOMO_AUTHORIZATION="Bearer your_token_here"
```

### 3. 开始使用

```bash
# 查看最近的备忘录
flomo list -l 10 -f table

# 搜索特定内容
flomo search "Python" -f markdown

# 导出所有备忘录
flomo list -f markdown -o my_memos.md
```

## 📖 详细使用指南

### 命令行工具

#### 列出备忘录

```bash
# 基础用法
flomo list                          # 默认 JSON 格式输出
flomo list -f table                 # 表格格式显示
flomo list -f markdown              # Markdown 格式
flomo list -l 20                    # 限制显示 20 条

# 高级用法
flomo list --order-by created_at --order-dir asc    # 按创建时间升序
flomo list --order-by updated_at --order-dir desc   # 按更新时间降序
flomo list --min -f markdown                         # 极简格式（适合 AI 处理）
flomo list --no-meta                                 # 不包含元数据
flomo list --url none                                # 不显示 URL

# 导出到文件
flomo list -f markdown -o backup.md -q               # 静默导出
```

#### 搜索备忘录

```bash
# 基础搜索
flomo search "关键词"
flomo search "Python" -l 10 -f table

# 高级搜索
flomo search "工作" -f markdown --min | grep "2024"  # 结合 shell 命令
```

#### 参数说明

| 参数 | 说明 | 可选值 |
|------|------|--------|
| `-f, --format` | 输出格式 | `json`, `table`, `markdown` |
| `-l, --limit` | 限制数量 | 正整数 |
| `-o, --output` | 输出文件 | 文件路径 |
| `-q, --quiet` | 静默模式 | - |
| `--url` | URL 显示方式 | `full`, `id`, `none` |
| `--no-meta` | 不含元数据 | - |
| `--min` | 极简模式 | - |
| `--order-by` | 排序字段 | `created_at`, `updated_at` |
| `--order-dir` | 排序方向 | `asc`, `desc` |

### Python API

```python
from flomo import Flomo, Parser

# 初始化客户端
flomo = Flomo("Bearer your_token_here")

# 获取所有备忘录
memos = flomo.get_all_memos()
print(f"Total memos: {len(memos)}")

# 解析备忘录
for memo_data in memos[:5]:
    memo = Parser(memo_data)
    print(f"Content: {memo.text}")
    print(f"URL: {memo.url}")
    print(f"Tags: {memo.tags}")
    print(f"Created: {memo.created_at}")
    print("-" * 50)
```

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

## 🔧 开发指南

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/Benature/flomo.git
cd flomo

# 安装依赖
make prepare

# 本地安装
make all

# 运行测试
python main_simple.py
```

### 构建命令

```bash
make clean      # 清理构建文件
make uninstall  # 卸载包
make all        # 完整构建流程
make upload     # 上传到 PyPI
```

## 🔗 相关项目

- [flomo-workflow](https://github.com/Benature/flomo-workflow) - Alfred Workflow
- [flomo-api-helper](https://github.com/geekdada/flomo-api-helper) - Node.js 版本

## 🙏 致谢

- **[Benature](https://github.com/Benature)** - 原项目作者，提供了优秀的基础代码和架构设计
- **[flomo 团队](https://flomoapp.com)** - 感谢提供如此优秀的笔记产品

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENCE](../LICENCE) 文件

---

<a name="english"></a>
## Introduction

flomo-cli is an unofficial Python API library and command-line tool for [flomo](https://flomoapp.com), enabling you to manage your memos through code or command line. **Especially suitable for exporting your knowledge base to AI/LLMs for deep analysis.**

## ✨ Key Features

- 🤖 **AI-Friendly Export** - Optimized for feeding data to LLMs with minimal format support
- 🐍 **Python API** - Complete Python interface for easy integration
- 🖥️ **Powerful CLI** - Feature-rich command-line tool with list, search, and export
- 📊 **Multi-format Export** - Support for JSON, Markdown, table, and minimal formats
- 🔍 **Full-text Search** - Quickly locate the memos you need
- ⚡ **High Performance** - Batch fetching with intelligent pagination
- 🎯 **Flexible Sorting** - Sort by creation/update time in ascending or descending order

## 📦 Installation

```bash
# Install from source (recommended)
git clone https://github.com/Benature/flomo.git
cd flomo/flomo-cli
pip install -r ../requirements.txt
python ../setup.py install
```

**Requirements**: Python 3.7+

See the Chinese documentation above for detailed usage instructions.