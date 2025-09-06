using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using System.Text.Json;

namespace CSharpInheritanceAnalyzer
{
    public class InheritanceAnalyzer
    {
        public AnalysisResult AnalyzeFromArgs(string[] args)
        {
            var parameters = ParseArguments(args);
            var files = GetCSharpFiles(parameters.Path, parameters.Pattern);
            return AnalyzeInheritance(files, parameters);
        }

        public AnalysisResult AnalyzeInheritance(List<string> files, AnalysisParameters parameters)
        {
            var compilationUnits = new List<CompilationUnitSyntax>();
            var fileContents = new Dictionary<string, string>();
            
            foreach (var file in files)
            {
                try
                {
                    var content = File.ReadAllText(file);
                    fileContents[file] = content;
                    var tree = CSharpSyntaxTree.ParseText(content);
                    compilationUnits.Add(tree.GetCompilationUnitRoot());
                }
                catch (Exception ex)
                {
                    Console.Error.WriteLine($"Error reading file {file}: {ex.Message}");
                }
            }

            var typeInfoExtractor = new TypeInfoExtractor();
            var allTypes = typeInfoExtractor.ExtractAllTypes(compilationUnits);
            var inheritanceBuilder = new InheritanceGraphBuilder();
            
            return inheritanceBuilder.BuildInheritanceGraph(allTypes, parameters);
        }

        private AnalysisParameters ParseArguments(string[] args)
        {
            var parameters = new AnalysisParameters();
            
            for (int i = 0; i < args.Length; i++)
            {
                switch (args[i])
                {
                    case "--path":
                        parameters.Path = args[++i];
                        break;
                    case "--pattern":
                        parameters.Pattern = args[++i];
                        break;
                    case "--target-class":
                        parameters.TargetClass = args[++i];
                        break;
                    case "--depth":
                        parameters.Depth = int.Parse(args[++i]);
                        break;
                    case "--include-interfaces":
                        parameters.IncludeInterfaces = bool.Parse(args[++i]);
                        break;
                    case "--include-unity-types":
                        parameters.IncludeUnityTypes = bool.Parse(args[++i]);
                        break;
                    case "--direction":
                        parameters.Direction = args[++i];
                        break;
                }
            }
            
            return parameters;
        }

        private List<string> GetCSharpFiles(string path, string pattern)
        {
            var files = new List<string>();
            
            if (File.Exists(path) && path.EndsWith(".cs"))
            {
                files.Add(path);
            }
            else if (Directory.Exists(path))
            {
                var searchPattern = string.IsNullOrEmpty(pattern) ? "*.cs" : pattern;
                files.AddRange(Directory.GetFiles(path, searchPattern, SearchOption.AllDirectories));
            }
            
            return files;
        }
    }
}