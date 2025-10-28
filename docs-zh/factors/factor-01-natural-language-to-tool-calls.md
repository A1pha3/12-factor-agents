[← 返回主页](../README.md)

# 因子1: 自然语言到工具调用

智能体构建中最常见的模式之一是将自然语言转换为结构化的工具调用。这是一个强大的模式，允许你构建能够推理任务并执行它们的智能体。

![110-natural-language-tool-calls](../assets/images/110-natural-language-tool-calls.png)

这种模式在原子级应用时，是将类似这样的短语进行简单转换：

> 你能为Terri创建一个750美元的付款链接，用于赞助二月份的AI修补匠聚会吗？

转换为描述Stripe API调用的结构化对象：

```json
{
  "function": {
    "name": "create_payment_link",
    "parameters": {
      "amount": 750,
      "customer": "cust_128934ddasf9", 
      "product": "prod_8675309",
      "price": "prc_09874329fds",
      "quantity": 1,
      "memo": "嗨Jeff - 请查看下面二月份AI修补匠聚会的付款链接"
    }
  }
}
```

**注意**: 实际上Stripe API更复杂一些，一个[真正执行此操作的智能体](https://github.com/dexhorthy/mailcrew)（[视频](https://www.youtube.com/watch?v=f_cKnoPC_Oo)）会列出客户、列出产品、列出价格等来构建带有正确ID的有效载荷，或者在提示词/上下文窗口中包含这些ID（我们将在下面看到这些其实是同一回事！）

从那里，确定性代码可以接收有效载荷并对其进行处理。（更多内容请参见[因子3](factor-03-own-your-context-window.md)）

```python
# 大语言模型接收自然语言并返回结构化对象
nextStep = await llm.determineNextStep(
  """
  为Jeff创建一个750美元的付款链接
  用于赞助二月份的AI修补匠聚会
  """
  )

# 根据结构化输出的函数处理
if nextStep.function == 'create_payment_link':
    stripe.paymentlinks.create(nextStep.parameters)
    return  # 或者你想要的任何操作，见下文
elif nextStep.function == 'something_else':
    # ... 更多情况
    pass
else:  # 模型没有调用我们知道的工具
    # 做其他事情
    pass
```

**注意**: 虽然完整的智能体会接收API调用结果并循环处理，最终返回类似这样的内容：

> 我已成功为Terri创建了一个750美元的付款链接，用于赞助二月份的AI修补匠聚会。链接如下：https://buy.stripe.com/test_1234567890

**相反**，我们实际上要跳过这一步，将其保存到另一个因子中，你可能想要也可能不想要合并（由你决定！）

## 核心原理

### 1. 结构化输出优于自由文本

传统的聊天机器人返回自由格式的文本响应，这使得程序化处理变得困难。12-factor智能体将大语言模型的输出视为结构化数据，使后续处理变得可预测和可靠。

### 2. 明确的意图识别

通过将自然语言转换为明确的函数调用，我们可以：
- 准确理解用户意图
- 验证参数的完整性和正确性
- 提供类型安全的接口
- 实现可测试的业务逻辑

### 3. 分离关注点

这种模式将以下职责清晰分离：
- **大语言模型**: 负责理解自然语言并生成结构化输出
- **应用代码**: 负责执行具体的业务逻辑
- **工具函数**: 负责与外部系统交互

## 实现最佳实践

### 使用BAML进行类型安全的工具调用

```rust
// baml_src/tools.baml
enum PaymentTools {
  CreatePaymentLink {
    amount: int
    customer_id: string
    product_id: string
    memo: string
  }
  
  RefundPayment {
    payment_id: string
    amount: int?
    reason: string
  }
}

function DeterminePaymentAction(user_request: string) -> PaymentTools {
  client "openai/gpt-4o"
  prompt #"
    用户请求: {{ user_request }}
    
    请分析用户的请求并返回相应的付款操作。
    确保提取所有必要的参数。
    
    {{ ctx.output_format }}
  "#
}
```

### TypeScript实现示例

```typescript
import { DeterminePaymentAction } from './baml_client';

// 智能体处理函数
async function handlePaymentRequest(userMessage: string) {
  // 将自然语言转换为结构化工具调用
  const action = await DeterminePaymentAction(userMessage);
  
  // 基于结构化输出执行相应操作
  switch (action.type) {
    case 'CreatePaymentLink':
      return await createPaymentLink(action.data);
      
    case 'RefundPayment':
      return await processRefund(action.data);
      
    default:
      throw new Error(`未知的付款操作: ${action.type}`);
  }
}

// 具体的业务逻辑实现
async function createPaymentLink(params: CreatePaymentLinkParams) {
  // 验证参数
  if (params.amount <= 0) {
    throw new Error('付款金额必须大于0');
  }
  
  // 调用Stripe API
  const paymentLink = await stripe.paymentLinks.create({
    line_items: [{
      price: params.product_id,
      quantity: 1,
    }],
    metadata: {
      customer_id: params.customer_id,
      memo: params.memo
    }
  });
  
  return {
    success: true,
    payment_link: paymentLink.url,
    message: `已创建付款链接: ${paymentLink.url}`
  };
}
```

## 错误处理和验证

### 参数验证

```typescript
import { z } from 'zod';

// 定义验证模式
const PaymentLinkSchema = z.object({
  amount: z.number().positive('金额必须为正数'),
  customer_id: z.string().min(1, '客户ID不能为空'),
  product_id: z.string().min(1, '产品ID不能为空'),
  memo: z.string().optional()
});

// 在执行前验证参数
function validatePaymentParams(params: unknown) {
  try {
    return PaymentLinkSchema.parse(params);
  } catch (error) {
    throw new Error(`参数验证失败: ${error.message}`);
  }
}
```

### 优雅的错误处理

```typescript
async function safeHandlePaymentRequest(userMessage: string) {
  try {
    const action = await DeterminePaymentAction(userMessage);
    const validatedParams = validatePaymentParams(action.data);
    return await executePaymentAction(action.type, validatedParams);
  } catch (error) {
    // 记录错误并返回用户友好的消息
    console.error('付款请求处理失败:', error);
    
    return {
      success: false,
      error: '抱歉，我无法处理您的付款请求。请检查您的输入并重试。',
      details: error.message
    };
  }
}
```

## 测试策略

### 单元测试工具调用

```typescript
import { describe, test, expect } from '@jest/globals';

describe('付款工具调用', () => {
  test('应该正确解析创建付款链接请求', async () => {
    const userRequest = '为张三创建一个500元的付款链接，用于购买课程';
    
    const result = await DeterminePaymentAction(userRequest);
    
    expect(result.type).toBe('CreatePaymentLink');
    expect(result.data.amount).toBe(500);
    expect(result.data.memo).toContain('课程');
  });
  
  test('应该处理退款请求', async () => {
    const userRequest = '退款订单 pay_123456，金额200元，原因是客户取消';
    
    const result = await DeterminePaymentAction(userRequest);
    
    expect(result.type).toBe('RefundPayment');
    expect(result.data.payment_id).toBe('pay_123456');
    expect(result.data.amount).toBe(200);
    expect(result.data.reason).toContain('客户取消');
  });
});
```

### BAML测试

```rust
// baml_src/tests.baml
test TestPaymentLinkCreation {
  functions [DeterminePaymentAction]
  args {
    user_request "为李四创建一个1000元的付款链接用于购买VIP会员"
  }
  assert {
    output.type == "CreatePaymentLink"
    output.data.amount == 1000
    output.data.memo.contains("VIP会员")
  }
}
```

## 与其他因子的关系

这个因子为后续因子奠定了基础：

- **[因子2: 掌控你的提示词](factor-02-own-your-prompts.md)** - 如何精确控制工具调用的提示词
- **[因子3: 掌控你的上下文窗口](factor-03-own-your-context-window.md)** - 如何管理工具调用的上下文
- **[因子4: 工具即结构化输出](factor-04-tools-are-structured-outputs.md)** - 深入探讨工具调用的设计模式

[← 我们如何走到这里](../concepts/brief-history-of-software.md) | [掌控你的提示词 →](factor-02-own-your-prompts.md)