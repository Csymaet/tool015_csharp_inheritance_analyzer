# PromptX集成指南

## 集成步骤

1. **复制到用户目录**
```bash
# Windows
cp -r ./tool015_csharp_inheritance_analyzer %USERPROFILE%\.promptx\resource\tool\csharp-inheritance-analyzer

# Linux/Mac  
cp -r ./tool015_csharp_inheritance_analyzer ~/.promptx/resource/tool/csharp-inheritance-analyzer
```

2. **重启PromptX** - 系统会自动发现用户工具

## 使用方式

```javascript
// 学习工具
await promptx_learn('@manual://csharp-inheritance-analyzer');

// 使用工具
await toolx({
  tool_resource: '@tool://csharp-inheritance-analyzer',
  parameters: {
    targetClass: 'PlayerController',
    projectPath: 'C:\\MyProject\\Scripts'
  }
});
```

完成！