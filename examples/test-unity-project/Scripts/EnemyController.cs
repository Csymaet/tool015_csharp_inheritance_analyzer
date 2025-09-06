using UnityEngine;

namespace GameCore
{
    // 敌人控制器，同样继承自BaseController
    public class EnemyController : BaseController
    {
        [SerializeField] private float attackRange = 2.0f;
        [SerializeField] private float attackDamage = 10.0f;
        
        private Transform target;
        
        protected override void Initialize()
        {
            target = GameObject.FindGameObjectWithTag("Player")?.transform;
            Debug.Log("Enemy Controller initialized");
        }
        
        public override void Move(Vector3 direction)
        {
            // AI移动逻辑
            if (target != null)
            {
                Vector3 directionToPlayer = (target.position - transform.position).normalized;
                transform.Translate(directionToPlayer * speed * Time.deltaTime);
            }
        }
        
        public void Attack()
        {
            if (target != null && Vector3.Distance(transform.position, target.position) <= attackRange)
            {
                // 攻击逻辑
                Debug.Log($"Enemy attacks for {attackDamage} damage!");
            }
        }
    }
}