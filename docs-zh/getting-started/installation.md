# 环境配置指南

本指南将帮助您设置12-Factor Agents的开发环境，确保您能够顺利开始智能体开发之旅。

## 系统要求

### 必需软件

| 软件 | 最低版本 | 推荐版本 | 说明 |
|------|----------|----------|------|
| Node.js | 18.0+ | 20.0+ | JavaScript运行时环境 |
| npm | 8.0+ | 10.0+ | 包管理器（Node.js自带） |
| Git | 2.20+ | 最新版 | 版本控制工具 |

### 可选软件

| 软件 | 用途 | 安装建议 |
|------|------|----------|
| VS Code | 代码编辑器 | 推荐安装BAML扩展 |
| Docker | 容器化部署 | 生产环境推荐 |
| pnpm | 更快的包管理器 | 大型项目推荐 |

## 安装步骤

### 1. 安装 Node.js

#### macOS 用户

```bash
# 使用 Homebrew（推荐）
brew install node@20

# 或下载官方安装包
# 访问 https://nodejs.org/
```

#### Windows 用户

```bash
# 使用 Chocolatey
choco install nodejs

# 或使用 Winget
winget install OpenJS.NodeJS

# 或下载官方安装包
# 访问 https://nodejs.org/
```

#### Linux 用户

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Arch Linux
sudo pacman -S nodejs npm
```

### 2. 验证安装

```bash
# 检查 Node.js 版本
node --version
# 应该显示 v20.x.x 或更高版本

# 检查 npm 版本
npm --version
# 应该显示 10.x.x 或更高版本

# 检查 Git 版本
git --version
# 应该显示 git version 2.x.x 或更高版本
```

### 3. 配置开发环境

#### 设置 npm 镜像（可选，提升下载速度）

```bash
# 中国大陆用户推荐使用淘宝镜像
npm config set registry https://registry.npmmirror.com

# 验证配置
npm config get registry
```

#### 安装全局工具

```bash
# 安装 12-Factor Agents 脚手架工具
npm install -g create-12-factor-agent

# 安装 TypeScript（可选，用于类型检查）
npm install -g typescript

# 安装 tsx（可选，用于直接运行 TypeScript）
npm install -g tsx
```

## API 密钥配置

### 获取 OpenAI API 密钥

1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 注册或登录账户
3. 导航到 API Keys 页面
4. 创建新的 API 密钥
5. 复制并安全保存密钥

### 配置环境变量

#### 方法一：使用 .env 文件（推荐）

```bash
# 在项目根目录创建 .env 文件
touch .env

# 编辑 .env 文件，添加以下内容：
echo "OPENAI_API_KEY=sk-your-openai-key-here" >> .env
echo "ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here" >> .env
echo "HUMANLAYER_API_KEY=your-humanlayer-key-here" >> .env
```

#### 方法二：系统环境变量

```bash
# macOS/Linux - 添加到 ~/.bashrc 或 ~/.zshrc
export OPENAI_API_KEY="sk-your-openai-key-here"
export ANTHROPIC_API_KEY="sk-ant-your-anthropic-key-here"
export HUMANLAYER_API_KEY="your-humanlayer-key-here"

# Windows - 使用 PowerShell
$env:OPENAI_API_KEY="sk-your-openai-key-here"
$env:ANTHROPIC_API_KEY="sk-ant-your-anthropic-key-here"
$env:HUMANLAYER_API_KEY="your-humanlayer-key-here"
```

### 安全注意事项

⚠️ **重要安全提醒**：

1. **永远不要**将 API 密钥提交到版本控制系统
2. **确保** `.env` 文件在 `.gitignore` 中
3. **定期轮换** API 密钥
4. **使用**环境变量而非硬编码密钥

```bash
# 确保 .gitignore 包含以下内容
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo "*.env" >> .gitignore
```

## IDE 配置

### VS Code 推荐配置

#### 安装扩展

```bash
# 通过命令行安装推荐扩展
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-eslint
code --install-extension BoundaryML.baml
```

#### 工作区配置

创建 `.vscode/settings.json`：

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.includePackageJsonAutoImports": "off",
  "baml.enabled": true,
  "files.associations": {
    "*.baml": "baml"
  }
}
```

## 验证环境

### 创建测试项目

```bash
# 创建新的智能体项目
npx create-12-factor-agent test-agent
cd test-agent

# 安装依赖
npm install

# 运行测试
npm test

# 启动开发服务器
npm run dev
```

### 检查清单

- [ ] Node.js 版本 ≥ 20.0
- [ ] npm 可以正常安装包
- [ ] Git 配置正确
- [ ] OpenAI API 密钥已配置
- [ ] 测试项目可以正常运行
- [ ] IDE 扩展已安装
- [ ] 环境变量正确加载

## 常见问题

### Node.js 版本问题

**问题**：`node --version` 显示版本过低

**解决方案**：
```bash
# 使用 nvm 管理 Node.js 版本
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
nvm alias default 20
```

### npm 权限问题

**问题**：全局安装包时出现权限错误

**解决方案**：
```bash
# 配置 npm 全局目录
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'

# 添加到 PATH（添加到 ~/.bashrc 或 ~/.zshrc）
export PATH=~/.npm-global/bin:$PATH
```

### API 密钥无效

**问题**：API 调用返回认证错误

**解决方案**：
1. 检查密钥是否正确复制
2. 确认密钥没有过期
3. 验证环境变量是否正确加载：
   ```bash
   node -e "console.log(process.env.OPENAI_API_KEY)"
   ```

## 下一步

环境配置完成后，您可以：

1. 🚀 [创建第一个智能体](first-agent.md)
2. 📚 [学习核心概念](../concepts/overview.md)
3. 🛠️ [开始Workshop教程](../tutorials/workshop/)

如果在配置过程中遇到问题，请查看[故障排除指南](../best-practices/troubleshooting.md)或在[Discord社区](https://humanlayer.dev/discord)寻求帮助。