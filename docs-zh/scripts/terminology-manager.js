const fs = require('fs-extra');
const path = require('path');

class TerminologyManager {
  constructor(dictionaryPath) {
    this.dictionaryPath = dictionaryPath;
    this.terminology = new Map();
    this.categories = new Set();
    this.loadTerminology();
  }

  async loadTerminology() {
    try {
      const data = await fs.readFile(this.dictionaryPath, 'utf8');
      const terms = JSON.parse(data);
      
      for (const term of terms) {
        this.terminology.set(term.english.toLowerCase(), term);
        this.categories.add(term.category);
      }
      
      console.log(`📚 加载了 ${this.terminology.size} 个术语定义`);
      console.log(`📂 包含 ${this.categories.size} 个分类: ${Array.from(this.categories).join(', ')}`);
    } catch (error) {
      console.error('❌ 无法加载术语词典:', error.message);
      throw error;
    }
  }

  // 获取术语翻译
  getTranslation(englishTerm) {
    const term = this.terminology.get(englishTerm.toLowerCase());
    return term ? term.chinese : null;
  }

  // 检查术语是否应该保持英文
  shouldKeepEnglish(englishTerm) {
    const term = this.terminology.get(englishTerm.toLowerCase());
    return term ? term.usage === 'keep_english' : false;
  }

  // 获取术语的替代词
  getAlternatives(englishTerm) {
    const term = this.terminology.get(englishTerm.toLowerCase());
    return term ? term.alternatives || [] : [];
  }

  // 添加新术语
  async addTerm(englishTerm, chineseTerm, category, context, alternatives = [], usage = 'preferred') {
    const newTerm = {
      english: englishTerm,
      chinese: chineseTerm,
      category,
      context,
      alternatives,
      usage
    };

    this.terminology.set(englishTerm.toLowerCase(), newTerm);
    this.categories.add(category);

    // 保存到文件
    await this.saveTerminology();
    console.log(`✅ 添加新术语: ${englishTerm} -> ${chineseTerm}`);
  }

  // 更新术语
  async updateTerm(englishTerm, updates) {
    const term = this.terminology.get(englishTerm.toLowerCase());
    if (!term) {
      throw new Error(`术语 "${englishTerm}" 不存在`);
    }

    Object.assign(term, updates);
    await this.saveTerminology();
    console.log(`✅ 更新术语: ${englishTerm}`);
  }

  // 删除术语
  async removeTerm(englishTerm) {
    if (this.terminology.delete(englishTerm.toLowerCase())) {
      await this.saveTerminology();
      console.log(`✅ 删除术语: ${englishTerm}`);
    } else {
      console.log(`⚠️ 术语 "${englishTerm}" 不存在`);
    }
  }

  // 保存术语到文件
  async saveTerminology() {
    const terms = Array.from(this.terminology.values());
    await fs.writeFile(this.dictionaryPath, JSON.stringify(terms, null, 2));
  }

  // 按分类获取术语
  getTermsByCategory(category) {
    return Array.from(this.terminology.values())
      .filter(term => term.category === category);
  }

  // 搜索术语
  searchTerms(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    for (const term of this.terminology.values()) {
      if (term.english.toLowerCase().includes(lowerQuery) ||
          term.chinese.includes(query) ||
          (term.context && term.context.includes(query))) {
        results.push(term);
      }
    }

    return results;
  }

  // 生成术语表HTML
  generateGlossaryHtml() {
    const categories = Array.from(this.categories).sort();
    let html = '<div class="terminology-glossary">\n';
    
    for (const category of categories) {
      const terms = this.getTermsByCategory(category).sort((a, b) => 
        a.english.localeCompare(b.english)
      );
      
      if (terms.length === 0) continue;
      
      html += `  <section class="category-section">\n`;
      html += `    <h3 class="category-title">${this.getCategoryTitle(category)}</h3>\n`;
      html += `    <dl class="term-list">\n`;
      
      for (const term of terms) {
        html += `      <dt class="term-english">${term.english}</dt>\n`;
        html += `      <dd class="term-chinese">\n`;
        html += `        <span class="translation">${term.chinese}</span>\n`;
        
        if (term.context) {
          html += `        <span class="context">${term.context}</span>\n`;
        }
        
        if (term.alternatives && term.alternatives.length > 0) {
          html += `        <span class="alternatives">替代词: ${term.alternatives.join(', ')}</span>\n`;
        }
        
        html += `      </dd>\n`;
      }
      
      html += `    </dl>\n`;
      html += `  </section>\n`;
    }
    
    html += '</div>\n';
    return html;
  }

  getCategoryTitle(category) {
    const titles = {
      'technical': '技术术语',
      'concept': '概念术语',
      'tool': '工具名称'
    };
    return titles[category] || category;
  }

  // 生成术语表Markdown
  generateGlossaryMarkdown() {
    const categories = Array.from(this.categories).sort();
    let markdown = '# 术语表\n\n';
    
    for (const category of categories) {
      const terms = this.getTermsByCategory(category).sort((a, b) => 
        a.english.localeCompare(b.english)
      );
      
      if (terms.length === 0) continue;
      
      markdown += `## ${this.getCategoryTitle(category)}\n\n`;
      
      for (const term of terms) {
        markdown += `### ${term.english}\n\n`;
        markdown += `**中文翻译**: ${term.chinese}\n\n`;
        
        if (term.context) {
          markdown += `**说明**: ${term.context}\n\n`;
        }
        
        if (term.alternatives && term.alternatives.length > 0) {
          markdown += `**替代词**: ${term.alternatives.join(', ')}\n\n`;
        }
        
        if (term.usage === 'keep_english') {
          markdown += `**使用建议**: 保持英文\n\n`;
        }
        
        markdown += '---\n\n';
      }
    }
    
    return markdown;
  }

  // 验证术语一致性
  validateConsistency() {
    const issues = [];
    
    // 检查重复的中文翻译
    const chineseTerms = new Map();
    for (const [english, term] of this.terminology) {
      if (chineseTerms.has(term.chinese)) {
        issues.push({
          type: 'duplicate_chinese',
          message: `中文术语 "${term.chinese}" 对应多个英文术语: ${english}, ${chineseTerms.get(term.chinese)}`
        });
      } else {
        chineseTerms.set(term.chinese, english);
      }
    }
    
    // 检查缺失的上下文
    for (const [english, term] of this.terminology) {
      if (!term.context || term.context.trim() === '') {
        issues.push({
          type: 'missing_context',
          message: `术语 "${english}" 缺少上下文说明`
        });
      }
    }
    
    return issues;
  }

  // 生成统计报告
  generateStats() {
    const stats = {
      total: this.terminology.size,
      categories: {},
      usage: {}
    };
    
    for (const term of this.terminology.values()) {
      // 按分类统计
      stats.categories[term.category] = (stats.categories[term.category] || 0) + 1;
      
      // 按使用方式统计
      stats.usage[term.usage] = (stats.usage[term.usage] || 0) + 1;
    }
    
    return stats;
  }
}

module.exports = TerminologyManager;

// 命令行接口
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const dictionaryPath = path.join(__dirname, '..', 'config', 'terminology.json');
  const manager = new TerminologyManager(dictionaryPath);

  async function main() {
    switch (command) {
      case 'add':
        if (args.length < 4) {
          console.log('用法: node terminology-manager.js add <英文> <中文> <分类> [上下文]');
          return;
        }
        await manager.addTerm(args[1], args[2], args[3], args[4] || '');
        break;

      case 'search':
        if (args.length < 2) {
          console.log('用法: node terminology-manager.js search <查询词>');
          return;
        }
        const results = manager.searchTerms(args[1]);
        console.log(`找到 ${results.length} 个结果:`);
        results.forEach(term => {
          console.log(`  ${term.english} -> ${term.chinese} (${term.category})`);
        });
        break;

      case 'stats':
        const stats = manager.generateStats();
        console.log('📊 术语统计:');
        console.log(`总数: ${stats.total}`);
        console.log('分类分布:', stats.categories);
        console.log('使用方式:', stats.usage);
        break;

      case 'validate':
        const issues = manager.validateConsistency();
        if (issues.length === 0) {
          console.log('✅ 术语一致性检查通过');
        } else {
          console.log(`❌ 发现 ${issues.length} 个问题:`);
          issues.forEach(issue => console.log(`  ${issue.message}`));
        }
        break;

      case 'export':
        const format = args[1] || 'markdown';
        if (format === 'html') {
          const html = manager.generateGlossaryHtml();
          await fs.writeFile('terminology.html', html);
          console.log('✅ 已导出 HTML 格式术语表');
        } else {
          const markdown = manager.generateGlossaryMarkdown();
          await fs.writeFile('terminology.md', markdown);
          console.log('✅ 已导出 Markdown 格式术语表');
        }
        break;

      default:
        console.log('可用命令:');
        console.log('  add <英文> <中文> <分类> [上下文]  # 添加术语');
        console.log('  search <查询词>                    # 搜索术语');
        console.log('  stats                             # 显示统计信息');
        console.log('  validate                          # 验证一致性');
        console.log('  export [html|markdown]            # 导出术语表');
    }
  }

  main().catch(console.error);
}