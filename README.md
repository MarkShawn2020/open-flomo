<a href="https://flomoapp.com/"><img src="https://raw.githubusercontent.com/Benature/flomo/main/flomo/media/logo-192x192.png" height="100" align="right"></a>

# flomo 浮墨

[![PyPI](https://img.shields.io/pypi/v/flomo)](https://pypi.org/project/flomo/)
![PyPI - Python Version](https://img.shields.io/pypi/pyversions/flomo)
[![GitHub stars](https://img.shields.io/github/stars/Benature/flomo)](https://github.com/Benature/flomo)

一个非官方的 API python 库 + 命令行工具 👀

> *需要 python3.7+*  
> 欢迎 Star 🌟、Fork 🍴、Issue 💬、PR. 一起让 flomo 用的更加得心应手

最新版在 dev 分支

## 功能特性

- 📚 **Python API 库**：方便集成到你的 Python 项目中
- 🖥️ **命令行工具**：快速查看、搜索、导出备忘录
- 📁 **多种导出格式**：JSON、Markdown、表格、极简格式
- 🔍 **全文搜索**：快速找到需要的备忘录
- 🎨 **灵活配置**：支持环境变量和配置文件

## 安装

```shell
pip install -U flomo
```

## 获取 Token

1. 在浏览器中登录 [flomo](https://flomoapp.com)
2. 打开开发者工具（F12）
3. 切换到 Network（网络）标签
4. 刷新页面或进行任意操作
5. 找到任意 API 请求（如 `/api/v1/memo/updated/`）
6. 在请求头中找到 `Authorization` 字段，复制整个值（包含 `Bearer` 前缀）

## 使用方法

### 命令行工具

#### 1. 配置认证

```bash
# 方式1：使用配置命令（推荐）
flomo config --token "Bearer xxxxxxxxxxx"

# 方式2：使用环境变量
export FLOMO_AUTHORIZATION="Bearer xxxxxxxxxxx"

# 查看当前配置
flomo config --show
```

#### 2. 列出备忘录

```bash
# 列出所有备忘录（JSON 格式）
flomo list

# 以表格形式展示
flomo list -f table

# 导出为 Markdown
flomo list -f markdown -o my_memos.md

# 只导出最近 10 条
flomo list -l 10

# 极简格式（适合喂给 AI）
flomo list --min -f markdown

# 按更新时间升序排列（旧到新）
flomo list --order-by updated_at --order-dir asc

# 按创建时间降序排列最新10条（默认行为）
flomo list -l 10 --order-by created_at --order-dir desc
```

#### 3. 搜索备忘录

```bash
# 搜索包含关键词的备忘录
flomo search "python"

# 限制搜索结果数量
flomo search "学习笔记" -l 5 -f table
```

#### 4. 高级选项

- `-f, --format`: 输出格式（json/table/markdown）
- `-l, --limit`: 限制返回数量
- `-o, --output`: 导出到文件
- `-q, --quiet`: 安静模式，不显示进度
- `--url`: URL 显示方式（full/id/none）
- `--no-meta`: 不包含元数据
- `--min`: 极简输出模式
- `--order-by`: 排序字段（created_at/updated_at，默认：created_at）
- `--order-dir`: 排序方向（asc/desc，默认：desc）

### Python API

```python
from flomo import Flomo, Parser

# 初始化客户端
authorization = "Bearer xxxxxxxxxxx"
flomo = Flomo(authorization)

# 获取所有备忘录
memos = flomo.get_all_memos()

# 解析单条备忘录
memo = Parser(memos[-1])
print(memo.text)       # 纯文本内容
print(memo.url)        # 备忘录链接
print(memo.tags)       # 标签列表
print(memo.created_at) # 创建时间
```

## 实际应用示例

### 1. 定期备份

```bash
# 每天备份到带日期的文件
flomo list -f markdown -o "flomo_backup_$(date +%Y%m%d).md"
```

### 2. 导出特定内容给 AI 分析

```bash
# 搜索学习相关内容，极简格式输出
flomo search "学习" --min -f markdown | pbcopy  # macOS
flomo search "学习" --min -f markdown | xclip   # Linux
```

### 3. 生成周报素材

```bash
# 导出最近 7 天的工作相关备忘录
flomo search "工作" -f markdown | grep -A 2 "2024-01"
```

## Local Install 本地安装

```shell
git clone https://github.com/Benature/flomo.git
make all
```


## Relative Project 相关项目

- workflow: [Benature/flomo workflow](https://github.com/Benature/flomo-workflow)
- npm: [geekdada/flomo api helper](https://github.com/geekdada/flomo-api-helper)
