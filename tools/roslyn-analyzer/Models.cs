using System.Collections.Generic;

namespace CSharpInheritanceAnalyzer
{
    public class AnalysisParameters
    {
        public string Path { get; set; } = "";
        public string Pattern { get; set; } = "*.cs";
        public string TargetClass { get; set; } = "";
        public int Depth { get; set; } = 10;
        public bool IncludeInterfaces { get; set; } = true;
        public bool IncludeUnityTypes { get; set; } = true;
        public string Direction { get; set; } = "both";
    }

    public class AnalysisResult
    {
        public string TargetClass { get; set; } = "";
        public List<TypeInfo> Types { get; set; } = new List<TypeInfo>();
        public List<InheritanceRelationship> Relationships { get; set; } = new List<InheritanceRelationship>();
    }

    public class TypeInfo
    {
        public string Name { get; set; } = "";
        public string FullName { get; set; } = "";
        public string Kind { get; set; } = "";
        public List<string> BaseTypes { get; set; } = new List<string>();
        public List<string> Interfaces { get; set; } = new List<string>();
        public string Namespace { get; set; } = "";
        public List<string> Modifiers { get; set; } = new List<string>();
        public bool IsAbstract { get; set; }
        public bool IsSealed { get; set; }
        public bool IsStatic { get; set; }
        public bool IsGeneric { get; set; }
        public List<string> GenericParameters { get; set; } = new List<string>();
        public List<MemberInfo> Members { get; set; } = new List<MemberInfo>();
    }

    public class MemberInfo
    {
        public string Name { get; set; } = "";
        public string Kind { get; set; } = "";
        public List<string> Modifiers { get; set; } = new List<string>();
        public string ReturnType { get; set; } = "";
    }

    public class InheritanceRelationship
    {
        public string From { get; set; } = "";
        public string To { get; set; } = "";
        public string Type { get; set; } = "";
    }
}