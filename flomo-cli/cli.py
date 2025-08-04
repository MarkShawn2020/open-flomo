#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import json
import os
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional

try:
    from . import Flomo, Parser
except ImportError:
    from __init__ import Flomo, Parser


class FlomoConfig:
    """配置管理类"""
    
    def __init__(self):
        self.config_dir = Path.home() / '.flomo'
        self.config_file = self.config_dir / 'config.json'
        self.config = self._load_config()
    
    def _load_config(self) -> Dict[str, Any]:
        """加载配置文件"""
        if self.config_file.exists():
            try:
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                return {}
        return {}
    
    def save_config(self) -> None:
        """保存配置文件"""
        self.config_dir.mkdir(exist_ok=True)
        with open(self.config_file, 'w', encoding='utf-8') as f:
            json.dump(self.config, f, ensure_ascii=False, indent=2)
    
    def get_token(self) -> Optional[str]:
        """获取认证token"""
        # 优先从环境变量获取
        token = os.environ.get('FLOMO_AUTHORIZATION')
        if token:
            return token
        
        # 从配置文件获取
        return self.config.get('authorization')
    
    def set_token(self, token: str) -> None:
        """设置认证token"""
        self.config['authorization'] = token
        self.save_config()


class FlomoFormatter:
    """输出格式化类"""
    
    @staticmethod
    def format_json(memos: List[Dict[str, Any]], pretty: bool = True) -> str:
        """JSON格式输出"""
        if pretty:
            return json.dumps(memos, ensure_ascii=False, indent=2)
        return json.dumps(memos, ensure_ascii=False, separators=(',', ':'))
    
    @staticmethod
    def format_table(memos: List[Dict[str, Any]]) -> str:
        """表格格式输出"""
        if not memos:
            return "没有找到备忘录"
        
        lines = []
        lines.append("序号 | 创建时间          | 内容预览")
        lines.append("-" * 50)
        
        for memo in memos:
            content_preview = memo['content'].strip().replace('\n', ' ')[:30]
            if len(content_preview) > 30:
                content_preview += "..."
            
            created_at = memo.get('created_at', '').split(' ')[0]  # 只显示日期
            lines.append(f"{memo['index']:2d}   | {created_at:17s} | {content_preview}")
        
        return '\n'.join(lines)
    
    @staticmethod
    def format_markdown(memos: List[Dict[str, Any]], url_mode: str = 'full', 
                       include_meta: bool = True, minimal: bool = False) -> str:
        """Markdown格式输出"""
        if not memos:
            return "没有找到备忘录"
        
        lines = []
        
        if not minimal:
            lines.append("# Flomo 备忘录")
            lines.append("")
        
        for memo in memos:
            if minimal:
                # 最小化模式：一行一条memo，格式为 "序号|日期|内容"
                date = memo.get('created_at', '').split(' ')[0]  # 只要日期部分
                content = memo['content'].strip().replace('\n', ' ')  # 压缩换行为空格
                lines.append(f"{memo['index']}|{date}|{content}")
            else:
                # 标题处理
                if include_meta:
                    # 包含元数据
                    lines.append(f"## {memo['index']}. {memo.get('created_at', '')}")
                else:
                    # 不包含元数据
                    lines.append(f"## {memo['index']}")
                
                lines.append("")
                lines.append(memo['content'].strip())
                
                # URL处理
                if url_mode == 'full':
                    lines.append(f"**链接**: {memo['url']}")
                elif url_mode == 'id':
                    lines.append(f"**ID**: {memo['slug']}")
                # url_mode == 'none' 时不添加任何URL信息
                
                # 标签处理
                if memo.get('tags'):
                    lines.append(f"**标签**: {', '.join(memo['tags'])}")
                
                # 分隔符
                lines.append("")
                lines.append("---")
                lines.append("")
        
        return '\n'.join(lines)


class FlomoCLI:
    """Flomo命令行工具主类"""
    
    def __init__(self):
        self.config = FlomoConfig()
        self.formatter = FlomoFormatter()
    
    def _get_flomo_client(self) -> Flomo:
        """获取Flomo客户端实例"""
        token = self.config.get_token()
        if not token:
            print("错误: 未找到认证token")
            print("请使用以下方式之一设置token:")
            print("1. 环境变量: export FLOMO_AUTHORIZATION='your_token'")
            print("2. 配置命令: flomo config --token 'your_token'")
            sys.exit(1)
        
        # 自动添加Bearer前缀
        if not token.startswith('Bearer '):
            token = f"Bearer {token}"
        
        return Flomo(token)
    
    def _parse_memos(self, memos: List[Dict], limit: Optional[int] = None, 
                    include_meta: bool = True, minimal: bool = False) -> List[Dict[str, Any]]:
        """解析备忘录数据"""
        if limit:
            memos = memos[:limit]
        
        parsed_memos = []
        for i, memo_data in enumerate(memos):
            memo = Parser(memo_data)
            memo_info = {
                "index": i + 1,
                "content": memo.text,
                "url": memo.url,
                "slug": getattr(memo, 'slug', '')
            }
            
            # 最小化模式总是包含日期（用于一行格式）
            if minimal or include_meta:
                memo_info["created_at"] = getattr(memo, 'created_at', '')
            
            # 根据参数决定是否包含额外信息
            if not minimal:
                memo_info["tags"] = getattr(memo, 'tags', [])
                
                if include_meta:
                    memo_info["updated_at"] = getattr(memo, 'updated_at', '')
            
            parsed_memos.append(memo_info)
        
        return parsed_memos
    
    def cmd_list(self, args) -> None:
        """列出备忘录"""
        flomo = self._get_flomo_client()
        
        try:
            if not args.quiet:
                print("正在获取备忘录...", file=sys.stderr)
            
            memos = flomo.get_all_memos()
            
            if not args.quiet:
                print(f"共获取到 {len(memos)} 条备忘录", file=sys.stderr)
            
            if not memos:
                print("没有找到备忘录")
                return
            
            # 根据参数对备忘录进行排序
            order_by = args.order_by if hasattr(args, 'order_by') else 'created_at'
            order_dir = args.order_dir if hasattr(args, 'order_dir') else 'desc'
            
            # 使用排序键函数，处理可能缺失的字段
            def get_sort_key(memo):
                value = memo.get(order_by, '')
                # 如果是时间字段且值存在，返回时间值；否则返回空字符串
                return value if value else ''
            
            memos.sort(key=get_sort_key, reverse=(order_dir == 'desc'))
            
            parsed_memos = self._parse_memos(memos, args.limit, 
                                           not args.no_meta, args.min)
            
            # 格式化输出
            if args.format == 'json':
                output = self.formatter.format_json(parsed_memos, not args.compact)
            elif args.format == 'table':
                output = self.formatter.format_table(parsed_memos)
            elif args.format == 'markdown':
                output = self.formatter.format_markdown(parsed_memos, args.url, 
                                                      not args.no_meta, args.min)
            else:
                output = self.formatter.format_json(parsed_memos, not args.compact)
            
            # 输出到文件或标准输出
            if args.output:
                output_path = Path(args.output)
                output_path.parent.mkdir(parents=True, exist_ok=True)
                
                with open(output_path, 'w', encoding='utf-8') as f:
                    f.write(output)
                
                if not args.quiet:
                    print(f"已导出到文件: {output_path.absolute()}", file=sys.stderr)
                    print(f"导出格式: {args.format}", file=sys.stderr)
                    print(f"备忘录数量: {len(parsed_memos)}", file=sys.stderr)
            else:
                print(output)
            
        except Exception as e:
            print(f"错误: {e}", file=sys.stderr)
            sys.exit(1)
    
    def cmd_config(self, args) -> None:
        """配置管理"""
        if args.token:
            self.config.set_token(args.token)
            print("认证token已保存")
        elif args.show:
            token = self.config.get_token()
            if token:
                # 只显示前几位和后几位，中间用*遮蔽
                masked_token = token[:10] + "*" * (len(token) - 20) + token[-10:] if len(token) > 20 else token
                print(f"当前token: {masked_token}")
            else:
                print("未设置token")
        else:
            print("请使用 --token 设置token 或 --show 查看当前配置")
    
    def cmd_search(self, args) -> None:
        """搜索备忘录"""
        flomo = self._get_flomo_client()
        
        try:
            if not args.quiet:
                print(f"正在搜索包含 '{args.query}' 的备忘录...", file=sys.stderr)
            
            memos = flomo.get_all_memos()
            
            # 过滤包含搜索关键词的备忘录
            filtered_memos = []
            for memo in memos:
                parser = Parser(memo)
                if args.query.lower() in parser.text.lower():
                    filtered_memos.append(memo)
            
            if not args.quiet:
                print(f"找到 {len(filtered_memos)} 条匹配的备忘录", file=sys.stderr)
            
            if not filtered_memos:
                print("没有找到匹配的备忘录")
                return
            
            parsed_memos = self._parse_memos(filtered_memos, args.limit)
            
            # 格式化输出
            if args.format == 'json':
                output = self.formatter.format_json(parsed_memos, not args.compact)
            elif args.format == 'table':
                output = self.formatter.format_table(parsed_memos)
            elif args.format == 'markdown':
                output = self.formatter.format_markdown(parsed_memos)
            else:
                output = self.formatter.format_json(parsed_memos, not args.compact)
            
            print(output)
            
        except Exception as e:
            print(f"错误: {e}", file=sys.stderr)
            sys.exit(1)
    
    def run(self):
        """运行命令行工具"""
        parser = argparse.ArgumentParser(
            description='Flomo 命令行工具 - 管理和查看你的浮墨备忘录',
            prog='flomo'
        )
        
        subparsers = parser.add_subparsers(dest='command', help='可用命令')
        
        # list 命令
        list_parser = subparsers.add_parser('list', help='列出备忘录')
        list_parser.add_argument('-l', '--limit', type=int, help='限制返回的备忘录数量')
        list_parser.add_argument('-f', '--format', choices=['json', 'table', 'markdown'], 
                               default='json', help='输出格式 (默认: json)')
        list_parser.add_argument('-c', '--compact', action='store_true', help='紧凑的JSON输出')
        list_parser.add_argument('-q', '--quiet', action='store_true', help='安静模式，不显示进度信息')
        list_parser.add_argument('-o', '--output', help='导出到文件 (指定文件路径)')
        list_parser.add_argument('--url', choices=['full', 'id', 'none'], default='full', 
                               help='URL展现形式: full=完整URL, id=仅显示ID, none=不显示 (默认: full)')
        list_parser.add_argument('--no-meta', action='store_true', help='不包含元数据 (创建时间、更新时间等)')
        list_parser.add_argument('--min', action='store_true', help='最小化输出 (仅内容和基本信息, 适合喂给大模型)')
        list_parser.add_argument('--order-by', choices=['created_at', 'updated_at'], default='created_at',
                               help='排序字段 (默认: created_at)')
        list_parser.add_argument('--order-dir', choices=['asc', 'desc'], default='desc',
                               help='排序方向: asc=升序(旧到新), desc=降序(新到旧) (默认: desc)')
        
        # search 命令
        search_parser = subparsers.add_parser('search', help='搜索备忘录')
        search_parser.add_argument('query', help='搜索关键词')
        search_parser.add_argument('-l', '--limit', type=int, help='限制返回的备忘录数量')
        search_parser.add_argument('-f', '--format', choices=['json', 'table', 'markdown'], 
                                 default='json', help='输出格式 (默认: json)')
        search_parser.add_argument('-c', '--compact', action='store_true', help='紧凑的JSON输出')
        search_parser.add_argument('-q', '--quiet', action='store_true', help='安静模式，不显示进度信息')
        
        # config 命令
        config_parser = subparsers.add_parser('config', help='配置管理')
        config_parser.add_argument('--token', help='设置认证token')
        config_parser.add_argument('--show', action='store_true', help='显示当前配置')
        
        # 解析参数
        args = parser.parse_args()
        
        if not args.command:
            parser.print_help()
            return
        
        # 执行命令
        if args.command == 'list':
            self.cmd_list(args)
        elif args.command == 'search':
            self.cmd_search(args)
        elif args.command == 'config':
            self.cmd_config(args)


def main():
    """命令行工具入口点"""
    cli = FlomoCLI()
    cli.run()


if __name__ == '__main__':
    main()