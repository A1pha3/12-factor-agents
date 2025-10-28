[← 微智能体示例](micro-agent-example.md)

# 智能体的本质

## 那么智能体到底是什么？

- **提示词** - 告诉大语言模型如何行为，以及它有哪些"工具"可用。提示词的输出是一个JSON对象，描述工作流中的下一步（"工具调用"或"函数调用"）。（[因子2](../factors/factor-02-own-your-prompts.md)）
- **switch语句** - 基于大语言模型返回的JSON，决定如何处理它。（[因子8](../factors/factor-08-own-your-control-flow.md)的一部分）
- **累积上下文** - 存储已发生的步骤列表及其结果（[因子3](../factors/factor-03-own-your-context-window.md)）
- **for循环** - 直到大语言模型发出某种"终端"工具调用（或纯文本响应），将switch语句的结果添加到上下文窗口并要求大语言模型选择下一步。（[因子8](../factors/factor-08-own-your-control-flow.md)）

![040-4-components](../../img/040-4-components.png)

在"deploybot"示例中，我们通过拥有控制流和上下文累积获得了几个好处：

- 在我们的**switch语句**和**for循环**中，我们可以劫持控制流以暂停等待人类输入或等待长时间运行任务的完成
- 我们可以轻松地序列化**上下文**窗口以进行暂停+恢复
- 在我们的**提示词**中，我们可以优化如何将指令和"到目前为止发生的事情"传递给大语言模型

## 核心组件详解

### 1. 提示词工程

```rust
function DetermineNextStep(context: string) -> DeploymentAction {
  prompt #"
    你是一个专业的部署管理助手。
    
    当前上下文：
    {{ context }}
    
    可用操作：
    - deploy_backend: 部署后端服务
    - deploy_frontend: 部署前端应用
    - request_approval: 请求人工批准
    - done: 完成任务
    
    请分析当前情况并选择下一步行动。
  "#
}
```

### 2. 控制流管理

```typescript
async function agentLoop(thread: Thread): Promise<Thread> {
  while (true) {
    const nextStep = await DetermineNextStep(thread.serialize());
    thread.addEvent({ type: "tool_call", data: nextStep });
    
    switch (nextStep.action) {
      case "request_approval":
        // 暂停等待人类输入
        return thread;
      case "done":
        return thread;
      default:
        const result = await executeAction(nextStep);
        thread.addEvent({ type: "tool_result", data: result });
    }
  }
}
```

### 3. 上下文管理

```typescript
class Thread {
  events: Event[] = [];
  
  serialize(): string {
    return this.events
      .map(event => this.formatEvent(event))
      .join('\n');
  }
  
  addEvent(event: Event): void {
    this.events.push(event);
    // 保持上下文窗口在合理大小
    if (this.events.length > MAX_EVENTS) {
      this.compactHistory();
    }
  }
}
```

### 4. 状态持久化

```typescript
interface ThreadStore {
  save(thread: Thread): Promise<string>;
  load(id: string): Promise<Thread>;
  update(id: string, thread: Thread): Promise<void>;
}

// 支持暂停/恢复
async function pauseAndResume(threadId: string) {
  const thread = await threadStore.load(threadId);
  const updatedThread = await agentLoop(thread);
  await threadStore.update(threadId, updatedThread);
}
```

[第二部分](../README.md#12-factor-agents)将**形式化这些模式**，以便它们可以应用于为任何软件项目添加令人印象深刻的AI功能，而无需完全采用传统的"AI智能体"实现/定义。

[因子1 - 自然语言到工具调用 →](../factors/factor-01-natural-language-to-tool-calls.md)