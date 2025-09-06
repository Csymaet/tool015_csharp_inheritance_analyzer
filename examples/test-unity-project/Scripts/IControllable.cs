namespace GameCore
{
    // 可控制接口
    public interface IControllable
    {
        void HandleInput(string input);
    }
    
    // 可攻击接口
    public interface IAttackable
    {
        void Attack();
        float GetAttackDamage();
    }
}