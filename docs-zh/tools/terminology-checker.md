# 术语一致性检查工具

本工具用于检查12-Factor Agents中文文档中术语使用的一致性，确保翻译质量。

## 使用方法

```bash
# 安装依赖
npm install

# 运行术语检查
npm run check-terminology

# 生成术语报告
npm run terminology-report
```

## 检查规则

### 1. 术语一致性检查

检查同一英文术语是否始终使用相同的中文翻译：

```typescript
interface TerminologyRule {
  english: string;
  chinese: string;
  category: 'technical' | 'concept' | 'tool';
  strictMatch: boolean; // 是否要求严格匹配
}

const rules: TerminologyRule[] = [
  {
    english: "Agent",
    chinese: "智能体",
    category: "technical",
    strictMatch: true
  },
  {
    english: "Tool Calling",
    chinese: "工具调用", 
    category: "technical",
    strictMatch: true
  }
  // ... 更多规则
];
```

### 2. 首次出现格式检查

确保术语首次出现时使用"中文（英文）"格式：

```markdown
✅ 正确：智能体（Agent）是AI系统中的自主决策单元
❌ 错误：Agent是AI系统中的自主决策单元
❌ 错误：智能体是AI系统中的自主决策单元
```

### 3. 代码中术语检查

确保代码示例中保持英文原文：

```typescript
// ✅ 正确：代码中保持英文
export async function agentLoop(thread: Thread): Promise<Thread> {
  // 中文注释：智能体主循环
}

// ❌ 错误：代码中使用中文
export async function 智能体循环(线程: 线程): Promise<线程> {
}
```

## 配置文件

### terminology-config.json

```json
{
  "rules": {
    "strictMode": true,
    "checkFirstOccurrence": true,
    "allowedVariations": {
      "Agent": ["智能体", "代理"],
      "Framework": ["框架", "架构"]
    }
  },
  "excludePatterns": [
    "*.md#code-block",
    "examples/**/*.ts",
    "assets/**/*"
  ],
  "customRules": [
    {
      "pattern": "\\b(Agent|agent)\\b",
      "replacement": "智能体",
      "context": "non-code"
    }
  ]
}
```

### 检查脚本

```javascript
// scripts/check-terminology.js
const fs = require('fs');
const path = require('path');
const glob = require('glob');

class TerminologyChecker {
  constructor(configPath) {
    this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    this.errors = [];
    this.warnings = [];
  }

  checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      this.checkLine(line, filePath, index + 1);
    });
  }

  checkLine(line, filePath, lineNumber) {
    // 检查术语一致性
    this.config.rules.customRules.forEach(rule => {
      const regex = new RegExp(rule.pattern, 'g');
      const matches = line.match(regex);
      
      if (matches && !this.isInCodeBlock(line)) {
        this.warnings.push({
          file: filePath,
          line: lineNumber,
          message: `建议使用"${rule.replacement}"替代"${matches[0]}"`,
          type: 'terminology'
        });
      }
    });
  }

  isInCodeBlock(line) {
    // 简单检查是否在代码块中
    return line.trim().startsWith('```') || 
           line.trim().startsWith('    ') ||
           line.includes('`');
  }

  generateReport() {
    const report = {
      summary: {
        totalFiles: this.checkedFiles,
        errors: this.errors.length,
        warnings: this.warnings.length
      },
      issues: [...this.errors, ...this.warnings]
    };

    fs.writeFileSync('terminology-report.json', JSON.stringify(report, null, 2));
    console.log(`检查完成：${this.errors.length} 个错误，${this.warnings.length} 个警告`);
  }
}

// 使用示例
const checker = new TerminologyChecker('./terminology-config.json');
const files = glob.sync('docs-zh/**/*.md');

files.forEach(file => {
  checker.checkFile(file);
});

checker.generateReport();
```

## 自动修复工具

### 术语替换脚本

```javascript
// scripts/fix-terminology.js
const fs = require('fs');
const path = require('path');

class TerminologyFixer {
  constructor(configPath) {
    this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    this.config.rules.customRules.forEach(rule => {
      const regex = new RegExp(rule.pattern, 'g');
      const newContent = content.replace(regex, (match, ...args) => {
        // 检查是否在代码块中
        const fullMatch = args[args.length - 1];
        const index = args[args.length - 2];
        
        if (this.isInCodeContext(content, index)) {
          return match; // 保持原样
        }
        
        modified = true;
        return rule.replacement;
      });
      
      content = newContent;
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`已修复：${filePath}`);
    }
  }

  isInCodeContext(content, index) {
    // 检查是否在代码块或行内代码中
    const beforeText = content.substring(0, index);
    const codeBlockCount = (beforeText.match(/```/g) || []).length;
    const inlineCodeCount = (beforeText.match(/`/g) || []).length;
    
    return codeBlockCount % 2 === 1 || inlineCodeCount % 2 === 1;
  }
}
```

## 集成到 CI/CD

### GitHub Actions 配置

```yaml
# .github/workflows/terminology-check.yml
name: 术语一致性检查

on:
  pull_request:
    paths:
      - 'docs-zh/**/*.md'

jobs:
  terminology-check:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        
    - name: Install dependencies
      run: npm install
      
    - name: Run terminology check
      run: npm run check-terminology
      
    - name: Upload report
      uses: actions/upload-artifact@v3
      with:
        name: terminology-report
        path: terminology-report.json
        
    - name: Comment PR
      if: failure()
      uses: actions/github-script@v6
      with:
        script: |
          const fs = require('fs');
          const report = JSON.parse(fs.readFileSync('terminology-report.json', 'utf8'));
          
          const comment = `## 术语检查报告
          
          发现 ${report.summary.errors} 个错误和 ${report.summary.warnings} 个警告。
          
          请查看详细报告并修复术语使用问题。`;
          
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: comment
          });
```

## 使用指南

### 1. 日常检查

```bash
# 检查所有文档
npm run check-terminology

# 检查特定文件
npm run check-terminology -- docs-zh/factors/factor-01-*.md

# 生成详细报告
npm run terminology-report -- --verbose
```

### 2. 自动修复

```bash
# 自动修复常见问题
npm run fix-terminology

# 预览修复（不实际修改文件）
npm run fix-terminology -- --dry-run

# 修复特定类型的问题
npm run fix-terminology -- --type=consistency
```

### 3. 添加新术语

```bash
# 交互式添加新术语
npm run add-terminology

# 从文件批量导入
npm run import-terminology -- terminology-additions.json
```

## 最佳实践

1. **提交前检查**：每次提交前运行术语检查
2. **定期更新**：定期更新术语表和检查规则
3. **团队协作**：团队成员共同维护术语标准
4. **持续改进**：根据检查结果不断优化规则

这个工具确保了12-Factor Agents中文文档的术语使用保持高度一致性和专业性。