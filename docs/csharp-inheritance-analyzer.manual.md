# C# 继承关系分析工具

## 📋 工具简介

C# 继承关系分析工具是一个基于Roslyn编译器的专业代码分析工具，专门用于分析C#项目（特别是Unity项目）中的类继承关系和接口实现关系。

## 🎯 主要功能

- **精确解析**: 基于Microsoft Roslyn编译器，提供100%准确的语法分析
- **多向分析**: 支持向上追踪父类、向下查找子类、双向完整分析
- **丰富可视化**: 提供Mermaid图表和Markdown文本树两种展示方式
- **Unity优化**: 专门针对Unity C#项目优化，识别MonoBehaviour组件
- **类型识别**: 智能识别接口、类、结构体、枚举等不同类型

## 🏗️ 支持的类型图标

| 图标 | 类型 | 描述 |
|-----|-----|-----|
| 🔌 | Interface | 接口类型 |
| 🏗️ | Class | 普通类 |
| 🧱 | Struct | 结构体 |
| 📋 | Enum | 枚举类型 |
| 🎮 | Unity Component | MonoBehaviour组件 |
| 📐 | Abstract Class | 抽象类 |
| 📦 | Other | 其他类型 |

## 📝 使用方法

### 基本用法

```javascript
await toolx({
  tool_resource: '@tool://csharp-inheritance-analyzer',
  parameters: {
    targetClass: 'PlayerController',
    projectPath: 'C:\\\\MyUnityProject\\\\Assets'
  }
});
```

### 高级配置

```javascript
await toolx({
  tool_resource: '@tool://csharp-inheritance-analyzer',
  parameters: {
    targetClass: 'IWeapon',
    projectPath: 'D:\\\\GameProject\\\\Scripts',
    maxDepth: 10,
    direction: 'down',
    includeInterfaces: true,
    theme: 'unity',
    outputFormat: 'both',
    autoOpen: false
  }
});
```

## 🎛️ 参数说明

### 必需参数

- **targetClass** (string): 要分析的类或接口名称
- **projectPath** (string): Unity项目路径或包含C#文件的目录路径

### 可选参数

- **maxDepth** (number, 默认: 5): 继承层级深度限制 (1-20)
- **direction** (string, 默认: 'both'): 分析方向
  - `up`: 向上追踪父类/接口
  - `down`: 向下查找子类/实现类
  - `both`: 双向完整分析
- **outputFormat** (string, 默认: 'markdown'): 输出格式
  - `mermaid`: 仅Mermaid图表
  - `markdown`: 仅Markdown文本树
  - `both`: 两种格式都生成
- **autoOpen** (boolean, 默认: true): 是否自动打开浏览器显示结果

## 📊 输出示例

```
PlayerController 🎮
├── BaseController 🏗️ 🔗
├── IMovable 🔌 🔌
└── IDamageable 🔌 🔌
    ├── Enemy 🏗️ 🔌
    └── Building 🏗️ 🔌
```

## 🔧 环境要求

- .NET SDK 9.0 或更高版本
- Windows、macOS、Linux系统支持

## 👨‍💻 作者

Created by 鲁班 - PromptX工具开发专家
