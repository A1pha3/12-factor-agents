# 12-Factor Agents - 构建可靠LLM应用的原则

<div align="center">
<a href="https://www.apache.org/licenses/LICENSE-2.0">
        <img src="https://img.shields.io/badge/Code-Apache%202.0-blue.svg" alt="代码许可证: Apache 2.0"></a>
<a href="https://creativecommons.org/licenses/by-sa/4.0/">
        <img src="https://img.shields.io/badge/Content-CC%20BY--SA%204.0-lightgrey.svg" alt="内容许可证: CC BY-SA 4.0"></a>
<a href="https://humanlayer.dev/discord">
    <img src="https://img.shields.io/badge/chat-discord-5865F2" alt="Discord 服务器"></a>
</div>

<p></p>

*受 [12 Factor Apps](https://12factor.net/) 启发*。*本项目源码公开在 https://github.com/humanlayer/12-factor-agents，欢迎您的反馈和贡献。让我们一起探索！*

## 项目简介

**12-Factor Agents** 是一个教育框架和资源集合，旨在指导开发者构建可靠的、生产就绪的LLM驱动应用程序。借鉴成熟的 [12-Factor App 方法论](https://12factor.net/)，本项目提供了创建可维护、可扩展且适合面向客户的生产环境的AI智能体的原则、模式和实用工具。

## 核心特性

- **教育框架**：构建生产就绪AI智能体的全面12因子方法论
- **智能体模板生成器**：`create-12-factor-agent` 包，内置最佳实践的项目脚手架
- **演练文档工具**：`walkthroughgen` 实用程序，从YAML规范创建分步技术文档
- **参考实现**：完整的示例智能体，演示计算器功能和人机交互审批流程
- **实用示例**：工具调用、状态管理、错误处理和人机交互工作流的真实模式

## 快速开始

### 环境要求

- **Node.js**: 推荐版本 20+
- **包管理器**: npm, yarn, 或 pnpm
- **API密钥**: OpenAI API密钥用于LLM功能

### 创建新的智能体

```bash
# 全局安装生成器
npm install -g create-12-factor-agent

# 创建新的智能体项目
npx create-12-factor-agent my-agent
cd my-agent

# 安装依赖并开始开发
npm install
npm run dev
```

## 12个因子概览

1. **[自然语言到工具调用](factors/factor-01-natural-language-to-tool-calls.md)** - 将自然语言转换为结构化工具调用
2. **[掌控你的提示词](factors/factor-02-own-your-prompts.md)** - 不要将提示词工程外包给框架
3. **[掌控你的上下文窗口](factors/factor-03-own-your-context-window.md)** - 自定义上下文序列化和管理
4. **[工具即结构化输出](factors/factor-04-tools-are-structured-outputs.md)** - 将工具调用视为类型化的结构化数据
5. **[统一执行状态和业务状态](factors/factor-05-unify-execution-state.md)** - 在单一上下文中管理所有状态
6. **[通过简单API启动/暂停/恢复](factors/factor-06-launch-pause-resume.md)** - 支持异步和长时间运行的工作流
7. **[通过工具调用联系人类](factors/factor-07-contact-humans-with-tools.md)** - 将人机交互建模为工具调用
8. **[掌控你的控制流](factors/factor-08-own-your-control-flow.md)** - 明确的控制流而非隐式框架魔法
9. **[将错误压缩到上下文窗口](factors/factor-09-compact-errors.md)** - 高效的错误处理和恢复
10. **[小型、专注的智能体](factors/factor-10-small-focused-agents.md)** - 微智能体优于单体智能体
11. **[从任何地方触发，在用户所在的地方相遇](factors/factor-11-trigger-from-anywhere.md)** - 多渠道智能体接口
12. **[让你的智能体成为无状态归约器](factors/factor-12-stateless-reducer.md)** - 函数式智能体设计模式

### 可视化导航

|    |    |    |
|----|----|-----|
|[![因子1](../img/110-natural-language-tool-calls.png)](factors/factor-01-natural-language-to-tool-calls.md) | [![因子2](../img/120-own-your-prompts.png)](factors/factor-02-own-your-prompts.md) | [![因子3](../img/130-own-your-context-building.png)](factors/factor-03-own-your-context-window.md) |
|[![因子4](../img/140-tools-are-just-structured-outputs.png)](factors/factor-04-tools-are-structured-outputs.md) | [![因子5](../img/150-unify-state.png)](factors/factor-05-unify-execution-state.md) | [![因子6](../img/160-pause-resume-with-simple-apis.png)](factors/factor-06-launch-pause-resume.md) |
| [![因子7](../img/170-contact-humans-with-tools.png)](factors/factor-07-contact-humans-with-tools.md) | [![因子8](../img/180-control-flow.png)](factors/factor-08-own-your-control-flow.md) | [![因子9](../img/190-factor-9-errors-static.png)](factors/factor-09-compact-errors.md) |
| [![因子10](../img/1a0-small-focused-agents.png)](factors/factor-10-small-focused-agents.md) | [![因子11](../img/1b0-trigger-from-anywhere.png)](factors/factor-11-trigger-from-anywhere.md) | [![因子12](../img/1c0-stateless-reducer.png)](factors/factor-12-stateless-reducer.md) |

## 学习路径

### 🚀 初学者路径
1. [项目介绍](getting-started/introduction.md) - 了解12-factor agents的核心概念
2. [环境配置](getting-started/installation.md) - 设置开发环境
3. [第一个智能体](getting-started/first-agent.md) - 创建你的第一个智能体
4. [Workshop教程](tutorials/workshop/) - 逐步构建完整的智能体

### 🏗️ 开发者路径
1. [核心概念](concepts/overview.md) - 深入理解架构原理
2. [最佳实践](best-practices/) - 生产环境的设计模式
3. [工具指南](tools/) - 开发工具和调试技巧
4. [高级教程](tutorials/advanced/) - 复杂场景的实现方案

### 🎯 架构师路径
1. [设计原理](concepts/agent-architecture.md) - 系统架构和设计决策
2. [性能优化](best-practices/performance.md) - 扩展和优化策略
3. [故障排除](best-practices/troubleshooting.md) - 常见问题和解决方案
4. [社区项目](community/projects.md) - 真实世界的应用案例

## 文档结构

```
docs-zh/
├── README.md                    # 本文件
├── getting-started/             # 快速入门
├── concepts/                    # 核心概念
├── factors/                     # 12因子详解
├── tutorials/                   # 实践教程
├── tools/                       # 工具指南
├── best-practices/              # 最佳实践
├── community/                   # 社区资源
└── assets/                      # 多媒体资源
```

## 贡献指南

我们欢迎社区贡献！请查看 [贡献指南](community/contributing.md) 了解如何：

- 报告问题和建议改进
- 提交文档翻译和修正
- 分享你的智能体项目
- 参与社区讨论

## 许可证

所有内容和图片采用 <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0 许可证</a>

代码采用 <a href="https://www.apache.org/licenses/LICENSE-2.0">Apache 2.0 许可证</a>

## 联系我们

- **GitHub**: [12-factor-agents](https://github.com/humanlayer/12-factor-agents)
- **Discord**: [HumanLayer 社区](https://humanlayer.dev/discord)
- **问题反馈**: [GitHub Issues](https://github.com/humanlayer/12-factor-agents/issues)

---

*让我们一起构建更好的AI智能体！* 🚀