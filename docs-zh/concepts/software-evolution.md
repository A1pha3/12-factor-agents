[← 返回主页](../README.md)

# 软件发展简史：从流程图到智能体

## 你不必听我的

无论你是智能体新手还是像我这样的老兵，我都会试图说服你抛弃对AI智能体的大部分既有认知，退一步，从第一性原理重新思考它们。（剧透警告：如果你没有关注几周前OpenAI的响应发布，那么将更多智能体逻辑推到API后面并不是正确的方向）

## 智能体就是软件，以及软件的简史

让我们谈谈我们是如何走到今天的。

### 60年前

我们将大量讨论有向图（DG）和它们的无环朋友DAG。我首先要指出的是...软件就是一个有向图。我们过去用流程图表示程序是有原因的。

![010-software-dag](../../img/010-software-dag.png)

### 20年前

大约20年前，我们开始看到DAG编排器变得流行。我们说的是经典的[Airflow](https://airflow.apache.org/)、[Prefect](https://www.prefect.io/)，一些前身，以及一些较新的，如[Dagster](https://dagster.io/)、[Inngest](https://www.inngest.com/)、[Windmill](https://www.windmill.dev/)。这些遵循相同的图模式，增加了可观察性、模块化、重试、管理等好处。

![015-dag-orchestrators](../../img/015-dag-orchestrators.png)

### 10-15年前

当机器学习模型开始变得足够好用时，我们开始看到DAG中穿插着机器学习模型。你可能想象这样的步骤："将此列中的文本总结到新列中"或"按严重性或情感对支持问题进行分类"。

![020-dags-with-ml](../../img/020-dags-with-ml.png)

但归根结底，它仍然主要是相同的老式确定性软件。

[智能体的承诺 →](agent-promise.md)