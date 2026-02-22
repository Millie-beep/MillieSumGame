# 数字堆叠 (SumStack) - 部署指南

本项目是一个基于 React + Vite + Tailwind CSS 开发的益智游戏。

## 如何同步到 GitHub

1. **在 GitHub 上创建一个新的仓库**（不要勾选初始化 README）。
2. **在本地终端执行以下命令**（假设你已经下载了代码）：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <你的仓库URL>
   git push -u origin main
   ```

## 如何部署到 Vercel

1. **登录 Vercel** (https://vercel.com)。
2. **点击 "Add New" -> "Project"**。
3. **导入你刚才创建的 GitHub 仓库**。
4. **配置项目**：
   - **Framework Preset**: 选择 `Vite`。
   - **Build Command**: `npm run build`。
   - **Output Directory**: `dist`。
5. **点击 "Deploy"**。

## 环境变量

如果你在代码中使用了 Gemini API，请在 Vercel 的项目设置中添加环境变量：
- `GEMINI_API_KEY`: 你的 Google AI API Key。

---
祝你游戏愉快！
