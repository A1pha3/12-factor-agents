[← 循环问题](loop-problems.md)

# 真实的微智能体示例

## 真实的微智能体

这是确定性代码如何运行一个负责处理部署的人机协作步骤的微智能体的示例。

![029-deploybot-high-level](../../img/029-deploybot-high-level.png)

* **人类** 将PR合并到GitHub主分支
* **确定性代码** 部署到测试环境
* **确定性代码** 对测试环境运行端到端（e2e）测试
* **确定性代码** 将任务交给智能体进行生产部署，初始上下文："将SHA 4af9ec0部署到生产环境"
* **智能体** 调用 `deploy_frontend_to_prod(4af9ec0)`
* **确定性代码** 请求人类批准此操作
* **人类** 拒绝操作并反馈"你能先部署后端吗？"
* **智能体** 调用 `deploy_backend_to_prod(4af9ec0)`
* **确定性代码** 请求人类批准此操作
* **人类** 批准操作
* **确定性代码** 执行后端部署
* **智能体** 调用 `deploy_frontend_to_prod(4af9ec0)`
* **确定性代码** 请求人类批准此操作
* **人类** 批准操作
* **确定性代码** 执行前端部署
* **智能体** 确定任务成功完成，我们完成了！
* **确定性代码** 对生产环境运行端到端测试
* **确定性代码** 任务完成，或传递给回滚智能体审查失败并可能回滚

[![033-deploybot-animation](../../img/033-deploybot.gif)](https://github.com/user-attachments/assets/deb356e9-0198-45c2-9767-231cb569ae13)

这个例子基于我们在HumanLayer发布的[真实OSS智能体来管理我们的部署](https://github.com/got-agents/agents/tree/main/deploybot-ts) - 这是我上周与它的真实对话：

![035-deploybot-conversation](../../img/035-deploybot-conversation.png)

我们没有给这个智能体一大堆工具或任务。大语言模型的主要价值在于解析人类的纯文本反馈并提出更新的行动方案。我们尽可能隔离任务和上下文，以保持大语言模型专注于小的5-10步工作流。

这是另一个[更经典的支持/聊天机器人演示](https://x.com/chainlit_io/status/1858613325921480922)。

[智能体的本质 →](what-is-agent.md)