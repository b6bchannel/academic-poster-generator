# Research Forum Poster Studio v7

无需后端、账号或构建流程的静态网页海报生成器。根据原始 PPTX 的 1–4 位 Speaker 设计和配色预设开发。推荐 Chrome / Edge 桌面浏览器。

## 使用

- 在左侧选择主讲人数量与配色，粘贴活动信息并点击「自动识别并填充」。识别后到「内容校对」手动修正字段。
- 在左侧「图片替换」上传背景和各位 Speaker 头像；头像内部裁切用缩放、左右、上下滑块微调。**不要点击画布里的头像上传**。
- 在海报预览中，文字框、色块、头像、地点图标都能用鼠标拖动。选中后文字/头像/地点图标可通过右下角手柄缩放，色块则有四角手柄。头像缩放始终为圆形，地点图标缩放保持比例。
- JPG 以海报标题命名，并输出 4× 设计分辨率（约 3401 × 4772 像素）。

## 部署到 GitHub Pages（无需安装 Node.js）

1. 新建 GitHub 仓库，将**本压缩包根目录里面的所有文件和 `assets/` 文件夹**放到仓库根目录。务必让 `index.html` 直接位于仓库根目录，而不是放在多余的一层 `academic-poster-demo/` 子文件夹里。
2. 打开仓库 **Settings → Pages → Build and deployment**，Source 选 **Deploy from a branch**，Branch 选 `main`，Folder 选 `/(root)`，点击 Save。
3. 待 Pages 部署完成，从 Pages 页面的链接进入网站。通常项目页地址是 `https://你的用户名.github.io/仓库名/`。

同一份静态文件也可以放到 Cloudflare Pages 的发布目录。无需 npm 构建命令。

## 文件

- `index.html`：网页入口
- `styles.css`：编辑器及海报样式
- `app.js`：资料识别、交互、图片处理与 JPG 导出
- `templates.js`：从 PPTX 抽取的版式数据
- `asset-data.js`：图片 Data URI 资源包，减少本地文件路径与导出跨域问题
- `assets/`：图片和 Logo 等本地资源
- `.nojekyll`：使 GitHub Pages 不执行 Jekyll 的处理

## 限制

- Google Sans 通过 Google Fonts 在线加载；如果无法访问，会回退到系统字体，可能影响断行。
- 优先调用 CDN 上的 `html2canvas` 生成 JPG；当该库无法加载时会使用内置 Canvas 兼容导出，个别字形、复杂文本布局可能和预览存在细微差异。
- 活动资料识别为本地规则解析器，不是 AI API；复杂格式请人工核对。
- 上传和编辑信息默认只保存在当前浏览器，不会上传至 GitHub 或网站服务器。请勿把含有隐私资料的实际讲座数据硬编码后提交到公开仓库。
