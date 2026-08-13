"""
原神抽卡模拟器 - 核心逻辑
"""

import random

# ============================================
# 概率配置
# ============================================

class GachaConfig:
    """抽卡配置"""
    # 角色卡池
    CHARACTER_BASE_5 = 0.006  # 0.6%
    CHARACTER_SOFT_PITY_START = 73  # 软保底开始
    CHARACTER_SOFT_PITY_INC = 0.06  # 软保底递增6%
    CHARACTER_HARD_PITY = 90  # 硬保底
    
    # 角色UP规则
    CHARACTER_UP_RATE = 0.50  # 50%概率UP
    CHARACTER_CAPTURE_ACTIVATE = 3  # 连续歪3次触发捕获明光
    
    # 武器卡池
    WEAPON_BASE_5 = 0.007  # 0.7%
    WEAPON_SOFT_PITY_START = 62
    WEAPON_SOFT_PITY_INC = 0.07
    WEAPON_HARD_PITY = 80
    
    # 武器UP规则
    WEAPON_UP_RATE = 0.75  # 75%概率为UP武器之一
    WEAPON_GUARANTEE_1 = 1  # 第一次定轨失败
    WEAPON_GUARANTEE_2 = 2  # 第二次定轨失败
    WEAPON_GUARANTEE_MAX = 2  # 最多2次后必出定轨
    
    # 四星
    FOUR_STAR_BASE = 0.051  # 5.1%
    FOUR_STAR_HARD_PITY = 10  # 10抽必出四星
    FOUR_STAR_UP_RATE = 0.50  # 50%概率UP


# ============================================
# 卡池类
# ============================================

class CharacterBanner:
    """角色卡池"""
    
    def __init__(self):
        self.five_pity = 0  # 五星保底计数
        self.four_pity = 0  # 四星保底计数
        self.guarantee = False  # 大保底（下次出金必UP）
        self.capture_count = 0  # 连续歪的次数（捕获明光）
        
        self.total_pulls = 0
        self.five_star_count = 0
        self.four_star_count = 0
        self.three_star_count = 0
        
        self.five_history = []  # 记录每次出金的抽数
        self.pull_history = []  # 全部抽卡记录
    
    def get_five_star_rate(self):
        """计算当前五星概率（含软保底）"""
        if self.five_pity < 74:
            return 0.006
        elif self.five_pity <= 90:
            return 0.006 + (self.five_pity - 73) * 0.06
        return 1.0
    
    def get_four_star_rate(self):
        """计算当前四星概率"""
        if self.four_pity < 9:
            return 0.051
        elif self.four_pity == 9:
            return 0.561
        return 1.0
    
    def pull(self, count=1):
        """抽卡，count=1单抽，count=10十连"""
        results = []
        for _ in range(count):
            result = self._single_pull()
            results.append(result)
            self.total_pulls += 1
            
            # 统计
            if result['rarity'] == 5:
                self.five_star_count += 1
                self.five_history.append(self.total_pulls)
            elif result['rarity'] == 4:
                self.four_star_count += 1
            else:
                self.three_star_count += 1
            
            self.pull_history.append(result)
        
        return results
    
    def _single_pull(self):
        """单次抽卡"""
        self.five_pity += 1
        self.four_pity += 1
        
        # === 判定五星 ===
        if self.five_pity >= 90 or random.random() < self.get_five_star_rate():
            return self._roll_five()
        
        # === 判定四星 ===
        if self.four_pity >= 10 or random.random() < self.get_four_star_rate():
            return self._roll_four()
        
        # === 三星 ===
        return {
            'rarity': 3,
            'type': 'character',
            'name': '三星物品',
            'is_up': False,
            'is_target': False,
            'pulls': self.total_pulls + 1
        }
    
    def _roll_five(self):
        """五星结果"""
        self.five_pity = 0
        self.four_pity = 0
        
        # 判定是否UP
        is_up = False
        if self.guarantee:
            is_up = True
            self.guarantee = False
            self.capture_count = 0
        else:
            if random.random() < 0.5:
                is_up = True
                self.capture_count = 0
            else:
                self.guarantee = True
                self.capture_count += 1
        
        return {
            'rarity': 5,
            'type': 'character',
            'name': '五星角色（UP）' if is_up else '五星角色（非UP）',
            'is_up': is_up,
            'is_target': is_up,  # 简化：UP即为目标
            'pulls': self.total_pulls + 1
        }
    
    def _roll_four(self):
        """四星结果"""
        self.four_pity = 0
        
        # 判定是否UP（50%）
        is_up = random.random() < 0.5
        
        return {
            'rarity': 4,
            'type': 'character',
            'name': '四星角色（UP）' if is_up else '四星角色（非UP）',
            'is_up': is_up,
            'is_target': False,
            'pulls': self.total_pulls + 1
        }
    
    def get_stats(self):
        """获取统计数据"""
        return {
            'total_pulls': self.total_pulls,
            'five_star': self.five_star_count,
            'four_star': self.four_star_count,
            'three_star': self.three_star_count,
            'five_rate': round(self.five_star_count / self.total_pulls * 100, 2) if self.total_pulls > 0 else 0,
            'five_pity': self.five_pity,
            'guarantee': self.guarantee
        }


class WeaponBanner:
    """武器卡池"""
    
    def __init__(self):
        self.five_pity = 0
        self.four_pity = 0
        self.guarantee_count = 0  # 定轨失败次数
        
        self.total_pulls = 0
        self.five_star_count = 0
        self.four_star_count = 0
        self.three_star_count = 0
        
        self.five_history = []
        self.pull_history = []
        
        self.target_weapon = None  # 定轨武器
    
    def get_five_star_rate(self):
        """计算当前五星概率（含软保底）"""
        if self.five_pity < 62:
            return 0.007
        elif self.five_pity <= 74:
            return 0.007 + (self.five_pity - 61) * 0.07
        elif self.five_pity <= 80:
            return 0.007 + (self.five_pity - 61) * 0.07 + (self.five_pity - 74) * 0.035
        return 1.0
    
    def get_four_star_rate(self):
        """计算当前四星概率"""
        # 武器池四星综合概率14.5%
        if self.four_pity < 9:
            return 0.145
        elif self.four_pity == 9:
            return 0.655
        return 1.0
    
    def set_target(self, weapon_name):
        """设置定轨武器"""
        self.target_weapon = weapon_name
        self.guarantee_count = 0
    
    def pull(self, count=1):
        results = []
        for _ in range(count):
            result = self._single_pull()
            results.append(result)
            self.total_pulls += 1
            
            if result['rarity'] == 5:
                self.five_star_count += 1
                self.five_history.append(self.total_pulls)
            elif result['rarity'] == 4:
                self.four_star_count += 1
            else:
                self.three_star_count += 1
            
            self.pull_history.append(result)
        
        return results
    
    def _single_pull(self):
        self.five_pity += 1
        self.four_pity += 1
        
        if self.five_pity >= 80 or random.random() < self.get_five_star_rate():
            return self._roll_five()
        
        if self.four_pity >= 10 or random.random() < self.get_four_star_rate():
            return self._roll_four()
        
        return {
            'rarity': 3,
            'type': 'weapon',
            'name': '三星武器',
            'is_up': False,
            'is_target': False,
            'pulls': self.total_pulls + 1
        }
    
    def _roll_five(self):
        self.five_pity = 0
        self.four_pity = 0
        
        # 判定UP（75%概率为UP武器之一）
        is_up = random.random() < 0.75
        
        # 判定是否定轨武器
        is_target = False
        if is_up and self.target_weapon:
            # 双UP各占一半
            is_target = random.random() < 0.5
        
        if is_target:
            self.guarantee_count = 0
        else:
            self.guarantee_count += 1
        
        # 定轨保底：2次失败后必出定轨
        if self.guarantee_count >= 2 and self.target_weapon:
            is_target = True
            is_up = True
            self.guarantee_count = 0
        
        return {
            'rarity': 5,
            'type': 'weapon',
            'name': '五星武器（定轨）' if is_target else '五星武器（UP）' if is_up else '五星武器（非UP）',
            'is_up': is_up,
            'is_target': is_target,
            'pulls': self.total_pulls + 1
        }
    
    def _roll_four(self):
        self.four_pity = 0
        return {
            'rarity': 4,
            'type': 'weapon',
            'name': '四星武器',
            'is_up': False,
            'is_target': False,
            'pulls': self.total_pulls + 1
        }
    
    def get_stats(self):
        return {
            'total_pulls': self.total_pulls,
            'five_star': self.five_star_count,
            'four_star': self.four_star_count,
            'three_star': self.three_star_count,
            'five_rate': round(self.five_star_count / self.total_pulls * 100, 2) if self.total_pulls > 0 else 0,
            'five_pity': self.five_pity,
            'guarantee_count': self.guarantee_count
        }