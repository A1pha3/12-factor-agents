[← 返回主页](../README.md)

# 因子2：掌控你的提示词

不要将提示词工程外包给框架。

![120-own-your-prompts](../../img/120-own-your-prompts.png)

顺便说一下，[这绝非新颖的建议](https://hamel.dev/blog/posts/prompt/)：

## 问题：框架的黑盒方法

一些框架提供这样的"黑盒"方法：

```python
agent = Agent(
  role="...",
  goal="...",
  personality="...",
  tools=[tool1, tool2, tool3]
)

task = Task(
  instructions="...",
  expected_output=OutputModel
)

result = agent.run(task)
```

这对于引入一些**顶级提示词工程**来帮助您入门很有用，但通常很难调优和/或逆向工程以获得恰好正确的令牌输入到您的模型中。

## 解决方案：将提示词视为一等代码

相反，拥有您的提示词并将它们视为一等代码：

```rust
function DetermineNextStep(thread: string) -> DoneForNow | ListGitTags | DeployBackend | DeployFrontend | RequestMoreInformation {
  prompt #"
    {{ _.role("system") }}
    
    您是一个有用的助手，负责管理前端和后端系统的部署。
    您勤奋工作，通过遵循最佳实践和适当的部署程序来确保安全和成功的部署。
    
    在部署任何系统之前，您应该检查：
    - 部署环境（测试环境 vs 生产环境）
    - 要部署的正确标签/版本
    - 当前系统状态
    
    您可以使用 deploy_backend、deploy_frontend 和 check_deployment_status 等工具
    来管理部署。对于敏感部署，使用 request_approval 获取人工验证。
    
    始终考虑首先要做什么，比如：
    - 检查当前部署状态
    - 验证部署标签是否存在
    - 如果需要，请求批准
    - 在生产环境之前先部署到测试环境
    - 监控部署进度
    
    {{ _.role("user") }}

    {{ thread }}
    
    下一步应该做什么？
  "#
}
```

（上面的示例使用 [BAML](https://github.com/boundaryml/baml) 生成提示词，但您可以使用任何您想要的提示词工程工具，甚至只是手动模板化）

## 核心优势

拥有您的提示词的关键好处：

1. **完全控制**：编写您的智能体确切需要的指令，没有黑盒抽象
2. **测试和评估**：为您的提示词构建测试和评估，就像您对任何其他代码一样
3. **迭代**：基于真实世界的性能快速修改提示词
4. **透明度**：确切知道您的智能体正在使用什么指令
5. **角色黑客**：利用支持用户/助手角色非标准用法的API

## 实际应用示例

### 客服智能体提示词

```rust
function CustomerServiceAgent(conversation: string, customer_info: string) -> CustomerAction {
  prompt #"
    {{ _.role("system") }}
    
    您是一名专业的客服代表，负责帮助客户解决问题。
    您的目标是提供优质、高效的客户服务。
    
    客户信息：
    {{ customer_info }}
    
    可用操作：
    - 查询订单状态
    - 处理退款申请
    - 转接技术支持
    - 升级到高级客服
    
    服务原则：
    1. 始终保持礼貌和专业
    2. 优先解决客户问题
    3. 对于复杂问题及时升级
    4. 确保客户满意度
    
    {{ _.role("user") }}
    
    对话历史：
    {{ conversation }}
    
    请确定下一步最佳行动。
  "#
}
```

### 数据分析智能体提示词

```rust
function DataAnalysisAgent(query: string, available_data: string) -> AnalysisAction {
  prompt #"
    {{ _.role("system") }}
    
    您是一名数据分析专家，能够理解业务需求并提供数据洞察。
    
    可用数据源：
    {{ available_data }}
    
    分析能力：
    - SQL查询生成
    - 数据可视化
    - 趋势分析
    - 报告生成
    
    分析流程：
    1. 理解业务问题
    2. 确定所需数据
    3. 执行分析
    4. 生成洞察
    5. 提供建议
    
    {{ _.role("user") }}
    
    分析请求：{{ query }}
    
    请制定分析计划。
  "#
}
```

## 提示词最佳实践

### 1. 结构化提示词设计

```rust
function StructuredPrompt(context: string) -> Action {
  prompt #"
    {{ _.role("system") }}
    
    # 角色定义
    您是[具体角色描述]
    
    # 目标
    您的主要目标是[明确目标]
    
    # 可用工具
    - 工具1：[描述]
    - 工具2：[描述]
    
    # 工作流程
    1. 步骤1
    2. 步骤2
    3. 步骤3
    
    # 约束条件
    - 约束1
    - 约束2
    
    {{ _.role("user") }}
    {{ context }}
  "#
}
```

### 2. 上下文管理

```rust
function ContextAwarePrompt(
  current_state: string,
  user_input: string,
  history: string
) -> Response {
  prompt #"
    {{ _.role("system") }}
    
    当前状态：{{ current_state }}
    
    历史上下文：
    {{ history }}
    
    基于当前状态和历史，处理用户请求。
    
    {{ _.role("user") }}
    {{ user_input }}
  "#
}
```

### 3. 错误处理提示词

```rust
function ErrorHandlingPrompt(error: string, context: string) -> RecoveryAction {
  prompt #"
    {{ _.role("system") }}
    
    发生了错误，需要您的帮助来恢复。
    
    错误信息：{{ error }}
    当前上下文：{{ context }}
    
    请分析错误原因并提供恢复方案：
    1. 错误分析
    2. 可能的解决方案
    3. 推荐的下一步行动
    
    如果无法自动恢复，请请求人工干预。
  "#
}
```

## 提示词版本控制

### Git管理提示词

```bash
# 提示词文件结构
baml_src/
├── agents/
│   ├── customer_service.baml
│   ├── data_analysis.baml
│   └── deployment.baml
├── tools/
│   ├── calculator.baml
│   └── email.baml
└── shared/
    ├── common_instructions.baml
    └── error_handling.baml
```

### 提示词测试

```rust
test CustomerServiceBasic {
  functions [CustomerServiceAgent]
  args {
    conversation "客户询问订单状态"
    customer_info "VIP客户，订单号：12345"
  }
  @@assert(action_type, {{this.intent == "查询订单"}})
}

test CustomerServiceEscalation {
  functions [CustomerServiceAgent]
  args {
    conversation "客户投诉产品质量问题"
    customer_info "普通客户，多次投诉"
  }
  @@assert(escalation, {{this.intent == "升级到高级客服"}})
}
```

## 与框架方法的对比

| 特性 | 框架提示词 | 自主提示词 |
|------|------------|------------|
| 控制程度 | 有限 | 完全控制 |
| 定制化 | 困难 | 容易 |
| 调试能力 | 黑盒 | 透明 |
| 版本管理 | 困难 | 原生支持 |
| 测试能力 | 有限 | 完整测试 |
| 性能优化 | 受限 | 完全优化 |

## 记住

您的提示词是您的应用逻辑和LLM之间的主要接口。

完全控制您的提示词为您提供了生产级智能体所需的灵活性和提示词控制。

我不知道什么是最好的提示词，但我知道您希望有灵活性能够尝试**一切**。

[← 自然语言到工具调用](factor-01-natural-language-to-tool-calls.md) | [掌控你的上下文窗口 →](factor-03-own-your-context-window.md)