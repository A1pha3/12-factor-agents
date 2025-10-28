const fs = require('fs-extra');
const path = require('path');

class TerminologyChecker {
  constructor(dictionaryPath) {
    this.dictionaryPath = dictionaryPath;
    this.terminology = [];
    this.loadTerminology();
  }

  async loadTerminology() {
    try {
      const data = await fs.readFile(this.dictionaryPath, 'utf8');
      this.terminology = JSON.parse(data);
      console.log(`📚 加载了 ${this.terminology.length} 个术语定义`);
    } catch (error) {
      console.error('❌ 无法加载术语词典:', error.message);
      process.exit(1);
    }
  }

  // 检查文件中的术语一致性
  async checkFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const issues = [];

    for (const term of this.terminology) {
      const englishRegex = new RegExp(`\\b${this.escapeRegex(term.english)}\\b`, 'gi');
      const chineseRegex = new RegExp(term.chinese, 'g');
      
      const englishMatches = content.match(englishRegex) || [];
      const chineseMatches = content.match(chineseRegex) || [];

      // 检查是否应该保持英文
      if (term.usage === 'keep_english') {
        if (chineseMatches.length > 0) {
          issues.push({
            type: 'should_keep_english',
            term: term.english,
            chinese: term.chinese,
            count: chineseMatches.length,
            message: `术语 "${term.english}" 应保持英文，但发现 ${chineseMatches.length} 处使用了中文 "${term.chinese}"`
          });
        }
      } else {
        // 检查是否应该翻译为中文
        if (englishMatches.length > 0 && chineseMatches.length === 0) {
          issues.push({
            type: 'should_translate',
            term: term.english,
            chinese: term.chinese,
            count: englishMatches.length,
            message: `术语 "${term.english}" 应翻译为 "${term.chinese}"，发现 ${englishMatches.length} 处未翻译`
          });
        }
      }

      // 检查是否使用了不推荐的替代词
      if (term.alternatives && term.alternatives.length > 0) {
        for (const alt of term.alternatives) {
          const altRegex = new RegExp(alt, 'g');
          const altMatches = content.match(altRegex) || [];
          if (altMatches.length > 0) {
            issues.push({
              type: 'alternative_used',
              term: alt,
              preferred: term.chinese,
              count: altMatches.length,
              message: `发现使用了替代词 "${alt}"，建议使用标准术语 "${term.chinese}"`
            });
          }
        }
      }
    }

    return issues;
  }

  // 检查目录中的所有Markdown文件
  async checkDirectory(dirPath) {
    const glob = require('glob');
    const markdownFiles = glob.sync('**/*.md', {
      cwd: dirPath,
      ignore: ['node_modules/**', 'dist/**']
    });

    const allIssues = {};
    let totalIssues = 0;

    for (const file of markdownFiles) {
      const fullPath = path.join(dirPath, file);
      const issues = await this.checkFile(fullPath);
      
      if (issues.length > 0) {
        allIssues[file] = issues;
        totalIssues += issues.length;
      }
    }

    return { files: allIssues, total: totalIssues };
  }

  // 生成术语检查报告
  generateReport(results) {
    console.log('\n📋 术语一致性检查报告');
    console.log('='.repeat(50));

    if (results.total === 0) {
      console.log('✅ 所有文件的术语使用都符合规范！');
      return;
    }

    console.log(`❌ 发现 ${results.total} 个术语问题：\n`);

    for (const [file, issues] of Object.entries(results.files)) {
      console.log(`📄 ${file}:`);
      
      for (const issue of issues) {
        console.log(`  ${this.getIssueIcon(issue.type)} ${issue.message}`);
      }
      console.log('');
    }

    // 按问题类型统计
    const typeStats = {};
    for (const issues of Object.values(results.files)) {
      for (const issue of issues) {
        typeStats[issue.type] = (typeStats[issue.type] || 0) + 1;
      }
    }

    console.log('📊 问题类型统计:');
    for (const [type, count] of Object.entries(typeStats)) {
      console.log(`  ${this.getTypeDescription(type)}: ${count} 个`);
    }
  }

  getIssueIcon(type) {
    const icons = {
      'should_keep_english': '🔤',
      'should_translate': '🔄',
      'alternative_used': '⚠️'
    };
    return icons[type] || '❓';
  }

  getTypeDescription(type) {
    const descriptions = {
      'should_keep_english': '应保持英文',
      'should_translate': '应翻译为中文', 
      'alternative_used': '使用了替代词'
    };
    return descriptions[type] || type;
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // 自动修复术语问题
  async autoFix(filePath, dryRun = true) {
    let content = await fs.readFile(filePath, 'utf8');
    let changes = 0;

    for (const term of this.terminology) {
      if (term.usage === 'preferred') {
        // 将英文术语替换为中文
        const englishRegex = new RegExp(`\\b${this.escapeRegex(term.english)}\\b`, 'g');
        const beforeCount = (content.match(englishRegex) || []).length;
        content = content.replace(englishRegex, term.chinese);
        const afterCount = (content.match(englishRegex) || []).length;
        changes += beforeCount - afterCount;

        // 将替代词替换为标准术语
        if (term.alternatives) {
          for (const alt of term.alternatives) {
            const altRegex = new RegExp(alt, 'g');
            const beforeAltCount = (content.match(altRegex) || []).length;
            content = content.replace(altRegex, term.chinese);
            const afterAltCount = (content.match(altRegex) || []).length;
            changes += beforeAltCount - afterAltCount;
          }
        }
      }
    }

    if (!dryRun && changes > 0) {
      await fs.writeFile(filePath, content);
      console.log(`✅ 已修复 ${filePath} 中的 ${changes} 个术语问题`);
    }

    return { changes, content };
  }
}

module.exports = TerminologyChecker;

// 命令行接口
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const target = args[1] || '.';

  const dictionaryPath = path.join(__dirname, '..', 'config', 'terminology.json');
  const checker = new TerminologyChecker(dictionaryPath);

  async function main() {
    switch (command) {
      case 'check':
        const results = await checker.checkDirectory(target);
        checker.generateReport(results);
        process.exit(results.total > 0 ? 1 : 0);
        break;

      case 'fix':
        const dryRun = !args.includes('--apply');
        if (fs.statSync(target).isFile()) {
          const result = await checker.autoFix(target, dryRun);
          if (dryRun) {
            console.log(`🔍 预览模式: 将修复 ${result.changes} 个问题`);
            console.log('使用 --apply 参数执行实际修复');
          }
        } else {
          console.log('❌ 自动修复目前只支持单个文件');
        }
        break;

      default:
        console.log('用法:');
        console.log('  node terminology-checker.js check [目录]     # 检查术语一致性');
        console.log('  node terminology-checker.js fix [文件] [--apply]  # 修复术语问题');
    }
  }

  main().catch(console.error);
}