using System;
using System.Collections.Generic;
using System.Linq;

namespace CSharpInheritanceAnalyzer
{
    public class InheritanceGraphBuilder
    {
        public AnalysisResult BuildInheritanceGraph(List<TypeInfo> allTypes, AnalysisParameters parameters)
        {
            var result = new AnalysisResult
            {
                TargetClass = parameters.TargetClass,
                Types = new List<TypeInfo>(),
                Relationships = new List<InheritanceRelationship>()
            };

            if (string.IsNullOrEmpty(parameters.TargetClass))
            {
                result.Types = allTypes;
                result.Relationships = BuildAllRelationships(allTypes, parameters);
            }
            else
            {
                var targetType = FindTargetType(allTypes, parameters.TargetClass);
                if (targetType != null)
                {
                    var relatedTypes = FindRelatedTypes(allTypes, targetType, parameters);
                    result.Types = relatedTypes;
                    result.Relationships = BuildRelationships(relatedTypes, parameters);
                }
            }

            return result;
        }

        private TypeInfo FindTargetType(List<TypeInfo> allTypes, string targetClass)
        {
            return allTypes.FirstOrDefault(t => 
                t.Name == targetClass || 
                t.FullName == targetClass ||
                t.FullName.EndsWith("." + targetClass));
        }

        private List<TypeInfo> FindRelatedTypes(List<TypeInfo> allTypes, TypeInfo targetType, AnalysisParameters parameters)
        {
            var relatedTypes = new HashSet<TypeInfo> { targetType };

            if (parameters.Direction == "up" || parameters.Direction == "both")
            {
                var upVisited = new HashSet<string>();
                FindParentTypes(allTypes, targetType, relatedTypes, upVisited, parameters.Depth, parameters);
            }

            if (parameters.Direction == "down" || parameters.Direction == "both")
            {
                var downVisited = new HashSet<string>();
                FindChildTypes(allTypes, targetType, relatedTypes, downVisited, parameters.Depth, parameters);
            }

            return relatedTypes.ToList();
        }

        private void FindParentTypes(List<TypeInfo> allTypes, TypeInfo currentType, HashSet<TypeInfo> relatedTypes, 
            HashSet<string> visited, int remainingDepth, AnalysisParameters parameters)
        {
            if (remainingDepth <= 0 || visited.Contains(currentType.FullName))
                return;

            visited.Add(currentType.FullName);

            foreach (var baseTypeName in currentType.BaseTypes)
            {
                if (!parameters.IncludeUnityTypes && IsUnityType(baseTypeName))
                    continue;

                var baseType = FindTypeByName(allTypes, baseTypeName);
                if (baseType != null && relatedTypes.Add(baseType))
                {
                    FindParentTypes(allTypes, baseType, relatedTypes, visited, remainingDepth - 1, parameters);
                }
            }

            if (parameters.IncludeInterfaces)
            {
                foreach (var interfaceName in currentType.Interfaces)
                {
                    var interfaceType = FindTypeByName(allTypes, interfaceName);
                    if (interfaceType != null && relatedTypes.Add(interfaceType))
                    {
                        FindParentTypes(allTypes, interfaceType, relatedTypes, visited, remainingDepth - 1, parameters);
                    }
                }
            }
        }

        private void FindChildTypes(List<TypeInfo> allTypes, TypeInfo currentType, HashSet<TypeInfo> relatedTypes, 
            HashSet<string> visited, int remainingDepth, AnalysisParameters parameters)
        {
            if (remainingDepth <= 0 || visited.Contains(currentType.FullName))
                return;

            visited.Add(currentType.FullName);

            var childTypes = allTypes.Where(t => 
                t.BaseTypes.Any(bt => TypeMatches(bt, currentType.Name, currentType.FullName)) ||
                (parameters.IncludeInterfaces && t.Interfaces.Any(i => TypeMatches(i, currentType.Name, currentType.FullName)))
            );

            foreach (var childType in childTypes)
            {
                if (!parameters.IncludeUnityTypes && IsUnityType(childType.FullName))
                    continue;

                if (relatedTypes.Add(childType))
                {
                    FindChildTypes(allTypes, childType, relatedTypes, visited, remainingDepth - 1, parameters);
                }
            }
        }

        private bool TypeMatches(string typeName, string targetName, string targetFullName)
        {
            return typeName == targetName || 
                   typeName == targetFullName || 
                   typeName.EndsWith("." + targetName);
        }

        private TypeInfo FindTypeByName(List<TypeInfo> allTypes, string typeName)
        {
            return allTypes.FirstOrDefault(t => 
                t.Name == typeName || 
                t.FullName == typeName ||
                t.FullName.EndsWith("." + typeName));
        }

        private bool IsUnityType(string typeName)
        {
            var unityTypes = new[]
            {
                "MonoBehaviour", "ScriptableObject", "Component", "Behaviour", 
                "UnityEngine.MonoBehaviour", "UnityEngine.ScriptableObject",
                "UnityEngine.Component", "UnityEngine.Behaviour", "UnityEngine.Object"
            };
            
            return unityTypes.Contains(typeName);
        }

        private List<InheritanceRelationship> BuildAllRelationships(List<TypeInfo> allTypes, AnalysisParameters parameters)
        {
            var relationships = new List<InheritanceRelationship>();

            foreach (var type in allTypes)
            {
                foreach (var baseTypeName in type.BaseTypes)
                {
                    var baseType = FindTypeByName(allTypes, baseTypeName);
                    if (baseType != null)
                    {
                        relationships.Add(new InheritanceRelationship
                        {
                            From = type.FullName,
                            To = baseType.FullName,
                            Type = "inheritance"
                        });
                    }
                }

                if (parameters.IncludeInterfaces)
                {
                    foreach (var interfaceName in type.Interfaces)
                    {
                        var interfaceType = FindTypeByName(allTypes, interfaceName);
                        if (interfaceType != null)
                        {
                            relationships.Add(new InheritanceRelationship
                            {
                                From = type.FullName,
                                To = interfaceType.FullName,
                                Type = "implementation"
                            });
                        }
                    }
                }
            }

            return relationships;
        }

        private List<InheritanceRelationship> BuildRelationships(List<TypeInfo> types, AnalysisParameters parameters)
        {
            return BuildAllRelationships(types, parameters);
        }
    }
}