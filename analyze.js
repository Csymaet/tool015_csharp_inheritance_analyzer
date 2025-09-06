#!/usr/bin/env node

// C# 继承关系分析工具 - 通用命令行接口
const tool = require('./tools/csharp-inheritance-analyzer.tool.js');

function showUsage() {
    console.log(`
🔍 C# 继承关系分析工具

用法:
  node analyze.js <类名> <项目路径> [选项]

参数:
  <类名>        要分析的类或接口名称
  <项目路径>    Unity项目路径或包含C#文件的目录路径

选项:
  --depth <数字>     继承层级深度限制 (默认: 10)
  --direction <方向> 分析方向: up|down|both (默认: both)
  --no-interfaces    不包含接口实现关系
  --no-open         不自动打开浏览器
  --theme <主题>     图表主题: unity|default|dark (默认: unity)
  --format <格式>    输出格式: mermaid|markdown|both (默认: markdown)

示例:
  node analyze.js PlayerController "C:\\MyGame\\Scripts"
  node analyze.js IWeapon "D:\\Project\\Assets" --depth 5 --direction up  
  node analyze.js AGemView "C:\\company\\project" --format mermaid
  node analyze.js ABuildingView "C:\\project\\path" --no-open
`);
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 2 || args.includes('--help') || args.includes('-h')) {
        showUsage();
        return;
    }
    
    // 解析参数
    const targetClass = args[0];
    const projectPath = args[1];
    
    const params = {
        targetClass,
        projectPath,
        maxDepth: 10,
        direction: 'both',
        includeInterfaces: true,
        theme: 'unity',
        outputFormat: 'markdown',
        autoOpen: true
    };
    
    // 解析选项
    for (let i = 2; i < args.length; i++) {
        switch (args[i]) {
            case '--depth':
                params.maxDepth = parseInt(args[++i]);
                break;
            case '--direction':
                params.direction = args[++i];
                break;
            case '--no-interfaces':
                params.includeInterfaces = false;
                break;
            case '--no-open':
                params.autoOpen = false;
                break;
            case '--theme':
                params.theme = args[++i];
                break;
            case '--format':
                params.outputFormat = args[++i];
                break;
        }
    }
    
    console.log(`🔍 分析目标: ${targetClass}`);
    console.log(`📁 项目路径: ${projectPath}`);
    console.log(`⚙️  配置: 深度=${params.maxDepth}, 方向=${params.direction}, 接口=${params.includeInterfaces}`);
    console.log('');
    
    try {
        // 验证参数
        const validation = tool.validate(params);
        if (!validation.valid) {
            console.error('❌ 参数错误:', validation.errors.join(', '));
            return;
        }
        
        // 执行分析
        const result = await tool.execute(params);
        
        if (result.success) {
            console.log('✅ 分析完成！');
            console.log(`📊 相关类数量: ${result.data.classCount}`);
            console.log(`🔗 继承关系: ${result.data.relationships}`);
            console.log(`⚡ 执行时间: ${result.metadata.executionTime}ms`);
            console.log(`🌐 结果文件: ${result.data.htmlPath}`);
            
            if (params.autoOpen) {
                console.log('🎉 浏览器已自动打开展示结果！');
            } else {
                console.log('💡 请手动打开HTML文件查看可视化结果');
            }
        } else {
            console.error(`❌ 分析失败: ${result.error.message}`);
            process.exit(1);
        }
        
    } catch (error) {
        console.error('💥 执行异常:', error.message);
        process.exit(1);
    }
}

main();