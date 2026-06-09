#!/usr/bin/env python3
"""
通用爬虫模板 — Python
=========================
复制即用，支持：
- requests + BeautifulSoup 解析
- 防反爬（随机 UA / 延迟 / 代理）
- 错误重试（指数退避）
- 命令行参数（目标 URL、输出格式）
- JSON / CSV 输出
"""

import argparse
import csv
import json
import logging
import random
import sys
import time
from dataclasses import dataclass, field, asdict
from typing import Optional
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

# ===================== 日志配置 =====================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("scraper")

# ===================== 常量 =====================

# 随机 User-Agent 池
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:126.0) Gecko/20100101 Firefox/126.0",
]

DEFAULT_DELAY = (1, 3)  # 请求间隔（秒）
MAX_RETRIES = 3
TIMEOUT = 30


# ===================== 数据模型 =====================

@dataclass
class ScrapedItem:
    """爬取结果的数据模型 — 按需扩展字段"""
    title: str = ""
    url: str = ""
    content: str = ""
    summary: str = ""
    author: str = ""
    date: str = ""
    source: str = ""


# ===================== 核心爬虫 =====================

class GenericScraper:
    """通用爬虫基类 — 继承并覆盖 parse() 实现具体逻辑"""

    def __init__(
        self,
        base_url: str,
        delay: tuple = DEFAULT_DELAY,
        use_proxy: bool = False,
        proxy_url: Optional[str] = None,
    ):
        self.base_url = base_url
        self.delay = delay
        self.use_proxy = use_proxy
        self.proxy_url = proxy_url
        self.session = self._build_session()

    def _build_session(self) -> requests.Session:
        session = requests.Session()
        session.headers.update({
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        })
        return session

    def _get_headers(self) -> dict:
        return {
            "User-Agent": random.choice(USER_AGENTS),
            "Referer": self.base_url,
        }

    def _get_proxies(self) -> dict:
        if self.use_proxy and self.proxy_url:
            return {"http": self.proxy_url, "https": self.proxy_url}
        return {}

    def _request(self, url: str, retries: int = MAX_RETRIES) -> Optional[requests.Response]:
        """带重试的 HTTP GET 请求"""
        for attempt in range(1, retries + 1):
            try:
                resp = self.session.get(
                    url,
                    headers=self._get_headers(),
                    proxies=self._get_proxies(),
                    timeout=TIMEOUT,
                )
                resp.raise_for_status()
                return resp
            except requests.exceptions.HTTPError as e:
                status = e.response.status_code
                if status == 403:
                    logger.warning(f"[{attempt}/{retries}] 403 被禁 — 等待更长时间")
                    time.sleep(self.delay[1] * 2)
                elif status == 429:
                    retry_after = int(e.response.headers.get("Retry-After", self.delay[1]))
                    logger.warning(f"[{attempt}/{retries}] 429 限流 — 等待 {retry_after}s")
                    time.sleep(retry_after)
                elif status >= 500:
                    logger.warning(f"[{attempt}/{retries}] {status} 服务器错误")
                    time.sleep(self.delay[0])
                else:
                    logger.error(f"[{attempt}/{retries}] HTTP {status}: {e}")
                    if attempt == retries:
                        return None
                    time.sleep(self.delay[0])
            except requests.exceptions.ConnectionError:
                logger.warning(f"[{attempt}/{retries}] 连接失败")
                time.sleep(self.delay[1])
            except requests.exceptions.Timeout:
                logger.warning(f"[{attempt}/{retries}] 超时")
                time.sleep(self.delay[0])
            except Exception as e:
                logger.error(f"[{attempt}/{retries}] 未知错误: {e}")
                return None

        return None

    def fetch(self, url: str) -> Optional[BeautifulSoup]:
        """获取页面并返回 BeautifulSoup 对象"""
        logger.info(f"请求: {url}")
        resp = self._request(url)
        if resp is None:
            return None
        # 检测编码
        if resp.encoding and resp.encoding.lower() != "utf-8":
            resp.encoding = resp.apparent_encoding
        soup = BeautifulSoup(resp.text, "html.parser")
        # 反爬：随机延迟
        delay = random.uniform(*self.delay)
        logger.debug(f"延迟 {delay:.1f}s")
        time.sleep(delay)
        return soup

    def parse(self, soup: BeautifulSoup) -> list[ScrapedItem]:
        """
        解析页面 — 子类必须覆盖此方法
        返回 ScrapedItem 列表
        """
        raise NotImplementedError("请继承 GenericScraper 并实现 parse() 方法")

    def run(self, url: Optional[str] = None) -> list[ScrapedItem]:
        """运行爬虫"""
        target = url or self.base_url
        soup = self.fetch(target)
        if soup is None:
            logger.error("获取页面失败")
            return []
        items = self.parse(soup)
        logger.info(f"解析到 {len(items)} 条数据")
        return items


# ===================== 示例爬虫 =====================

class ExampleScraper(GenericScraper):
    """示例爬虫 — 爬取页面所有标题和段落"""

    def parse(self, soup: BeautifulSoup) -> list[ScrapedItem]:
        items = []
        # 提取标题
        for tag in ["h1", "h2", "h3"]:
            for elem in soup.find_all(tag):
                text = elem.get_text(strip=True)
                if text:
                    items.append(ScrapedItem(
                        title=text,
                        url=self.base_url,
                        source=tag,
                    ))
        # 提取段落
        for p in soup.find_all("p"):
            text = p.get_text(strip=True)
            if len(text) > 20:
                items.append(ScrapedItem(
                    content=text,
                    url=self.base_url,
                ))
        return items


# ===================== 输出 =====================

def to_json(items: list[ScrapedItem], filepath: str):
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump([asdict(item) for item in items], f, ensure_ascii=False, indent=2)
    logger.info(f"JSON 已保存: {filepath}")


def to_csv(items: list[ScrapedItem], filepath: str):
    if not items:
        logger.warning("无数据，跳过 CSV 输出")
        return
    with open(filepath, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=asdict(items[0]).keys())
        writer.writeheader()
        for item in items:
            writer.writerow(asdict(item))
    logger.info(f"CSV 已保存: {filepath}")


# ===================== CLI =====================

def parse_args():
    parser = argparse.ArgumentParser(description="通用爬虫模板")
    parser.add_argument("url", help="目标 URL")
    parser.add_argument("--output", "-o", default="output", help="输出文件名（不含扩展名）")
    parser.add_argument("--format", "-f", default="json", choices=["json", "csv", "both"], help="输出格式")
    parser.add_argument("--delay", "-d", type=float, default=None, help="请求间隔（秒）")
    parser.add_argument("--proxy", help="代理 URL (http://user:pass@host:port)")
    parser.add_argument("--verbose", "-v", action="store_true", help="详细日志")
    return parser.parse_args()


def main():
    args = parse_args()
    if args.verbose:
        logger.setLevel(logging.DEBUG)

    delay = (args.delay, args.delay + 1) if args.delay else DEFAULT_DELAY

    scraper = ExampleScraper(
        base_url=args.url,
        delay=delay,
        use_proxy=bool(args.proxy),
        proxy_url=args.proxy,
    )

    items = scraper.run()
    if not items:
        logger.warning("未爬取到任何数据")
        sys.exit(0)

    formats = ["json", "csv"] if args.format == "both" else [args.format]
    for fmt in formats:
        filepath = f"{args.output}.{fmt}"
        if fmt == "json":
            to_json(items, filepath)
        else:
            to_csv(items, filepath)


if __name__ == "__main__":
    main()
