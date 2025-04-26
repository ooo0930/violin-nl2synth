# API 模組

統一管理 REST API 路由與控制器。

## 主要接口
- `POST /translate`：自然語言 → 小提琴語言
- `POST /parametrize`：小提琴語言 → 參數
- `POST /play`：播放合成器
- `GET /healthz`：健康檢查

## 使用範例
```http
POST /translate
{
  "description": "演奏一段活潑的斷奏旋律"
}
```
