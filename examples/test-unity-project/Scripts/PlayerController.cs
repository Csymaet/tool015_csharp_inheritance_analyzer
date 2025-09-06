using UnityEngine;

namespace GameCore
{
    // 玩家控制器，继承自BaseController
    public class PlayerController : BaseController, IControllable
    {
        [SerializeField] private float jumpForce = 10.0f;
        private Rigidbody rb;
        
        protected override void Initialize()
        {
            rb = GetComponent<Rigidbody>();
            Debug.Log("Player Controller initialized");
        }
        
        public override void Move(Vector3 direction)
        {
            transform.Translate(direction * speed * Time.deltaTime);
        }
        
        public void Jump()
        {
            if (rb != null)
            {
                rb.AddForce(Vector3.up * jumpForce, ForceMode.Impulse);
            }
        }
        
        public void HandleInput(string input)
        {
            // 处理输入
        }
    }
}