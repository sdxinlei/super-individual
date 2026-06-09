# Favicon 制作指引

本指南说明如何为"超级个体"站点制作一套完整的 favicon。

## 推荐工具

- **Figma** 或 **Canva** — 设计矢量图标
- **realfavicongenerator.net** — 一键生成全平台 favicon 套装
- **icoconvert.com** — 在线转换格式

## 建议的设计方案

### 图标元素
- 使用纯色渐变背景，匹配站点靛蓝-紫色系（`#6366f1` → `#8b5cf6`）
- 中央放置一个简洁的白色图标，建议："🚀" 火箭符号 或 "S" 字母（代表 Super）

### 尺寸与格式

| 用途 | 尺寸 | 格式 |
|------|------|------|
| 浏览器标签图标 | 32×32 | `.ico` |
| 浏览器标签图标（高清） | 16×16 + 32×32（多尺寸 ICO） | `.ico` |
| iOS 主屏幕图标 | 180×180 | `.png` |
| Android 主屏幕图标 | 192×192, 512×512 | `.png` |
| Safari 固定标签页 | 纯色 SVG | `.svg` |

## 生成步骤

### 方案 A：使用 realfavicongenerator.net（推荐��

1. 准备一张 **260×260** 的 PNG 图标（透明背景）
2. 上传到 https://realfavicongenerator.net
3. 按向导配置背景色为 `#0a0a0f`（深色科技风背景色）
4. 下载生成的压缩包
5. 将所有文件解压至 `super-individual/` 目录
6. 将生成的 HTML 代码片段复制到 `index.html` 的 `<head>` 中

### 方案 B：手动制作

1. 用设计工具创建 512×512 SVG 图标
2. 导出为各尺寸 PNG
3. 使用 `convert`（ImageMagick）生成 ICO：

```bash
# 将多个 PNG 合并为 ICO
convert favicon-16.png favicon-32.png favicon.ico

# 生成 Apple Touch Icon
convert favicon-180.png apple-touch-icon.png
```

## 已预留的 HTML 占位

`index.html` 的 `<head>` 中已预留了以下占位标签，等你放入实际 favicon 文件后取消注释或替换：

```html
<link rel="icon" type="image/x-icon" href="favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">
```

## 注意事项

- `.ico` 文件必须包含 16×16 和 32×32 两个尺寸
- Apple Touch Icon 不需要 `<link>` 中的 `type` 属性
- favicon 文件应放在站点根目录（`super-individual/`）
- favicon 更新后浏览器可能缓存旧版本，可添加版本参数强制刷新：`href="favicon.ico?v=2"`
