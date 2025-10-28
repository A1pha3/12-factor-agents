const fs = require('fs-extra');
const path = require('path');
const TerminologyChecker = require('./terminology-checker');

class QualityAssurance {
  constructor(sourceDir, configPath) {
    this.sourceDir = sourceDir;
    this.configPath = configPath;
    this.terminologyChecker = new TerminologyChecker(
      path.join(sourceDir, 'config', 'terminology.json')
    );
    this.results = {
      terminology: {},
      links: {},
      code: {},
      overall: { passed: false, score: 0 }
    };
  }

  async runAllChecks() {
    console.log('🔍 开始质量检查...\n');

    // 术语一致性检查
    await this.checkTerminology();
    
    // 链接有效性检查
    await this.checkLinks();
    
    // 代码示例检查
    await this.checkCodeExamples();
    
    // 生成总体报告
    this.generateOverallReport();
    
    return this.results;
  }

  async checkTerminology() {
    console.log('📚 检查术语一致性...');
    
    try {
      const results = await this.terminologyChecker.checkDirectory(this.sourceDir);
      this.results.terminology = {
        passed: results.total === 0,
        totalIssues: results.total,
        files: results.files
      };
      
      if (results.total === 0) {
        console.log('✅ 术语一致性检查通过');
      } else {
        console.log(`❌ 发现 ${results.total} 个术语问题`);
      }
    } catch (error) {
      console.error('❌ 术语检查失败:', error.message);
      this.results.terminology = { passed: false, error: error.message };
    }
    
    console.log('');
  }

  async checkLinks() {
    console.log('🔗 检查链接有效性...');
    
    const glob = require('glob');
    const markdownFiles = glob.sync('**/*.md', {
      cwd: this.sourceDir,
      ignore: ['node_modules/**', 'dist/**']
    });

    let totalLinks = 0;
    let brokenLinks = 0;
    const brokenLinkDetails = {};

    for (const file of markdownFiles) {
      const filePath = path.join(this.sourceDir, file);
      const content = await fs.readFile(filePath, 'utf8');
      
      // 提取所有链接
      const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
      let match;
      const fileLinks = [];
      
      while ((match = linkRegex.exec(content)) !== null) {
        const linkText = match[1];
        const linkUrl = match[2];
        totalLinks++;
        
        // 检查内部链接
        if (!linkUrl.startsWith('http') && !linkUrl.startsWith('#')) {
          const targetPath = path.resolve(path.dirname(filePath), linkUrl);
          
          if (!await fs.pathExists(targetPath)) {
            brokenLinks++;
            fileLinks.push({
              text: linkText,
              url: linkUrl,
              type: 'internal'
            });
          }
        }
      }
      
      if (fileLinks.length > 0) {
        brokenLinkDetails[file] = fileLinks;
      }
    }

    this.results.links = {
      passed: brokenLinks === 0,
      totalLinks,
      brokenLinks,
      details: brokenLinkDetails
    };

    if (brokenLinks === 0) {
      console.log(`✅ 链接检查通过 (检查了 ${totalLinks} 个链接)`);
    } else {
      console.log(`❌ 发现 ${brokenLinks} 个无效链接`);
    }
    
    console.log('');
  }

  async checkCodeExamples() {
    console.log('💻 检查代码示例...');
    
    const glob = require('glob');
    const markdownFiles = glob.sync('**/*.md', {
      cwd: this.sourceDir,
      ignore: ['node_modules/**', 'dist/**']
    });

    let totalCodeBlocks = 0;
    let validCodeBlocks = 0;
    const codeIssues = {};

    for (const file of markdownFiles) {
      const filePath = path.join(this.sourceDir, file);
      const content = await fs.readFile(filePath, 'utf8');
      
      // 提取代码块
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      let match;
      const fileIssues = [];
      
      while ((match = codeBlockRegex.exec(content)) !== null) {
        const language = match[1] || 'text';
        const code = match[2];
        totalCodeBlocks++;
        
        // 基本语法检查
        const issues = this.validateCodeBlock(language, code);
        if (issues.length === 0) {
          validCodeBlocks++;
        } else {
          fileIssues.push({
            language,
            issues,
            code: code.substring(0, 100) + '...'
          });
        }
      }
      
      if (fileIssues.length > 0) {
        codeIssues[file] = fileIssues;
      }
    }

    this.results.code = {
      passed: Object.keys(codeIssues).length === 0,
      totalCodeBlocks,
      validCodeBlocks,
      issues: codeIssues
    };

    if (Object.keys(codeIssues).length === 0) {
      console.log(`✅ 代码示例检查通过 (检查了 ${totalCodeBlocks} 个代码块)`);
    } else {
      console.log(`❌ 发现代码问题 (${totalCodeBlocks - validCodeBlocks}/${totalCodeBlocks} 个代码块有问题)`);
    }
    
    console.log('');
  }

  validateCodeBlock(language, code) {
    const issues = [];
    
    // 检查空代码块
    if (!code.trim()) {
      issues.push('代码块为空');
      return issues;
    }
    
    switch (language) {
      case 'javascript':
      case 'typescript':
        // 检查基本语法
        if (!this.hasMatchingBraces(code)) {
          issues.push('括号不匹配');
        }
        if (code.includes('console.log') && !code.includes('//')) {
          // 建议添加注释
        }
        break;
        
      case 'json':
        try {
          JSON.parse(code);
        } catch (error) {
          issues.push('JSON 格式错误');
        }
        break;
        
      case 'yaml':
        try {
          const yaml = require('yaml');
          yaml.parse(code);
        } catch (error) {
          issues.push('YAML 格式错误');
        }
        break;
        
      case 'bash':
      case 'shell':
        // 检查常见的shell命令
        if (code.includes('rm -rf /')) {
          issues.push('包含危险命令');
        }
        break;
    }
    
    return issues;
  }

  hasMatchingBraces(code) {
    const stack = [];
    const pairs = { '(': ')', '[': ']', '{': '}' };
    
    for (const char of code) {
      if (char in pairs) {
        stack.push(char);
      } else if (Object.values(pairs).includes(char)) {
        const last = stack.pop();
        if (!last || pairs[last] !== char) {
          return false;
        }
      }
    }
    
    return stack.length === 0;
  }

  generateOverallReport() {
    console.log('📋 生成总体报告...');
    
    let totalScore = 0;
    let maxScore = 0;
    
    // 术语检查权重: 30%
    maxScore += 30;
    if (this.results.terminology.passed) {
      totalScore += 30;
    } else if (this.results.terminology.totalIssues) {
      // 根据问题数量扣分
      const deduction = Math.min(30, this.results.terminology.totalIssues * 2);
      totalScore += Math.max(0, 30 - deduction);
    }
    
    // 链接检查权重: 40%
    maxScore += 40;
    if (this.results.links.passed) {
      totalScore += 40;
    } else if (this.results.links.brokenLinks) {
      const ratio = this.results.links.brokenLinks / this.results.links.totalLinks;
      totalScore += Math.max(0, 40 * (1 - ratio));
    }
    
    // 代码检查权重: 30%
    maxScore += 30;
    if (this.results.code.passed) {
      totalScore += 30;
    } else if (this.results.code.totalCodeBlocks) {
      const ratio = this.results.code.validCodeBlocks / this.results.code.totalCodeBlocks;
      totalScore += 30 * ratio;
    }
    
    const finalScore = Math.round((totalScore / maxScore) * 100);
    
    this.results.overall = {
      passed: finalScore >= 90,
      score: finalScore,
      grade: this.getGrade(finalScore)
    };
    
    console.log(`📊 总体质量评分: ${finalScore}/100 (${this.results.overall.grade})`);
    
    if (finalScore >= 90) {
      console.log('🎉 文档质量优秀！');
    } else if (finalScore >= 70) {
      console.log('👍 文档质量良好，还有改进空间');
    } else {
      console.log('⚠️ 文档质量需要改进');
    }
  }

  getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  async generateReport() {
    const reportPath = path.join(this.sourceDir, 'quality-report.md');
    let report = '# 文档质量检查报告\n\n';
    
    report += `**生成时间**: ${new Date().toLocaleString('zh-CN')}\n\n`;
    report += `**总体评分**: ${this.results.overall.score}/100 (${this.results.overall.grade})\n\n`;
    
    // 术语检查结果
    report += '## 术语一致性检查\n\n';
    if (this.results.terminology.passed) {
      report += '✅ **通过** - 所有术语使用符合规范\n\n';
    } else {
      report += `❌ **未通过** - 发现 ${this.results.terminology.totalIssues} 个问题\n\n`;
      
      if (this.results.terminology.files) {
        for (const [file, issues] of Object.entries(this.results.terminology.files)) {
          report += `### ${file}\n\n`;
          for (const issue of issues) {
            report += `- ${issue.message}\n`;
          }
          report += '\n';
        }
      }
    }
    
    // 链接检查结果
    report += '## 链接有效性检查\n\n';
    if (this.results.links.passed) {
      report += `✅ **通过** - 检查了 ${this.results.links.totalLinks} 个链接，全部有效\n\n`;
    } else {
      report += `❌ **未通过** - ${this.results.links.brokenLinks}/${this.results.links.totalLinks} 个链接无效\n\n`;
      
      for (const [file, links] of Object.entries(this.results.links.details)) {
        report += `### ${file}\n\n`;
        for (const link of links) {
          report += `- [${link.text}](${link.url}) - ${link.type === 'internal' ? '内部链接' : '外部链接'}无效\n`;
        }
        report += '\n';
      }
    }
    
    // 代码检查结果
    report += '## 代码示例检查\n\n';
    if (this.results.code.passed) {
      report += `✅ **通过** - 检查了 ${this.results.code.totalCodeBlocks} 个代码块，全部有效\n\n`;
    } else {
      report += `❌ **未通过** - ${this.results.code.validCodeBlocks}/${this.results.code.totalCodeBlocks} 个代码块有效\n\n`;
      
      for (const [file, issues] of Object.entries(this.results.code.issues)) {
        report += `### ${file}\n\n`;
        for (const issue of issues) {
          report += `- **${issue.language}** 代码块问题: ${issue.issues.join(', ')}\n`;
        }
        report += '\n';
      }
    }
    
    await fs.writeFile(reportPath, report);
    console.log(`📄 质量报告已保存到: ${reportPath}`);
  }
}

module.exports = QualityAssurance;

// 命令行接口
if (require.main === module) {
  const sourceDir = path.resolve(__dirname, '..');
  const configPath = path.join(sourceDir, 'config.yml');
  
  const qa = new QualityAssurance(sourceDir, configPath);
  
  qa.runAllChecks()
    .then(() => qa.generateReport())
    .catch(console.error);
}