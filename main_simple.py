#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
from flomo import Flomo, Parser

def main():
    # 从环境变量获取 authorization
    auth_token = os.environ.get('FLOMO_AUTHORIZATION')
    
    if not auth_token:
        print("请设置环境变量 FLOMO_AUTHORIZATION")
        print("例如: export FLOMO_AUTHORIZATION='Bearer 10858055|fLR8Kvnni0dQzAvTDwRW4yFWi9hbGcMTvCAm1DlfC'")
        return
    
    # 如果没有 Bearer 前缀，自动添加
    if not auth_token.startswith('Bearer '):
        authorization = f"Bearer {auth_token}"
    else:
        authorization = auth_token
    
    # 创建 Flomo 实例
    flomo = Flomo(authorization)
    
    try:
        # 获取所有备忘录
        print("正在获取备忘录...")
        memos = flomo.get_all_memos()
        print(f"共获取到 {len(memos)} 条备忘录")
        
        if memos:
            import json
            # 获取前5条备忘录
            top_5_memos = []
            for i, memo_data in enumerate(memos[:5]):
                memo = Parser(memo_data)
                memo_info = {
                    "index": i + 1,
                    "content": memo.text,
                    "url": memo.url,
                    "tags": getattr(memo, 'tags', []),
                    "created_at": getattr(memo, 'created_at', ''),
                    "updated_at": getattr(memo, 'updated_at', ''),
                    "slug": getattr(memo, 'slug', '')
                }
                top_5_memos.append(memo_info)
            
            # 输出JSON格式
            print(json.dumps(top_5_memos, ensure_ascii=False, indent=2))
        else:
            print("没有找到备忘录")
            
    except Exception as e:
        print(f"错误: {e}")

if __name__ == "__main__":
    main()