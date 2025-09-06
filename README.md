# C# 继承关系分析工具

🔍 基于Microsoft Roslyn编译器的专业C#继承关系分析工具，专门针对Unity项目优化

## ✨ 特性

- **🎯 精确分析**: 基于Roslyn编译器，100%准确的语法分析
- **📊 可视化展示**: 支持Mermaid图表和Markdown文本树两种展示方式
- **🎮 Unity优化**: 专门针对Unity C#项目优化，识别MonoBehaviour组件
- **🔄 多向分析**: 支持向上、向下、双向完整继承关系分析
- **🚀 自动化**: 一键分析，自动打开浏览器展示结果
- **⚡ PromptX集成**: 完全符合PromptX工具生态系统规范

## 🏗️ 项目结构

```
csharp-inheritance-analyzer/
├── analyze.js                      # CLI命令行接口
├── package.json                    # NPM包配置
├── tool015_csharp_inheritance_analyzer.sln  # Visual Studio解决方案
├── tools/                          # 核心工具代码
│   ├── csharp-inheritance-analyzer.tool.js  # PromptX工具主文件
│   └── roslyn-analyzer/            # C# Roslyn分析引擎
│       ├── Program.cs              # 程序入口
│       ├── InheritanceAnalyzer.cs  # 分析协调器
│       ├── TypeInfoExtractor.cs    # 类型信息提取器
│       ├── InheritanceGraphBuilder.cs  # 继承图构建器
│       ├── Models.cs               # 数据模型
│       └── CSharpInheritanceAnalyzer.csproj  # .NET项目配置
├── docs/                           # 文档目录
│   ├── csharp-inheritance-analyzer.manual.md  # 工具使用手册
│   └── INTEGRATION.md              # PromptX集成指南
└── examples/                       # 示例和测试
    └── test-unity-project/         # Unity测试项目
```

## 🚀 快速开始

### 环境要求

- .NET SDK 9.0 或更高版本
- Node.js 16.0 或更高版本
- Windows、macOS、Linux系统支持

### 安装

```bash
npm install @promptx/csharp-inheritance-analyzer
```

### 命令行使用

```bash
# 基本用法
node analyze.js PlayerController "C:\MyUnityProject\Assets"

# 高级用法
node analyze.js IWeapon "D:\Project\Scripts" --depth 10 --direction both --format markdown

# 查看帮助
node analyze.js --help
```

### PromptX集成使用

> 暂时放弃

## 📊 输出示例

```
PlayerController 🎮
├── BaseController 🏗️ 🔗
├── IMovable 🔌 🔌
└── IDamageable 🔌 🔌
    ├── Enemy 🏗️ 🔌
    └── Building 🏗️ 🔌
```

## 🔧 配置选项

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| targetClass | string | 必需 | 要分析的类或接口名称 |
| projectPath | string | 必需 | Unity项目路径或C#代码目录 |
| maxDepth | number | 5 | 继承层级深度限制 (1-20) |
| direction | string | 'both' | 分析方向: up/down/both |
| outputFormat | string | 'markdown' | 输出格式: mermaid/markdown/both |
| autoOpen | boolean | true | 是否自动打开浏览器 |

## 🏷️ 类型图标

| 图标 | 类型 | 描述 |
|-----|-----|-----|
| 🔌 | Interface | 接口类型 |
| 🏗️ | Class | 普通类 |
| 🧱 | Struct | 结构体 |
| 📋 | Enum | 枚举类型 |
| 🎮 | Unity Component | MonoBehaviour组件 |
| 📐 | Abstract Class | 抽象类 |

## 📚 文档

- [工具使用手册](docs/csharp-inheritance-analyzer.manual.md)
- [PromptX集成指南](docs/INTEGRATION.md)

## 👨‍💻 作者

Created by **鲁班** - PromptX工具开发专家

## 📄 许可证

MIT License