// ============================================
// 抽卡模拟器 - 前端逻辑
// ============================================

// ===== 全局资源（共用） =====
var globalResources = {
    primogem: 0,
    genesis: 0,
    fate: 0
};

// ===== 池子数据 =====
var poolData = {
    character: {
        totalPulls: 0,
        totalSpent: 0,
        fiveStar: 0,
        fourStar: 0,
        threeStar: 0,
        fivePity: 0,
        fourPity: 0,
        guarantee: false,
        targetHit: 0,
        upHit: 0,
        standardHit: 0,
        fiftyFiftyWins: 0,
        fiftyFiftyLosses: 0,
        targetType: null,
        targetCount: 0,
        targetAchieved: false,
        summaryShown: false
    },
    weapon: {
        totalPulls: 0,
        totalSpent: 0,
        fiveStar: 0,
        fourStar: 0,
        threeStar: 0,
        fivePity: 0,
        fourPity: 0,
        guarantee: false,
        targetHit: 0,
        upHit: 0,
        standardHit: 0,
        fiftyFiftyWins: 0,
        fiftyFiftyLosses: 0,
        targetType: null,
        targetCount: 0,
        targetAchieved: false,
        summaryShown: false
    }
};

// ===== 当前状态 =====
var currentBanner = 'character';

// ============================================
// 获取当前池子数据
// ============================================

function getPool() {
    return poolData[currentBanner];
}

// ============================================
// 初始化
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    updateUI();
    updatePity();
    updateTargetOptions();
    updateStatsDisplay();
    document.getElementById('fivePityMax').textContent = '90';
});

// ============================================
// 卡池切换
// ============================================

function switchBanner(type) {
    currentBanner = type;
    document.querySelectorAll('.banner-tab').forEach(function(el) {
        el.classList.toggle('active', el.dataset.banner === type);
    });
    clearResults();
    updatePity();
    updateStatsDisplay();
    updateUI();
    document.getElementById('statsBannerName').textContent = type === 'character' ? '角色卡池' : '武器卡池';
    // 更新五星保底最大值
    document.getElementById('fivePityMax').textContent = type === 'character' ? '90' : '80';
}

// ============================================
// 清空结果
// ============================================

function clearResults() {
    document.getElementById('resultGrid').innerHTML = '';
}

// ============================================
// 目标系统
// ============================================

function updateTargetOptions() {
    var type = document.getElementById('targetTypeSelect').value;
    var wrapper = document.getElementById('targetCountWrapper');
    var confirmBtn = document.getElementById('targetConfirmBtn');
    
    if (type === 'character' || type === 'weapon') {
        wrapper.style.display = 'flex';
        confirmBtn.style.display = 'inline-block';
    } else {
        wrapper.style.display = 'none';
        confirmBtn.style.display = 'none';
    }
}

function confirmTarget() {
    var type = document.getElementById('targetTypeSelect').value;
    var count = parseInt(document.getElementById('targetCountSelect').value);
    
    if (!type || !count) {
        showToast('请选择目标和数量');
        return;
    }
    
    var pool = getPool();
    
    // 保底计数保持不变（已抽的抽数继续有效）
    // 只重置目标相关统计和出货统计，不重置保底
    pool.targetType = type;
    pool.targetCount = count;
    pool.targetHit = 0;
    pool.upHit = 0;
    pool.standardHit = 0;
    pool.targetAchieved = false;
    pool.summaryShown = false;
    pool.fiftyFiftyWins = 0;
    pool.fiftyFiftyLosses = 0;
    pool.totalPulls = 0;
    pool.totalSpent = 0;
    pool.fiveStar = 0;
    pool.fourStar = 0;
    pool.threeStar = 0;
    // 保底计数不变！
    // pool.fivePity 保持不变
    // pool.fourPity 保持不变
    // pool.guarantee 保持不变
    
    clearResults();
    updateUI();
    updatePity();
    updateStatsDisplay();
    
    document.getElementById('targetProgress').textContent = '目标：' + (type === 'character' ? '角色' : '武器') + ' ×' + count + '（0/' + count + '）';
    showToast('目标已锁定！保底计数已保留');
}

function updateTargetProgress() {
    var progress = document.getElementById('targetProgress');
    var pool = getPool();
    if (pool.targetType && pool.targetCount > 0) {
        var name = pool.targetType === 'character' ? '角色' : '武器';
        progress.textContent = '目标：' + name + ' ×' + pool.targetCount + '（' + pool.targetHit + '/' + pool.targetCount + '）';
    } else {
        progress.textContent = '未设定';
    }
}

// ============================================
// 重置统计（当前池子）
// ============================================

function resetStats() {
    // 美化后的确认弹窗
    showConfirmModal('确定要重置当前卡池的统计吗？', function() {
        var pool = getPool();
        pool.totalPulls = 0;
        pool.totalSpent = 0;
        pool.fiveStar = 0;
        pool.fourStar = 0;
        pool.threeStar = 0;
        pool.fivePity = 0;
        pool.fourPity = 0;
        pool.guarantee = false;
        pool.targetHit = 0;
        pool.upHit = 0;
        pool.standardHit = 0;
        pool.fiftyFiftyWins = 0;
        pool.fiftyFiftyLosses = 0;
        pool.targetType = null;
        pool.targetCount = 0;
        pool.targetAchieved = false;
        pool.summaryShown = false;
        
        document.getElementById('targetTypeSelect').value = '';
        document.getElementById('targetCountWrapper').style.display = 'none';
        document.getElementById('targetConfirmBtn').style.display = 'none';
        document.getElementById('targetProgress').textContent = '未设定';
        
        clearResults();
        updateUI();
        updatePity();
        updateStatsDisplay();
        showToast('统计已重置');
    });
}

// ============================================
// 美化确认弹窗
// ============================================

function showConfirmModal(message, callback) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 
        'position:fixed;top:0;left:0;width:100%;height:100%;' +
        'background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);' +
        'z-index:9999;display:flex;justify-content:center;align-items:center;';
    
    var box = document.createElement('div');
    box.style.cssText = 
        'background:linear-gradient(145deg,rgba(25,30,50,0.95),rgba(15,18,30,0.98));' +
        'border-radius:24px;padding:35px 30px 25px;max-width:380px;width:90%;' +
        'border:1px solid rgba(255,215,0,0.08);box-shadow:0 40px 100px rgba(0,0,0,0.8);' +
        'text-align:center;';
    
    var title = document.createElement('div');
    title.style.cssText = 'color:#f6d365;font-size:20px;font-weight:700;margin-bottom:12px;';
    title.textContent = '⚠️ 确认重置';
    
    var msg = document.createElement('div');
    msg.style.cssText = 'color:rgba(255,255,255,0.6);font-size:15px;margin-bottom:24px;line-height:1.6;';
    msg.textContent = message;
    
    var btnGroup = document.createElement('div');
    btnGroup.style.cssText = 'display:flex;gap:12px;justify-content:center;';
    
    var confirmBtn = document.createElement('button');
    confirmBtn.style.cssText = 
        'padding:10px 32px;background:rgba(255,80,80,0.15);' +
        'border:1px solid rgba(255,80,80,0.2);border-radius:12px;' +
        'color:#f87171;font-weight:600;cursor:pointer;font-size:15px;' +
        'transition:all 0.3s ease;font-family:inherit;';
    confirmBtn.textContent = '确定重置';
    confirmBtn.onmouseover = function() {
        this.style.background = 'rgba(255,80,80,0.25)';
    };
    confirmBtn.onmouseout = function() {
        this.style.background = 'rgba(255,80,80,0.15)';
    };
    confirmBtn.onclick = function() {
        document.body.removeChild(overlay);
        callback();
    };
    
    var cancelBtn = document.createElement('button');
    cancelBtn.style.cssText = 
        'padding:10px 32px;background:rgba(255,255,255,0.05);' +
        'border:1px solid rgba(255,255,255,0.08);border-radius:12px;' +
        'color:rgba(255,255,255,0.5);font-weight:600;cursor:pointer;font-size:15px;' +
        'transition:all 0.3s ease;font-family:inherit;';
    cancelBtn.textContent = '取消';
    cancelBtn.onmouseover = function() {
        this.style.background = 'rgba(255,255,255,0.1)';
    };
    cancelBtn.onmouseout = function() {
        this.style.background = 'rgba(255,255,255,0.05)';
    };
    cancelBtn.onclick = function() {
        document.body.removeChild(overlay);
    };
    
    btnGroup.appendChild(confirmBtn);
    btnGroup.appendChild(cancelBtn);
    box.appendChild(title);
    box.appendChild(msg);
    box.appendChild(btnGroup);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
}

// ============================================
// 商城
// ============================================

function openShop() {
    document.getElementById('shopModal').classList.add('active');
}

function closeShop() {
    document.getElementById('shopModal').classList.remove('active');
}

function recharge(money, genesis) {
    globalResources.genesis += genesis;
    updateUI();
    closeShop();
    showToast('充值成功！获得 ' + genesis + ' 创世结晶');
}

// ============================================
// 兑换弹窗
// ============================================

function openPrimogemModal() {
    document.getElementById('maxGenesis').textContent = globalResources.genesis;
    document.getElementById('primogemInput').value = '';
    document.getElementById('primogemModal').classList.add('active');
}

function closePrimogemModal() {
    document.getElementById('primogemModal').classList.remove('active');
}

function setMaxPrimogem() {
    document.getElementById('primogemInput').value = globalResources.genesis;
}

function confirmPrimogem() {
    var amount = parseInt(document.getElementById('primogemInput').value);
    if (isNaN(amount) || amount <= 0) {
        showToast('请输入有效数量');
        return;
    }
    if (amount > globalResources.genesis) {
        showToast('创世结晶不足');
        return;
    }
    globalResources.genesis -= amount;
    globalResources.primogem += amount;
    updateUI();
    closePrimogemModal();
    showToast('兑换成功！获得 ' + amount + ' 原石');
}

function openFateModal() {
    var maxFate = Math.floor(globalResources.primogem / 160);
    document.getElementById('maxFate').textContent = maxFate;
    document.getElementById('fateInput').value = '';
    document.getElementById('fateModal').classList.add('active');
}

function closeFateModal() {
    document.getElementById('fateModal').classList.remove('active');
}

function setMaxFate() {
    var maxFate = Math.floor(globalResources.primogem / 160);
    document.getElementById('fateInput').value = maxFate;
}

function confirmFate() {
    var amount = parseInt(document.getElementById('fateInput').value);
    if (isNaN(amount) || amount <= 0) {
        showToast('请输入有效数量');
        return;
    }
    var cost = amount * 160;
    if (cost > globalResources.primogem) {
        showToast('原石不足，需要 ' + cost + ' 原石');
        return;
    }
    globalResources.primogem -= cost;
    globalResources.fate += amount;
    updateUI();
    closeFateModal();
    showToast('兑换成功！获得 ' + amount + ' 个纠缠之缘');
}

// ============================================
// 抽卡
// ============================================

function doPull(count) {
    var pool = getPool();
    
    if (pool.targetAchieved) {
        showToast('目标已达成！请重新设置目标或重置统计');
        return;
    }
    if (globalResources.fate < count) {
        showToast('纠缠之缘不足，需要 ' + count + ' 个');
        return;
    }
    
    globalResources.fate -= count;
    pool.totalPulls += count;
    pool.totalSpent += count;
    
    var results = [];
    for (var i = 0; i < count; i++) {
        var result = pullSingle();
        results.push(result);
    }
    
    displayResults(results);
    updateUI();
    updatePity();
    updateStatsDisplay();
    checkTarget(results);
}

function pullSingle() {
    var pool = getPool();
    var result;
    if (currentBanner === 'character') {
        result = characterPull(pool);
    } else {
        result = weaponPull(pool);
    }
    
    if (result.rarity === 5) {
        pool.fiveStar++;
    } else if (result.rarity === 4) {
        pool.fourStar++;
    } else {
        pool.threeStar++;
    }
    
    updateTargetProgress();
    return result;
}

function characterPull(pool) {
    pool.fivePity++;
    pool.fourPity++;
    var isGuaranteed = false;
    
    var fiveRate = getFiveRate(pool.fivePity);
    if (pool.fivePity >= 90 || Math.random() < fiveRate) {
        pool.fivePity = 0;
        pool.fourPity = 0;
        var isUp = false;
        var isTarget = false;
        
        if (pool.guarantee) {
            isUp = true;
            isGuaranteed = true;
            pool.guarantee = false;
            isTarget = (pool.targetType === 'character');
        } else {
            if (Math.random() < 0.5) {
                isUp = true;
                isGuaranteed = true;
                isTarget = (pool.targetType === 'character');
            } else {
                pool.guarantee = true;
                pool.fiftyFiftyLosses++;
            }
        }
        
        if (isTarget) {
            pool.targetHit++;
            pool.upHit++;
        } else if (isUp) {
            pool.upHit++;
        } else {
            pool.standardHit++;
        }
        
        return { 
            rarity: 5, 
            type: 'character', 
            isUp: isUp, 
            isTarget: isTarget,
            isGuaranteed: isGuaranteed,
            isWrong: !isTarget
        };
    }
    
    var fourRate = getFourRate(pool.fourPity);
    if (pool.fourPity >= 10 || Math.random() < fourRate) {
        pool.fourPity = 0;
        return { rarity: 4, type: 'character', isUp: Math.random() < 0.5, isTarget: false };
    }
    
    return { rarity: 3, type: 'character', isUp: false, isTarget: false };
}

function weaponPull(pool) {
    pool.fivePity++;
    pool.fourPity++;
    var isGuaranteed = false;
    
    var fiveRate = getWeaponFiveRate(pool.fivePity);
    if (pool.fivePity >= 80 || Math.random() < fiveRate) {
        pool.fivePity = 0;
        pool.fourPity = 0;
        var isUp = Math.random() < 0.75;
        var isTarget = false;
        
        if (isUp && pool.targetType === 'weapon') {
            isTarget = Math.random() < 0.5;
        }
        if (!isTarget) {
            pool.guarantee = true;
        } else {
            pool.guarantee = false;
            isGuaranteed = true;
        }
        if (pool.guarantee && pool.targetType === 'weapon') {
            isTarget = true;
            isUp = true;
            isGuaranteed = true;
            pool.guarantee = false;
        }
        
        if (isTarget) {
            pool.targetHit++;
            pool.upHit++;
        } else if (isUp) {
            pool.upHit++;
        } else {
            pool.standardHit++;
        }
        
        return { 
            rarity: 5, 
            type: 'weapon', 
            isUp: isUp, 
            isTarget: isTarget,
            isGuaranteed: isGuaranteed,
            isWrong: !isTarget
        };
    }
    
    var fourRate = getWeaponFourRate(pool.fourPity);
    if (pool.fourPity >= 10 || Math.random() < fourRate) {
        pool.fourPity = 0;
        return { rarity: 4, type: 'weapon', isUp: false, isTarget: false };
    }
    
    return { rarity: 3, type: 'weapon', isUp: false, isTarget: false };
}

// ============================================
// 概率计算
// ============================================

function getFiveRate(pity) {
    if (pity < 74) return 0.006;
    if (pity <= 90) return 0.006 + (pity - 73) * 0.06;
    return 1.0;
}

function getWeaponFiveRate(pity) {
    if (pity < 62) return 0.007;
    if (pity <= 74) return 0.007 + (pity - 61) * 0.07;
    if (pity <= 80) return 0.007 + (pity - 61) * 0.07 + (pity - 74) * 0.035;
    return 1.0;
}

function getFourRate(pity) {
    if (pity < 9) return 0.051;
    if (pity === 9) return 0.561;
    return 1.0;
}

function getWeaponFourRate(pity) {
    if (pity < 9) return 0.145;
    if (pity === 9) return 0.655;
    return 1.0;
}

// ============================================
// 结果展示
// ============================================

function displayResults(results) {
    var grid = document.getElementById('resultGrid');
    grid.innerHTML = '';
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(5, 1fr)';
    
    var maxItems = 10;
    var displayItems = results.slice(-maxItems);
    
    displayItems.forEach(function(result) {
        var item = document.createElement('div');
        var rarityClass = 'r' + result.rarity;
        item.className = 'result-item ' + rarityClass;
        
        if (result.rarity === 5 && result.isWrong) {
            item.classList.add('wrong');
            item.textContent = '歪';
        }
        
        var delay = Math.random() * 0.15;
        item.style.animationDelay = delay + 's';
        
        grid.appendChild(item);
    });
    
    var container = document.getElementById('resultContainer');
    container.scrollTop = container.scrollHeight;
}

// ============================================
// 统计面板（9项统计）
// ============================================

function updateStatsDisplay() {
    var pool = getPool();
    var content = document.getElementById('statsContent');
    var fiveRate = pool.totalPulls > 0 ? (pool.fiveStar / pool.totalPulls * 100).toFixed(2) : 0;
    var totalFiftyFifty = pool.fiftyFiftyWins + pool.fiftyFiftyLosses;
    var fiftyRate = totalFiftyFifty > 0 ? (pool.fiftyFiftyWins / totalFiftyFifty * 100).toFixed(1) : 0;
    
    content.innerHTML = 
        '<div class="stats-grid">' +
        '<div class="stat-item"><span class="num">' + pool.totalPulls + '</span>总抽数</div>' +
        '<div class="stat-item"><span class="num">' + pool.fiveStar + '</span>五星</div>' +
        '<div class="stat-item"><span class="num">' + pool.fourStar + '</span>四星</div>' +
        '<div class="stat-item"><span class="num">' + pool.threeStar + '</span>三星</div>' +
        '<div class="stat-item"><span class="num">' + fiveRate + '%</span>五星率</div>' +
        '<div class="stat-item"><span class="num">' + pool.totalSpent + '</span>纠缠</div>' +
        '<div class="stat-item"><span class="num green">' + pool.upHit + '</span>UP角色</div>' +
        '<div class="stat-item"><span class="num red">' + pool.standardHit + '</span>常驻角色</div>' +
        '<div class="stat-item"><span class="num purple">' + fiftyRate + '%</span>小保底不歪</div>' +
        '</div>';
    
    document.getElementById('statsBannerName').textContent = currentBanner === 'character' ? '角色卡池' : '武器卡池';
}

// ============================================
// 目标检查
// ============================================

function checkTarget(results) {
    var pool = getPool();
    if (!pool.targetType || pool.targetAchieved) return;
    if (pool.targetHit >= pool.targetCount) {
        pool.targetAchieved = true;
        showSummary('🎯 目标达成！');
    }
}

function showSummary(title) {
    var pool = getPool();
    if (pool.summaryShown) return;
    pool.summaryShown = true;
    
    var modal = document.getElementById('summaryModal');
    document.getElementById('summaryTitle').textContent = title;
    
    var content = document.getElementById('summaryContent');
    var fiveRate = pool.totalPulls > 0 ? (pool.fiveStar / pool.totalPulls * 100).toFixed(2) : 0;
    var totalFiftyFifty = pool.fiftyFiftyWins + pool.fiftyFiftyLosses;
    var fiftyRate = totalFiftyFifty > 0 ? (pool.fiftyFiftyWins / totalFiftyFifty * 100).toFixed(1) : 0;
    var targetName = pool.targetType === 'character' ? '角色' : '武器';
    
    content.innerHTML = 
        '<div class="summary-item"><span>目标</span><span class="value">' + targetName + ' ×' + pool.targetCount + '</span></div>' +
        '<div class="summary-item"><span>获得目标</span><span class="value">' + pool.targetHit + ' 个</span></div>' +
        '<div class="summary-item"><span>UP角色出货</span><span class="value">' + pool.upHit + ' 个</span></div>' +
        '<div class="summary-item"><span>常驻角色出货</span><span class="value">' + pool.standardHit + ' 个</span></div>' +
        '<div class="summary-item"><span>总花费</span><span class="value">' + pool.totalSpent + ' 纠缠之缘</span></div>' +
        '<div class="summary-item"><span>总抽数</span><span class="value">' + pool.totalPulls + ' 抽</span></div>' +
        '<div class="summary-item"><span>五星</span><span class="value">' + pool.fiveStar + ' 个</span></div>' +
        '<div class="summary-item"><span>四星</span><span class="value">' + pool.fourStar + ' 个</span></div>' +
        '<div class="summary-item"><span>三星</span><span class="value">' + pool.threeStar + ' 个</span></div>' +
        '<div class="summary-item"><span>五星率</span><span class="value">' + fiveRate + '%</span></div>' +
        '<div class="summary-item"><span>小保底不歪率</span><span class="value">' + fiftyRate + '%</span></div>' +
        '<div class="summary-item"><span>充值金额</span><span class="value">约 ' + (pool.totalSpent * 16).toFixed(0) + ' 元</span></div>';
    
    modal.classList.add('active');
}

function closeSummary() {
    document.getElementById('summaryModal').classList.remove('active');
    var pool = getPool();
    pool.summaryShown = false;
}

// ============================================
// UI更新
// ============================================

function updateUI() {
    document.getElementById('fateCount').textContent = globalResources.fate;
    document.getElementById('primogemCount').textContent = globalResources.primogem;
    document.getElementById('genesisCount').textContent = globalResources.genesis;
}

function updatePity() {
    var pool = getPool();
    document.getElementById('fivePity').textContent = pool.fivePity;
    document.getElementById('fourPity').textContent = pool.fourPity;
    document.getElementById('guaranteeDisplay').textContent = pool.guarantee ? '大保底' : '小保底';
    // 更新五星保底最大值
    document.getElementById('fivePityMax').textContent = currentBanner === 'character' ? '90' : '80';
}

// ============================================
// Toast提示
// ============================================

function showToast(msg) {
    var toast = document.createElement('div');
    toast.style.cssText = 
        'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);' +
        'background:rgba(0,0,0,0.85);color:white;padding:10px 24px;border-radius:12px;' +
        'font-size:14px;z-index:9999;animation:fadeIn 0.3s ease;' +
        'border:1px solid rgba(255,255,255,0.08);';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s ease';
        setTimeout(function() { toast.remove(); }, 500);
    }, 2000);
}

// ============================================
// 返回
// ============================================

function goBack() {
    window.location.href = '/';
}

// ============================================
// CSS动画
// ============================================

var style = document.createElement('style');
style.textContent = 
    '@keyframes fadeIn { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }';
document.head.appendChild(style);