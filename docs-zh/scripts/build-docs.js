const fs = require('fs-extra');
const path = require('path');
const marked = require('marked');
const matter = require('gray-matter');
const glob = require('glob');

class DocumentationBuilder {
  constructor(config) {
    this.config = config;
    this.sourceDir = path.resolve(__dirname, '..');
    this.outputDir = path.resolve(__dirname, '..', config.build.outputDir);
  }

  async build() {
    console.log('🚀 开始构建中文文档...');
    
    // 清理输出目录
    await fs.emptyDir(this.outputDir);
    
    // 创建必要的目录
    await this.createDirectories();
    
    // 处理Markdown文件
    await this.processMarkdownFiles();
    
    // 复制静态资源
    await this.copyAssets();
    
    // 生成导航索引
    await this.generateNavigation();
    
    // 生成搜索索引
    await this.generateSearchIndex();
    
    console.log('✅ 文档构建完成！');
  }

  async createDirectories() {
    const dirs = [
      'assets/images',
      'assets/diagrams', 
      'assets/videos',
      'css',
      'js'
    ];
    
    for (const dir of dirs) {
      await fs.ensureDir(path.join(this.outputDir, dir));
    }
  }

  async processMarkdownFiles() {
    const markdownFiles = glob.sync('**/*.md', {
      cwd: this.sourceDir,
      ignore: ['node_modules/**', 'dist/**', 'scripts/**']
    });

    for (const file of markdownFiles) {
      await this.processMarkdownFile(file);
    }
  }

  async processMarkdownFile(filePath) {
    const fullPath = path.join(this.sourceDir, filePath);
    const content = await fs.readFile(fullPath, 'utf8');
    const { data: frontmatter, content: markdown } = matter(content);
    
    // 处理Markdown内容
    const processedMarkdown = await this.processMarkdownContent(markdown);
    
    // 转换为HTML
    const html = marked(processedMarkdown);
    
    // 生成完整的HTML页面
    const fullHtml = await this.generateHtmlPage(html, frontmatter, filePath);
    
    // 写入输出文件
    const outputPath = path.join(this.outputDir, filePath.replace('.md', '.html'));
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, fullHtml);
    
    console.log(`📄 处理文件: ${filePath}`);
  }

  async processMarkdownContent(markdown) {
    // 处理图片路径
    markdown = markdown.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
      if (!src.startsWith('http') && !src.startsWith('/')) {
        src = `/assets/images/${src}`;
      }
      return `![${alt}](${src})`;
    });

    // 处理代码块语法高亮
    markdown = markdown.replace(/```(\w+)\n([\s\S]*?)```/g, (match, lang, code) => {
      return `\`\`\`${lang}\n${code}\`\`\``;
    });

    return markdown;
  }

  async generateHtmlPage(content, frontmatter, filePath) {
    const template = await this.loadTemplate('page.html');
    
    return template
      .replace('{{title}}', frontmatter.title || '12-Factor Agents')
      .replace('{{description}}', frontmatter.description || '')
      .replace('{{content}}', content)
      .replace('{{navigation}}', await this.generateNavigationHtml())
      .replace('{{breadcrumbs}}', this.generateBreadcrumbs(filePath));
  }

  async loadTemplate(templateName) {
    const templatePath = path.join(__dirname, '..', 'templates', templateName);
    return await fs.readFile(templatePath, 'utf8');
  }

  async copyAssets() {
    const assetsSource = path.join(this.sourceDir, 'assets');
    const assetsTarget = path.join(this.outputDir, 'assets');
    
    if (await fs.pathExists(assetsSource)) {
      await fs.copy(assetsSource, assetsTarget);
    }
    
    // 复制根目录的图片
    const imgSource = path.join(this.sourceDir, '..', 'img');
    const imgTarget = path.join(this.outputDir, 'assets', 'images');
    
    if (await fs.pathExists(imgSource)) {
      await fs.copy(imgSource, imgTarget);
    }
  }

  async generateNavigation() {
    const navigation = await this.buildNavigationTree();
    const navPath = path.join(this.outputDir, 'navigation.json');
    await fs.writeFile(navPath, JSON.stringify(navigation, null, 2));
  }

  async buildNavigationTree() {
    // 实现导航树构建逻辑
    return {
      title: '12-Factor Agents',
      children: [
        {
          title: '快速开始',
          path: '/getting-started/',
          children: []
       
        {
          title: '核心概念', 
          path: '/concepts/',
          children: []
        },
        {
          title: '12个因子',
          path: '/factors/',
          children: []
        }
      ]
    };
  }

  async generateSearchIndex() {
    // 实现搜索索引生成
    const searchIndex = [];
    const indexPath = path.join(this.outputDir, 'search-index.json');
    await fs.writeFile(indexPath, JSON.stringify(searchIndex, null, 2));
  }

  generateNavigationHtml() {
    // 生成导航HTML
    return '<nav><!-- 导航内容 --></nav>';
  }

  generateBreadcrumbs(filePath) {
    // 生成面包屑导航
    const parts = filePath.split('/');
    return parts.map(part => `<span>${part}</span>`).join(' > ');
  }
}

module.exports = DocumentationBuilder;

// 如果直接运行此脚本
if (require.main === module) {
  const yaml = require('yaml');
  const configPath = path.join(__dirname, '..', 'config.yml');
  const config = yaml.parse(fs.readFileSync(configPath, 'utf8'));
  
  const builder = new DocumentationBuilder(config);
  builder.build().catch(console.error);
}