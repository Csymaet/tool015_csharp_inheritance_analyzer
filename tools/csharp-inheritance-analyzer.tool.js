module.exports = {
  getDependencies() {
    return {
      'glob': '^10.3.0',
      'fs-extra': '^11.1.0',
      'open': '^9.1.0',
      'child_process': 'builtin',
      'path': 'builtin',
      'os': 'builtin',
      'util': 'builtin'
    };
  },
  
  getMetadata() {
    return {
      name: 'csharp-inheritance-analyzer',
      description: 'C# 继承关系分析工具 - 基于Roslyn编译器，精确分析Unity项目继承关系',
      version: '3.0.0',
      category: 'code-analysis',
      author: '鲁班',
      tags: ['csharp', 'unity', 'roslyn', 'inheritance', 'analysis'],
      manual: '@manual://csharp-inheritance-analyzer'
    };
  },
  
  getSchema() {
    return {
      type: 'object',
      properties: {
        targetClass: {
          type: 'string',
          description: '要分析的类或接口名称'
        },
        projectPath: {
          type: 'string',
          description: 'Unity项目路径或包含C#文件的目录路径'
        },
        maxDepth: {
          type: 'number',
          description: '继承层级深度限制',
          default: 5,
          minimum: 1,
          maximum: 20
        },
        direction: {
          type: 'string',
          enum: ['up', 'down', 'both'],
          description: '分析方向：up(向上找父类), down(向下找子类), both(双向)',
          default: 'both'
        },
        includeInterfaces: {
          type: 'boolean',
          description: '是否包含接口实现关系',
          default: true
        },
        theme: {
          type: 'string',
          enum: ['unity', 'default', 'dark'],
          description: '图表主题样式',
          default: 'unity'
        },
        outputFormat: {
          type: 'string',
          enum: ['mermaid', 'markdown', 'both'],
          description: '输出格式：mermaid(图表), markdown(文本树), both(两种)',
          default: 'markdown'
        },
        autoOpen: {
          type: 'boolean',
          description: '是否自动打开浏览器展示结果',
          default: true
        }
      },
      required: ['targetClass', 'projectPath']
    };
  },
  
  validate(params) {
    const errors = [];
    
    if (!params.targetClass || typeof params.targetClass !== 'string') {
      errors.push('targetClass是必需的字符串参数');
    }
    
    if (!params.projectPath || typeof params.projectPath !== 'string') {
      errors.push('projectPath是必需的字符串参数');
    }
    
    if (params.maxDepth && (params.maxDepth < 1 || params.maxDepth > 20)) {
      errors.push('maxDepth必须在1-20之间');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  },
  
  async execute(params) {
    const startTime = Date.now();
    
    try {
      console.log('🔍 开始基于Roslyn的C#继承关系分析...');
      console.log(`目标类: ${params.targetClass}`);
      console.log(`项目路径: ${params.projectPath}`);
      
      // 1. 环境检查
      const environment = await this.checkEnvironment();
      if (!environment.dotnetAvailable) {
        throw new Error('需要安装.NET SDK。请访问 https://dotnet.microsoft.com/download');
      }
      
      // 2. 准备分析器
      const analyzer = new RoslynAnalyzer();
      await analyzer.ensureReady();
      
      // 3. 执行分析
      const analysisResult = await analyzer.analyze(params);
      
      if (!analysisResult.Types || analysisResult.Types.length === 0) {
        throw new Error(`未找到类"${params.targetClass}"或其继承关系`);
      }
      
      console.log(`🏗️ 分析完成，发现${analysisResult.Types.length}个相关类`);
      
      // 4. 生成可视化
      const visualizer = new InheritanceVisualizer();
      const result = await visualizer.generateVisualization(analysisResult, params);
      
      if (params.autoOpen && result.htmlPath) {
        try {
          const { default: open } = await import('open');
          await open(result.htmlPath);
          console.log('🌐 已自动打开浏览器展示结果');
        } catch (error) {
          console.log(`📄 HTML文件已生成: ${result.htmlPath}`);
          console.log('请手动打开浏览器查看结果');
        }
      }
      
      return {
        success: true,
        data: {
          targetClass: params.targetClass,
          classCount: analysisResult.Types.length,
          relationships: analysisResult.Relationships.length,
          htmlPath: result.htmlPath,
          mermaidCode: result.mermaidCode,
          analyzer: 'Roslyn',
          dotnetVersion: environment.dotnetVersion
        },
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('❌ 分析失败:', error.message);
      return {
        success: false,
        error: {
          code: error.code || 'ANALYSIS_ERROR',
          message: error.message
        }
      };
    }
  },
  
  // 环境检查
  async checkEnvironment() {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    try {
      const { stdout } = await execAsync('dotnet --version', { timeout: 5000 });
      const version = stdout.trim();
      console.log(`✅ .NET版本: ${version}`);
      return { 
        dotnetAvailable: true, 
        dotnetVersion: version 
      };
    } catch (error) {
      console.warn('⚠️ 未检测到.NET SDK');
      return { 
        dotnetAvailable: false, 
        error: error.message 
      };
    }
  }
};

// Roslyn分析器类
class RoslynAnalyzer {
  constructor() {
    this.analyzerDir = null;
    this.isReady = false;
  }
  
  async ensureReady() {
    if (this.isReady) return;
    
    const path = require('path');
    
    // 使用本地的roslyn-analyzer目录
    this.analyzerDir = path.resolve(__dirname, 'roslyn-analyzer');
    
    // 检查分析器是否存在
    const exists = await this.checkAnalyzerExists();
    if (!exists) {
      throw new Error('找不到Roslyn分析器项目，请确保roslyn-analyzer目录存在');
    }
    
    this.isReady = true;
    console.log('📦 Roslyn分析器就绪');
  }
  
  async checkAnalyzerExists() {
    const fs = require('fs-extra');
    const path = require('path');
    
    const projectFile = path.join(this.analyzerDir, 'CSharpInheritanceAnalyzer.csproj');
    const programFile = path.join(this.analyzerDir, 'Program.cs');
    
    return (await fs.pathExists(projectFile)) && (await fs.pathExists(programFile));
  }
  
  async analyze(params) {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    try {
      // 编译分析器
      console.log('🔧 编译Roslyn分析器...');
      await execAsync('dotnet build --configuration Release --verbosity quiet', {
        cwd: this.analyzerDir,
        timeout: 60000
      });
      
      // 准备参数
      const args = [
        '--path', `"${params.projectPath}"`,
        '--target-class', `"${params.targetClass}"`,
        '--depth', (params.maxDepth || 5).toString(),
        '--include-interfaces', (params.includeInterfaces !== false).toString(),
        '--include-unity-types', 'true',
        '--direction', params.direction || 'both'
      ];
      
      // 运行分析器
      console.log('🚀 执行继承关系分析...');
      const command = `dotnet run --configuration Release -- ${args.join(' ')}`;
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.analyzerDir,
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024
      });
      
      if (stderr && !stderr.includes('Warning')) {
        console.warn('⚠️ 分析警告:', stderr.trim());
      }
      
      // 过滤掉警告信息，只保留JSON部分
      const lines = stdout.trim().split('\n');
      let jsonLine = '';
      
      // 查找JSON行（以{开始）
      for (const line of lines) {
        if (line.trim().startsWith('{')) {
          jsonLine = line.trim();
          break;
        }
      }
      
      if (!jsonLine) {
        throw new Error('未找到有效的JSON输出');
      }
      
      const result = JSON.parse(jsonLine);
      
      if (result.error) {
        throw new Error(`Roslyn分析失败: ${result.error}`);
      }
      
      return result;
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('dotnet命令未找到，请安装.NET SDK');
      } else if (error.signal === 'SIGTERM') {
        throw new Error('分析超时，请尝试较小的代码库');
      } else {
        throw new Error(`分析执行失败: ${error.message}`);
      }
    }
  }
}

// 继承关系可视化类
class InheritanceVisualizer {
  async generateVisualization(analysisResult, params) {
    let mermaidCode = '';
    let markdownContent = '';
    
    if (params.outputFormat === 'mermaid' || params.outputFormat === 'both') {
      mermaidCode = this.generateMermaidDiagram(analysisResult, params);
    }
    
    if (params.outputFormat === 'markdown' || params.outputFormat === 'both') {
      markdownContent = this.generateMarkdownTree(analysisResult, params);
    }
    
    const htmlContent = this.generateHTML(analysisResult, mermaidCode, markdownContent, params);
    const htmlPath = await this.saveHTML(htmlContent);
    
    return {
      mermaidCode,
      markdownContent,
      htmlPath
    };
  }
  
  generateMermaidDiagram(analysisResult, params) {
    // 使用纵向布局，通过子图强制竖直排列
    const lines = ['flowchart TB'];
    
    // 找出目标类
    const targetClass = analysisResult.Types.find(t => 
      t.Name === params.targetClass || 
      t.FullName === params.targetClass ||
      t.FullName.endsWith('.' + params.targetClass)
    );
    
    if (!targetClass) {
      // 如果找不到目标类，回退到原来的方式
      for (const type of analysisResult.Types) {
        const nodeId = this.sanitizeNodeId(type.Name);
        const nodeInfo = this.getNodeInfo(type);
        lines.push(`    ${nodeId}${nodeInfo.shape[0]}${nodeInfo.label}${nodeInfo.shape[1]}`);
      }
    } else {
      // 分组显示：父类 -> 目标类 -> 子类
      const targetId = this.sanitizeNodeId(targetClass.Name);
      const parentTypes = [];
      const childTypes = [];
      const interfaceTypes = [];
      
      // 分类节点
      for (const type of analysisResult.Types) {
        if (type.Name === targetClass.Name) continue;
        
        const isParent = analysisResult.Relationships.some(r => 
          r.From === targetClass.FullName && r.To === type.FullName
        );
        const isChild = analysisResult.Relationships.some(r => 
          r.To === targetClass.FullName && r.From === type.FullName
        );
        
        if (type.Kind === 'interface') {
          interfaceTypes.push(type);
        } else if (isParent) {
          parentTypes.push(type);
        } else if (isChild) {
          childTypes.push(type);
        } else {
          childTypes.push(type); // 默认作为子类
        }
      }
      
      // 添加父类组
      if (parentTypes.length > 0) {
        lines.push(`    subgraph Parents["📈 父类"]`);
        lines.push(`        direction TB`);
        for (const type of parentTypes) {
          const nodeId = this.sanitizeNodeId(type.Name);
          const nodeInfo = this.getNodeInfo(type);
          lines.push(`        ${nodeId}${nodeInfo.shape[0]}${nodeInfo.label}${nodeInfo.shape[1]}`);
        }
        lines.push(`    end`);
      }
      
      // 添加接口组
      if (interfaceTypes.length > 0) {
        lines.push(`    subgraph Interfaces["🔌 接口"]`);
        lines.push(`        direction TB`);
        for (const type of interfaceTypes) {
          const nodeId = this.sanitizeNodeId(type.Name);
          const nodeInfo = this.getNodeInfo(type);
          lines.push(`        ${nodeId}${nodeInfo.shape[0]}${nodeInfo.label}${nodeInfo.shape[1]}`);
        }
        lines.push(`    end`);
      }
      
      // 添加目标类
      const targetNodeInfo = this.getNodeInfo(targetClass);
      lines.push(`    ${targetId}${targetNodeInfo.shape[0]}🎯 ${targetNodeInfo.label}${targetNodeInfo.shape[1]}`);
      
      // 添加子类组
      if (childTypes.length > 0) {
        lines.push(`    subgraph Children["📊 子类 (${childTypes.length}个)"]`);
        lines.push(`        direction TB`);
        for (const type of childTypes) {
          const nodeId = this.sanitizeNodeId(type.Name);
          const nodeInfo = this.getNodeInfo(type);
          lines.push(`        ${nodeId}${nodeInfo.shape[0]}${nodeInfo.label}${nodeInfo.shape[1]}`);
        }
        lines.push(`    end`);
      }
    }
    
    // 生成关系连线
    for (const rel of analysisResult.Relationships) {
      const fromId = this.sanitizeNodeId(rel.From);
      const toId = this.sanitizeNodeId(rel.To);
      const connection = rel.Type === 'implementation' 
        ? `-.->|implements|` 
        : `-->|extends|`;
      lines.push(`    ${fromId} ${connection} ${toId}`);
    }
    
    // 添加样式
    if (params.theme === 'unity') {
      lines.push(...this.getUnityStyles(analysisResult.Types));
    }
    
    return lines.join('\n');
  }
  
  getNodeInfo(type) {
    if (type.Kind === 'interface') {
      return { label: `🔌 ${type.Name}`, shape: ['{', '}'] };
    } else if (type.BaseTypes && type.BaseTypes.includes('MonoBehaviour')) {
      return { label: `🎮 ${type.Name}`, shape: ['[', ']'] };
    } else if (type.IsAbstract) {
      return { label: `📐 ${type.Name}`, shape: ['[', ']'] };
    } else {
      return { label: type.Name, shape: ['[', ']'] };
    }
  }
  
  getUnityStyles(types) {
    const styles = [
      '',
      'classDef unityComponent fill:#4CAF50,stroke:#2E7D32,color:#fff;',
      'classDef interface fill:#2196F3,stroke:#1976D2,color:#fff;',
      'classDef abstract fill:#9C27B0,stroke:#7B1FA2,color:#fff;',
      'classDef external fill:#FF9800,stroke:#F57C00,color:#fff;',
      ''
    ];
    
    for (const type of types) {
      const nodeId = this.sanitizeNodeId(type.Name);
      if (type.Kind === 'interface') {
        styles.push(`class ${nodeId} interface;`);
      } else if (type.BaseTypes && type.BaseTypes.includes('MonoBehaviour')) {
        styles.push(`class ${nodeId} unityComponent;`);
      } else if (type.IsAbstract) {
        styles.push(`class ${nodeId} abstract;`);
      }
    }
    
    return styles;
  }
  
  generateMarkdownTree(analysisResult, params) {
    const lines = [`# 📊 ${params.targetClass} 继承关系分析\n`];
    
    // 找出目标类
    const targetClass = analysisResult.Types.find(t => 
      t.Name === params.targetClass || 
      t.FullName === params.targetClass ||
      t.FullName.endsWith('.' + params.targetClass)
    );
    
    if (!targetClass) {
      lines.push('❌ 未找到目标类');
      return lines.join('\n');
    }
    
    // 构建类型映射和关系映射
    const typeMap = new Map();
    const childrenMap = new Map();
    const parentMap = new Map();
    
    // 初始化映射
    for (const type of analysisResult.Types) {
      typeMap.set(type.FullName, type);
      childrenMap.set(type.FullName, []);
      parentMap.set(type.FullName, []);
    }
    
    // 构建父子关系映射
    for (const rel of analysisResult.Relationships) {
      const parent = rel.To;
      const child = rel.From;
      
      if (childrenMap.has(parent)) {
        childrenMap.get(parent).push({ type: typeMap.get(child), relation: rel.Type });
      }
      if (parentMap.has(child)) {
        parentMap.get(child).push({ type: typeMap.get(parent), relation: rel.Type });
      }
    }
    
    // 父类继承链
    const parents = parentMap.get(targetClass.FullName) || [];
    if (parents.length > 0) {
      lines.push('## 📈 父类继承链\n');
      lines.push('```');
      this.buildParentChain(targetClass, analysisResult, lines, '');
      lines.push('```\n');
    }
    
    // 目标类信息
    lines.push('## 🎯 目标类详情\n');
    lines.push(`**${targetClass.Name}** ${this.getTypeIcon(targetClass)}`);
    lines.push(`- **全名**: \`${targetClass.FullName}\``);
    lines.push(`- **类型**: ${targetClass.Kind}`);
    lines.push(`- **命名空间**: ${targetClass.Namespace}`);
    if (targetClass.Modifiers && targetClass.Modifiers.length > 0) {
      lines.push(`- **修饰符**: ${targetClass.Modifiers.join(', ')}`);
    }
    lines.push('');
    
    // 构建完整继承树（从目标类开始，递归显示子类）
    const children = childrenMap.get(targetClass.FullName) || [];
    if (children.length > 0) {
      lines.push(`## 📊 完整继承树\n`);
      lines.push('```');
      const visited = new Set();
      this.buildInheritanceTree(targetClass, childrenMap, lines, '', visited, 0, 5, true); // 限制深度为5层，设置为根节点
      lines.push('```\n');
    } else {
      lines.push('## 📊 继承情况\n');
      lines.push('该类/接口没有子类或实现类。\n');
    }
    
    // 统计信息
    lines.push('## 📈 统计信息\n');
    // 计算类型统计
    const interfaceCount = analysisResult.Types.filter(t => t.Kind === 'interface').length;
    const classCount = analysisResult.Types.filter(t => t.Kind === 'class').length;
    const structCount = analysisResult.Types.filter(t => t.Kind === 'struct').length;
    const enumCount = analysisResult.Types.filter(t => t.Kind === 'enum').length;
    const otherCount = analysisResult.Types.filter(t => !['interface', 'class', 'struct', 'enum'].includes(t.Kind)).length;
    const totalChildren = this.countAllChildren(targetClass.FullName, childrenMap, new Set());
    
    lines.push(`- **相关类型总数**: ${analysisResult.Types.length}`);
    lines.push(`- **继承关系数**: ${analysisResult.Relationships.length}`);
    lines.push(`- **父类/接口数量**: ${parents.length}`);
    lines.push(`- **子类/实现类总数**: ${totalChildren}`);
    lines.push(`- **其中接口**: ${interfaceCount} 个`);
    lines.push(`- **其中类**: ${classCount} 个`);
    if (structCount > 0) lines.push(`- **其中结构体**: ${structCount} 个`);
    if (enumCount > 0) lines.push(`- **其中枚举**: ${enumCount} 个`);
    if (otherCount > 0) lines.push(`- **其中其他类型**: ${otherCount} 个`);
    lines.push('');
    
    return lines.join('\n');
  }
  
  buildParentChain(currentType, analysisResult, lines, indent) {
    lines.push(`${indent}${currentType.Name} ${this.getTypeIcon(currentType)}`);
    
    // 找父类/接口 - 包括inheritance和implementation关系
    const parentRel = analysisResult.Relationships.find(r => 
      r.From === currentType.FullName && (r.Type === 'inheritance' || r.Type === 'implementation')
    );
    
    if (parentRel) {
      const parentType = analysisResult.Types.find(t => t.FullName === parentRel.To);
      if (parentType) {
        const newIndent = indent + '└── ';
        this.buildParentChain(parentType, analysisResult, lines, newIndent);
      }
    }
  }
  
  buildInheritanceTree(currentType, childrenMap, lines, indent, visited, depth, maxDepth, isRoot = false) {
    if (depth > maxDepth || visited.has(currentType.FullName)) {
      return;
    }
    
    visited.add(currentType.FullName);
    
    const children = childrenMap.get(currentType.FullName) || [];
    
    // 只有根节点才显示自己的名称
    if (isRoot) {
      lines.push(`${indent}${currentType.Name} ${this.getTypeIcon(currentType)}`);
    }
    
    // 处理所有子节点
    if (children.length === 0) {
      return;
    }
    
    // 按关系类型和名称排序
    children.sort((a, b) => {
      if (a.relation !== b.relation) {
        return a.relation === 'implementation' ? -1 : 1;
      }
      return a.type.Name.localeCompare(b.type.Name);
    });
    
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const isLast = i === children.length - 1;
      const prefix = isLast ? '└── ' : '├── ';
      const relationIcon = child.relation === 'implementation' ? ' 🔌' : ' 🔗';
      
      // 显示子类名称和关系类型
      lines.push(`${indent}${prefix}${child.type.Name} ${this.getTypeIcon(child.type)}${relationIcon}`);
      
      // 计算下一层的缩进
      const nextIndent = indent + (isLast ? '    ' : '│   ');
      
      // 递归显示子类的子类
      this.buildInheritanceTree(child.type, childrenMap, lines, nextIndent, visited, depth + 1, maxDepth, false);
    }
  }
  
  countAllChildren(typeName, childrenMap, visited) {
    if (visited.has(typeName)) {
      return 0;
    }
    
    visited.add(typeName);
    const children = childrenMap.get(typeName) || [];
    let count = children.length;
    
    for (const child of children) {
      count += this.countAllChildren(child.type.FullName, childrenMap, visited);
    }
    
    return count;
  }
  
  getTypeIcon(type) {
    if (type.Kind === 'interface') return '🔌';
    if (type.Kind === 'struct') return '🧱';
    if (type.BaseTypes && type.BaseTypes.includes('MonoBehaviour')) return '🎮';
    if (type.IsAbstract) return '📐';
    if (type.Kind === 'class') return '🏗️';
    if (type.Kind === 'enum') return '📋';
    return '📦';
  }
  
  sanitizeNodeId(name) {
    return name.replace(/[^a-zA-Z0-9_]/g, '_');
  }
  
  generateHTML(analysisResult, mermaidCode, markdownContent, params) {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>C# 继承关系分析 - ${params.targetClass}</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', -apple-system, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header {
            background: rgba(255,255,255,0.95);
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        .header h1 { color: #333; font-size: 2.5rem; margin-bottom: 10px; }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        .stat-card {
            background: rgba(255,255,255,0.2);
            border-radius: 8px;
            padding: 15px;
            text-align: center;
        }
        .stat-value { font-size: 1.8rem; font-weight: bold; color: #2E7D32; }
        .stat-label { color: #666; margin-top: 5px; }
        .diagram-container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            overflow-x: auto;
        }
        #mermaid-diagram { text-align: center; min-height: 400px; }
        .badge { 
            background: #4CAF50; 
            color: white; 
            padding: 2px 8px; 
            border-radius: 4px; 
            font-size: 0.8rem; 
            margin-left: 10px; 
        }
        .markdown-body {
            font-family: 'Segoe UI', -apple-system, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: none;
        }
        .markdown-body h1 { color: #2E7D32; border-bottom: 2px solid #4CAF50; padding-bottom: 8px; }
        .markdown-body h2 { color: #1976D2; border-bottom: 1px solid #2196F3; padding-bottom: 4px; margin-top: 24px; }
        .markdown-body h3 { color: #7B1FA2; margin-top: 20px; }
        .markdown-body pre { background: #f8f9fa; padding: 12px; border-radius: 6px; overflow-x: auto; }
        .markdown-body code { background: #f1f3f4; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
        .markdown-body ul { padding-left: 20px; }
        .markdown-body li { margin: 4px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏗️ ${params.targetClass} 继承关系分析</h1>
            <p>📁 项目: <code>${params.projectPath}</code><span class="badge">Roslyn驱动</span></p>
            
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-value">${analysisResult.Types.length}</div>
                    <div class="stat-label">相关类/接口</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${analysisResult.Relationships.length}</div>
                    <div class="stat-label">继承关系</div>
                </div>
            </div>
        </div>
        
        <div class="diagram-container">
            ${this.generateContentSection(mermaidCode, markdownContent, params)}
        </div>
    </div>
    
    <script>
        mermaid.initialize({ 
            startOnLoad: true,
            theme: 'base',
            themeVariables: {
                primaryColor: '#4CAF50',
                primaryTextColor: '#fff',
                primaryBorderColor: '#2E7D32',
                lineColor: '#333'
            },
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                curve: 'basis'
            }
        });
        
        window.addEventListener('load', () => {
            console.log('🎉 C# 继承关系分析图表加载完成！');
        });
    </script>
</body>
</html>`;
  }
  
  generateContentSection(mermaidCode, markdownContent, params) {
    if (params.outputFormat === 'markdown') {
      // 只显示Markdown内容
      return `
            <div id="markdown-content">
                <div class="markdown-body">
${this.convertMarkdownToHTML(markdownContent)}
                </div>
            </div>`;
    } else if (params.outputFormat === 'both') {
      // 显示两种格式
      return `
            <div class="tabs">
                <button class="tab-button active" onclick="showTab('mermaid')">📊 图表视图</button>
                <button class="tab-button" onclick="showTab('markdown')">📝 文本视图</button>
            </div>
            <div id="mermaid-tab" class="tab-content active">
                <div id="mermaid-diagram">
                    <pre class="mermaid">${mermaidCode}</pre>
                </div>
            </div>
            <div id="markdown-tab" class="tab-content">
                <div class="markdown-body">
${this.convertMarkdownToHTML(markdownContent)}
                </div>
            </div>`;
    } else {
      // 默认显示Mermaid
      return `
            <div id="mermaid-diagram">
                <pre class="mermaid">${mermaidCode}</pre>
            </div>`;
    }
  }
  
  convertMarkdownToHTML(markdown) {
    // 先处理代码块，避免被其他规则影响
    const processedMarkdown = markdown.replace(/```\n?([\s\S]*?)\n?```/g, (match, content) => {
      // 保持原始格式，转义HTML并保留空格和换行
      const escaped = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/ /g, '&nbsp;')  // 保留空格
        .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')  // 制表符转换为4个空格
        .replace(/\n/g, '<br>');  // 在代码块内保持换行
      return `<pre style="white-space: pre; font-family: 'Consolas', 'Monaco', 'Courier New', monospace; background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; margin: 10px 0;"><code>${escaped}</code></pre>`;
    });
    
    // 然后处理其他markdown语法
    return processedMarkdown
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  }
  
  async saveHTML(htmlContent) {
    const fs = require('fs-extra');
    const path = require('path');
    const os = require('os');
    
    const outputPath = path.join(os.tmpdir(), `csharp-inheritance-${Date.now()}.html`);
    await fs.writeFile(outputPath, htmlContent, 'utf8');
    
    return outputPath;
  }
}