const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

class NavigationGenerator {
  constructor(sourceDir, outputDir) {
    this.sourceDir = sourceDir;
    this.outputDir = outputDir;
    this.navigation = {
      title: '12-Factor Agents',
      children: []
    };
  }

  async generate() {
    console.log('🧭 生成导航结构...');
    
    // 扫描所有Markdown文件
    const markdownFiles = glob.sync('**/*.md', {
      cwd: this.sourceDir,
      ignore: ['node_modules/**', 'dist/**', 'scripts/**']
    });

    // 构建导航树
    await this.buildNavigationTree(markdownFiles);
    
    // 生成导航文件
    await this.writeNavigationFiles();
    
    console.log('✅ 导航结构生成完成');
  }

  async buildNavigationTree(files) {
    const structure = {};
    
    for (const file of files) {
      const parts = file.split('/');
      const fileName = parts[parts.length - 1];
      
      // 跳过README文件，它们会被处理为目录索引
      if (fileName === 'README.md') {
        continue;
      }
      
      let current = structure;
      
      // 构建目录结构
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = {
            type: 'directory',
            children: {},
            path: parts.slice(0, i + 1).join('/'),
            title: this.formatTitle(part)
          };
        }
        current = current[part].children;
      }
      
      // 添加文件
      const fileKey = fileName.replace('.md', '');
      current[fileKey] = {
        type: 'file',
        path: file,
        title: await this.extractTitle(file),
        order: this.getFileOrder(file)
      };
    }
    
    // 转换为导航格式
    this.navigation.children = this.convertToNavigation(structure);
  }

  convertToNavigation(structure) {
    const items = [];
    
    // 按预定义顺序排序
    const orderedKeys = this.getOrderedKeys(Object.keys(structure));
    
    for (const key of orderedKeys) {
      const item = structure[key];
      
      if (item.type === 'directory') {
        items.push({
          title: item.title,
          path: `/${item.path}/`,
          children: this.convertToNavigation(item.children),
          type: 'directory'
        });
      } else {
        items.push({
          title: item.title,
          path: `/${item.path.replace('.md', '.html')}`,
          type: 'file',
          order: item.order
        });
      }
    }
    
    // 按order字段排序文件
    items.sort((a, b) => {
      if (a.type === 'directory' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'directory') return 1;
      return (a.order || 999) - (b.order || 999);
    });
    
    return items;
  }

  getOrderedKeys(keys) {
    const order = [
      'getting-started',
      'concepts', 
      'factors',
      'tutorials',
      'tools',
      'best-practices',
      'community'
    ];
    
    const ordered = [];
    const remaining = [...keys];
    
    // 按预定义顺序添加
    for (const key of order) {
      if (remaining.includes(key)) {
        ordered.push(key);
        remaining.splice(remaining.indexOf(key), 1);
      }
    }
    
    // 添加剩余的键
    ordered.push(...remaining.sort());
    
    return ordered;
  }

  getFileOrder(filePath) {
    const fileName = path.basename(filePath, '.md');
    
    // 特殊文件的排序
    const specialOrder = {
      'introduction': 1,
      'installation': 2,
      'first-agent': 3,
      'overview': 1,
      'terminology': 2,
      'agent-architecture': 3
    };
    
    if (specialOrder[fileName]) {
      return specialOrder[fileName];
    }
    
    // 因子文件按数字排序
    const factorMatch = fileName.match(/factor-(\d+)/);
    if (factorMatch) {
      return parseInt(factorMatch[1]);
    }
    
    return 999;
  }

  async extractTitle(filePath) {
    try {
      const fullPath = path.join(this.sourceDir, filePath);
      const content = await fs.readFile(fullPath, 'utf8');
      
      // 提取第一个标题
      const titleMatch = content.match(/^#\s+(.+)$/m);
      if (titleMatch) {
        return titleMatch[1].trim();
      }
      
      // 如果没有找到标题，使用文件名
      return this.formatTitle(path.basename(filePath, '.md'));
    } catch (error) {
      return this.formatTitle(path.basename(filePath, '.md'));
    }
  }

  formatTitle(name) {
    // 格式化标题
    const titleMap = {
      'getting-started': '快速开始',
      'concepts': '核心概念',
      'factors': '12个因子',
      'tutorials': '实践教程',
      'tools': '工具指南',
      'best-practices': '最佳实践',
      'community': '社区资源',
      'workshop': 'Workshop教程',
      'examples': '代码示例',
      'advanced': '高级教程',
      'introduction': '项目介绍',
      'installation': '环境配置',
      'first-agent': '第一个智能体',
      'overview': '概述',
      'terminology': '术语表',
      'agent-architecture': '智能体架构'
    };
    
    if (titleMap[name]) {
      return titleMap[name];
    }
    
    // 处理因子文件名
    const factorMatch = name.match(/factor-(\d+)-(.+)/);
    if (factorMatch) {
      const num = factorMatch[1];
      const title = factorMatch[2].replace(/-/g, ' ');
      return `因子${num}: ${this.capitalizeWords(title)}`;
    }
    
    // 默认格式化
    return this.capitalizeWords(name.replace(/-/g, ' '));
  }

  capitalizeWords(str) {
    return str.replace(/\b\w/g, l => l.toUpperCase());
  }

  async writeNavigationFiles() {
    // 写入JSON格式的导航文件
    const navPath = path.join(this.outputDir, 'navigation.json');
    await fs.writeFile(navPath, JSON.stringify(this.navigation, null, 2));
    
    // 生成HTML格式的导航
    const navHtml = this.generateNavigationHtml(this.navigation.children);
    const navHtmlPath = path.join(this.outputDir, 'navigation.html');
    await fs.writeFile(navHtmlPath, navHtml);
    
    // 生成面包屑导航数据
    const breadcrumbs = this.generateBreadcrumbsData(this.navigation.children);
    const breadcrumbsPath = path.join(this.outputDir, 'breadcrumbs.json');
    await fs.writeFile(breadcrumbsPath, JSON.stringify(breadcrumbs, null, 2));
  }

  generateNavigationHtml(items, level = 0) {
    if (!items || items.length === 0) return '';
    
    const className = level === 0 ? 'nav-main' : 'nav-sub';
    let html = `<ul class="${className}">`;
    
    for (const item of items) {
      html += '<li>';
      
      if (item.type === 'directory') {
        html += `<span class="nav-directory">${item.title}</span>`;
        if (item.children && item.children.length > 0) {
          html += this.generateNavigationHtml(item.children, level + 1);
        }
      } else {
        html += `<a href="${item.path}" class="nav-link">${item.title}</a>`;
      }
      
      html += '</li>';
    }
    
    html += '</ul>';
    return html;
  }

  generateBreadcrumbsData(items, parentPath = []) {
    const breadcrumbs = {};
    
    for (const item of items) {
      const currentPath = [...parentPath, item.title];
      
      if (item.type === 'file') {
        breadcrumbs[item.path] = currentPath;
      }
      
      if (item.children) {
        Object.assign(breadcrumbs, this.generateBreadcrumbsData(item.children, currentPath));
      }
    }
    
    return breadcrumbs;
  }
}

module.exports = NavigationGenerator;

// 命令行接口
if (require.main === module) {
  const sourceDir = path.resolve(__dirname, '..');
  const outputDir = path.resolve(__dirname, '..', 'dist');
  
  const generator = new NavigationGenerator(sourceDir, outputDir);
  generator.generate().catch(console.error);
}