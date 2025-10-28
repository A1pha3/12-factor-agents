[← 软件发展简史](software-evolution.md)

# 智能体的承诺

## 智能体的承诺

我不是第一个[这样说的人](https://youtu.be/Dc99-zTMyMg?si=bcT0hIwWij2mR-40&t=73)，但当我开始学习智能体时，我最大的收获是你可以抛弃DAG。不是软件工程师编码每个步骤和边缘情况，而是你可以给智能体一个目标和一组转换：

![025-agent-dag](../../img/025-agent-dag.png)

让大语言模型实时做决策来找出路径：

![026-agent-dag-lines](../../img/026-agent-dag-lines.png)

这里的承诺是你写更少的软件，你只需给大语言模型图的"边"，让它找出节点。你可以从错误中恢复，你可以写更少的代码，你可能会发现大语言模型找到问题的新颖解决方案。

## 智能体作为循环

换句话说，你有这个由3个步骤组成的循环：

1. 大语言模型确定工作流中的下一步，输出结构化json（"工具调用"）
2. 确定性代码执行工具调用
3. 结果被附加到上下文窗口
4. 重复直到下一步被确定为"完成"

```python
initial_event = {"message": "..."}
context = [initial_event]
while True:
  next_step = await llm.determine_next_step(context)
  context.append(next_step)

  if (next_step.intent === "done"):
    return next_step.final_answer

  result = await execute_step(next_step)
  context.append(result)
```

我们的初始上下文只是起始事件（可能是用户消息，可能是cron触发，可能是webhook等），我们要求大语言模型选择下一步（工具）或确定我们已经完成。

这是一个多步骤示例：

[![027-agent-loop-animation](../../img/027-agent-loop-animation.gif)](https://github.com/user-attachments/assets/3beb0966-fdb1-4c12-a47f-ed4e8240f8fd)

生成的"物化"DAG看起来像这样：

![027-agent-loop-dag](../../img/027-agent-loop-dag.png)

[这种模式的问题 →](loop-problems.md)