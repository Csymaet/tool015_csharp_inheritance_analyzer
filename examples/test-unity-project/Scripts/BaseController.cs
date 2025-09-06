using UnityEngine;

namespace GameCore
{
    // 基础控制器抽象类
    public abstract class BaseController : MonoBehaviour
    {
        [SerializeField] protected float speed = 5.0f;
        
        protected virtual void Start()
        {
            Initialize();
        }
        
        protected abstract void Initialize();
        
        public abstract void Move(Vector3 direction);
    }
}