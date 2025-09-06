using UnityEngine;

namespace GameCore
{
    // 游戏管理器，继承自MonoBehaviour但不通过BaseController
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }
        
        [SerializeField] private PlayerController playerController;
        [SerializeField] private EnemyController[] enemyControllers;
        
        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        private void Start()
        {
            InitializeGame();
        }
        
        private void InitializeGame()
        {
            Debug.Log("Game initialized");
        }
    }
}