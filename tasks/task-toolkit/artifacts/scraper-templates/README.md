# 爬虫模板 — 使用说明

## 文件

| 文件 | 说明 |
|------|------|
| `generic-scraper.py` | Python 通用爬虫模板 |

## 依赖

```bash
pip install requests beautifulsoup4
```

## 快速使用

```bash
# JSON 输出（默认）
python generic-scraper.py https://example.com -o results

# CSV 输出
python generic-scraper.py https://example.com -f csv -o results

# 同时输出 JSON + CSV
python generic-scraper.py https://example.com -f both -o results

# 控制请求间隔（秒）
python generic-scraper.py https://example.com --delay 2.5

# 通过代理
python generic-scraper.py https://example.com --proxy http://127.0.0.1:7890

# 详细日志
python generic-scraper.py https://example.com -v
```

## 自定义爬虫

继承 `GenericScraper` 并覆盖 `parse()` 方法：

```python
class MyScraper(GenericScraper):
    def parse(self, soup):
        items = []
        for item in soup.select(".my-item"):
            items.append(ScrapedItem(
                title=item.select_one(".title").get_text(strip=True),
                content=item.select_one(".desc").get_text(strip=True),
                url=self.base_url,
            ))
        return items
```

## 防反爬策略

| 策略 | 说明 |
|------|------|
| 随机 UA | 内置 5 个常用浏览器 UA |
| 随机延迟 | 默认 1-3 秒随机间隔 |
| Referer | 自动设置来源 |
| 代理支持 | `--proxy` 参数 |
| 指数退避重试 | 503/429 自动延长等待 |
| 403 检测 | 被禁后自动暂停更长时间 |

## 注意事项

- 始终遵守目标网站的 `robots.txt`
- 控制请求频率，不要对服务器造成压力
- 生产环境建议使用 `--proxy` 轮换 IP
