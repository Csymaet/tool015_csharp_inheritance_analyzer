using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace CSharpInheritanceAnalyzer
{
    public class TypeInfoExtractor
    {
        public List<TypeInfo> ExtractAllTypes(List<CompilationUnitSyntax> compilationUnits)
        {
            var allTypes = new List<TypeInfo>();
            
            foreach (var compilationUnit in compilationUnits)
            {
                var typeVisitor = new TypeDeclarationVisitor();
                typeVisitor.Visit(compilationUnit);
                allTypes.AddRange(typeVisitor.Types);
            }
            
            return allTypes;
        }
    }

    public class TypeDeclarationVisitor : CSharpSyntaxWalker
    {
        public List<TypeInfo> Types { get; } = new List<TypeInfo>();

        public override void VisitClassDeclaration(ClassDeclarationSyntax node)
        {
            var typeInfo = CreateTypeInfo(node, node.BaseList, "class");
            Types.Add(typeInfo);
            
            base.VisitClassDeclaration(node);
        }

        public override void VisitInterfaceDeclaration(InterfaceDeclarationSyntax node)
        {
            var typeInfo = CreateTypeInfo(node, node.BaseList, "interface");
            Types.Add(typeInfo);
            
            base.VisitInterfaceDeclaration(node);
        }

        public override void VisitStructDeclaration(StructDeclarationSyntax node)
        {
            var typeInfo = CreateTypeInfo(node, node.BaseList, "struct");
            Types.Add(typeInfo);
            
            base.VisitStructDeclaration(node);
        }

        public override void VisitEnumDeclaration(EnumDeclarationSyntax node)
        {
            var typeInfo = new TypeInfo
            {
                Name = node.Identifier.ValueText,
                FullName = GetFullName(node),
                Kind = "enum",
                BaseTypes = new List<string>(),
                Interfaces = new List<string>(),
                Namespace = GetNamespace(node),
                Modifiers = node.Modifiers.Select(m => m.ValueText).ToList(),
                IsAbstract = false,
                IsSealed = false,
                IsStatic = false,
                IsGeneric = false,
                GenericParameters = new List<string>(),
                Members = new List<MemberInfo>()
            };
            
            Types.Add(typeInfo);
            base.VisitEnumDeclaration(node);
        }

        private TypeInfo CreateTypeInfo(BaseTypeDeclarationSyntax node, BaseListSyntax baseList, string kind)
        {
            var baseTypes = new List<string>();
            var interfaces = new List<string>();
            
            if (baseList != null)
            {
                foreach (var baseType in baseList.Types)
                {
                    var typeName = baseType.Type.ToString();
                    
                    if (IsInterface(typeName))
                    {
                        interfaces.Add(typeName);
                    }
                    else
                    {
                        baseTypes.Add(typeName);
                    }
                }
            }

            var genericParameters = new List<string>();
            bool isGeneric = false;
            
            if (node is ClassDeclarationSyntax classDecl && classDecl.TypeParameterList != null)
            {
                isGeneric = true;
                genericParameters.AddRange(classDecl.TypeParameterList.Parameters.Select(p => p.Identifier.ValueText));
            }
            else if (node is InterfaceDeclarationSyntax interfaceDecl && interfaceDecl.TypeParameterList != null)
            {
                isGeneric = true;
                genericParameters.AddRange(interfaceDecl.TypeParameterList.Parameters.Select(p => p.Identifier.ValueText));
            }
            else if (node is StructDeclarationSyntax structDecl && structDecl.TypeParameterList != null)
            {
                isGeneric = true;
                genericParameters.AddRange(structDecl.TypeParameterList.Parameters.Select(p => p.Identifier.ValueText));
            }

            var modifiers = node.Modifiers.Select(m => m.ValueText).ToList();
            var members = ExtractMembers(node);

            return new TypeInfo
            {
                Name = node.Identifier.ValueText,
                FullName = GetFullName(node),
                Kind = kind,
                BaseTypes = baseTypes,
                Interfaces = interfaces,
                Namespace = GetNamespace(node),
                Modifiers = modifiers,
                IsAbstract = modifiers.Contains("abstract"),
                IsSealed = modifiers.Contains("sealed"),
                IsStatic = modifiers.Contains("static"),
                IsGeneric = isGeneric,
                GenericParameters = genericParameters,
                Members = members
            };
        }

        private bool IsInterface(string typeName)
        {
            return typeName.StartsWith("I") && char.IsUpper(typeName.Skip(1).FirstOrDefault());
        }

        private string GetNamespace(SyntaxNode node)
        {
            var namespaceDecl = node.Ancestors().OfType<NamespaceDeclarationSyntax>().FirstOrDefault();
            return namespaceDecl?.Name.ToString() ?? "";
        }

        private string GetFullName(BaseTypeDeclarationSyntax node)
        {
            var namespaceName = GetNamespace(node);
            return string.IsNullOrEmpty(namespaceName) ? node.Identifier.ValueText : $"{namespaceName}.{node.Identifier.ValueText}";
        }

        private List<MemberInfo> ExtractMembers(BaseTypeDeclarationSyntax node)
        {
            var members = new List<MemberInfo>();
            
            // BaseTypeDeclarationSyntax 没有直接的Members属性，需要根据类型转换
            var memberDeclarations = new List<MemberDeclarationSyntax>();
            
            if (node is ClassDeclarationSyntax classDecl)
            {
                memberDeclarations.AddRange(classDecl.Members);
            }
            else if (node is InterfaceDeclarationSyntax interfaceDecl)
            {
                memberDeclarations.AddRange(interfaceDecl.Members);
            }
            else if (node is StructDeclarationSyntax structDecl)
            {
                memberDeclarations.AddRange(structDecl.Members);
            }
            
            foreach (var member in memberDeclarations)
            {
                var memberInfo = ExtractMemberInfo(member);
                if (memberInfo != null)
                {
                    members.Add(memberInfo);
                }
            }
            
            return members;
        }

        private MemberInfo ExtractMemberInfo(MemberDeclarationSyntax member)
        {
            return member switch
            {
                MethodDeclarationSyntax method => new MemberInfo
                {
                    Name = method.Identifier.ValueText,
                    Kind = "method",
                    Modifiers = method.Modifiers.Select(m => m.ValueText).ToList(),
                    ReturnType = method.ReturnType.ToString()
                },
                PropertyDeclarationSyntax property => new MemberInfo
                {
                    Name = property.Identifier.ValueText,
                    Kind = "property",
                    Modifiers = property.Modifiers.Select(m => m.ValueText).ToList(),
                    ReturnType = property.Type.ToString()
                },
                FieldDeclarationSyntax field => field.Declaration.Variables.Select(variable => new MemberInfo
                {
                    Name = variable.Identifier.ValueText,
                    Kind = "field",
                    Modifiers = field.Modifiers.Select(m => m.ValueText).ToList(),
                    ReturnType = field.Declaration.Type.ToString()
                }).FirstOrDefault(),
                _ => null
            };
        }
    }
}