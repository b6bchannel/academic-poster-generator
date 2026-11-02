# Research Forum Poster Studio v10

## 使用

直接使用 Chrome / Edge 打开 `index.html`，或将本文件夹**内的文件**上传到 GitHub 仓库根目录，再启用 GitHub Pages。无需 Node、Python、数据库或 API Key。

所有默认头像均为虚构的博士帽女生插画。示例真人头像已从发布包和内嵌资源表中移除。用户上传的图片在其浏览器本地处理，不会发送到 GitHub。

## 主要交互

- 选择 1–4 位主讲人、配色方案；粘贴整段信息自动识别，再修改字段。
- 单人版以 Speaker 1 的演讲标题作为海报大标题；多人版使用活动标题。单人版导出文件名也使用演讲标题。
- 在海报上拖动文字框、色块、头像与图标；选中后拖动右下角控制点缩放。
- 图片上传、头像裁切在左侧「图片替换」。默认头像均为统一的插画占位，不包含真实人的肖像。
- 🐶 favicon 保留；导出 JPG 最多 4× (约 3401 × 4772 px)。

## 部署

将本目录里的 `index.html`、`app.js`、`styles.css`、`templates.js`、`asset-data.js`、`favicon.svg`、`.nojekyll` 和 `assets/` 一并上传到仓库根目录。GitHub > Settings > Pages > Deploy from a branch > main > /(root)。

注意：Google Sans 在线加载可能受网络环境影响；网页会以系统字体回退。为兼容直接双击打开文件，默认图片也以 Data URI 方式内嵌到 asset-data.js；请勿将其删除。

## v10
- 2、3 人版 Location 图标向地点文字对齐，保留左侧安全内边距。
- 时钟和定位图标改用内嵌 Lucide 风格 SVG，颜色随时间字号颜色或当前主题的强调色变化。
- 黄白、灰白、粉白三套浅色方案的演讲题目改用深色，改善对比度。
- 不再存放多份静态图标 PNG，预览和 JPG 的兼容导出都用矢量路径绘制。
