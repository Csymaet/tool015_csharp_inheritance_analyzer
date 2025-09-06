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
    public class Program
    {
        public static void Main(string[] args)
        {
            try
            {
                var analyzer = new InheritanceAnalyzer();
                var result = analyzer.AnalyzeFromArgs(args);
                Console.WriteLine(JsonSerializer.Serialize(result));
            }
            catch (Exception ex)
            {
                var error = new { error = ex.Message, stackTrace = ex.StackTrace };
                Console.WriteLine(JsonSerializer.Serialize(error));
                Environment.Exit(1);
            }
        }
    }
}