// ============================================
// DOM 元素引用
// ============================================

var dateInput = document.getElementById('birth_date');
var hint = document.getElementById('hint');
var hiddenPicker = document.getElementById('hiddenDatePicker');
var pickerBtn = document.getElementById('datePickerBtn');
var spinBtn = document.getElementById('spinBtn');

// ============================================
// 随机滚动功能
// ============================================

var spinTimer = null;
var isSpinning = false;

function getRandomDate() {
    var year = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000;
    var month = Math.floor(Math.random() * 12) + 1;
    var day = Math.floor(Math.random() * 31) + 1;
    var monthStr = String(month).padStart(2, '0');
    var dayStr = String(day).padStart(2, '0');
    return year + '-' + monthStr + '-' + dayStr;
}

function startSpinning() {
    if (isSpinning) return;
    isSpinning = true;
    spinBtn.textContent = '滚动中...';
    spinBtn.classList.add('spinning');
    hint.textContent = '随机滚动中...';
    hint.classList.add('active');
    spinTimer = setInterval(function() {
        dateInput.value = getRandomDate();
    }, 50);
}

function stopSpinning() {
    if (!isSpinning) return;
    isSpinning = false;
    clearInterval(spinTimer);
    spinTimer = null;
    spinBtn.textContent = '随机滚动';
    spinBtn.classList.remove('spinning');
    hint.textContent = '已停止，点击检测查看结果';
    hint.classList.remove('active');
    setTimeout(function() {
        hint.textContent = '可手动输入、选择日期或按住随机滚动';
    }, 2000);
}

// ============================================
// 随机滚动按钮事件
// ============================================

spinBtn.addEventListener('mousedown', function(e) {
    e.preventDefault();
    startSpinning();
});

spinBtn.addEventListener('mouseup', function(e) {
    e.preventDefault();
    stopSpinning();
});

spinBtn.addEventListener('mouseleave', function() {
    if (isSpinning) {
        stopSpinning();
    }
});

// 触摸设备支持
spinBtn.addEventListener('touchstart', function(e) {
    e.preventDefault();
    startSpinning();
});

spinBtn.addEventListener('touchend', function(e) {
    e.preventDefault();
    stopSpinning();
});

spinBtn.addEventListener('touchcancel', function() {
    if (isSpinning) {
        stopSpinning();
    }
});

// ============================================
// 日期选择按钮 - 触发原生日期选择器
// ============================================

pickerBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    hiddenPicker.showPicker ? hiddenPicker.showPicker() : hiddenPicker.click();
});

// 当隐藏的日期选择器变化时，更新文本框
hiddenPicker.addEventListener('change', function() {
    if (this.value) {
        dateInput.value = this.value;
        hint.textContent = '已选择日期: ' + this.value;
        hint.classList.remove('active');
    }
});

// ============================================
// 日期输入框 - 手动输入
// ============================================

dateInput.addEventListener('input', function() {
    hint.classList.remove('active');
});

// ============================================
// 日期验证和格式化
// ============================================

function isValidDate(dateStr) {
    var regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    
    var parts = dateStr.split('-');
    var year = parseInt(parts[0]);
    var month = parseInt(parts[1]) - 1;
    var day = parseInt(parts[2]);
    
    var date = new Date(year, month, day);
    return date.getFullYear() === year && 
           date.getMonth() === month && 
           date.getDate() === day;
}

// ============================================
// 检测入坑天数
// ============================================

function calculate() {
    var birthDate = dateInput.value.trim();
    var resultDiv = document.getElementById('result');
    var errorDiv = document.getElementById('error');
    var loadingDiv = document.getElementById('loading');

    resultDiv.style.display = 'none';
    errorDiv.style.display = 'none';
    loadingDiv.style.display = 'block';

    if (!birthDate) {
        errorDiv.textContent = '请选择或输入入坑日期';
        errorDiv.style.display = 'block';
        loadingDiv.style.display = 'none';
        return;
    }

    if (!isValidDate(birthDate)) {
        errorDiv.textContent = '请输入正确格式的日期 (YYYY-MM-DD)';
        errorDiv.style.display = 'block';
        loadingDiv.style.display = 'none';
        return;
    }

    fetch('/calculate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'birth_date=' + birthDate
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        loadingDiv.style.display = 'none';

        if (data.error) {
            errorDiv.textContent = data.error;
            errorDiv.style.display = 'block';
            return;
        }

        if (data.success) {
            document.getElementById('birthInfo').textContent = '入坑日期：' + data.birth_date;
            document.getElementById('daysLived').textContent = data.days_lived.toLocaleString();
            
            var levelElement = document.getElementById('level');
            levelElement.textContent = data.level;
            
            var extraElement = document.getElementById('levelExtra');
            var daysLabel = document.getElementById('daysLabel');
            
            if (data.special) {
                resultDiv.classList.add('special');
                levelElement.classList.add('special');
                
                if (data.days_to_future !== undefined) {
                    extraElement.textContent = '还有 ' + data.days_to_future + ' 天入坑';
                    daysLabel.textContent = '（未来）';
                } else if (data.days_before_release !== undefined) {
                    extraElement.textContent = '比原神开服早 ' + data.days_before_release + ' 天';
                    daysLabel.textContent = '天（开服前）';
                }
            } else {
                resultDiv.classList.remove('special');
                levelElement.classList.remove('special');
                extraElement.textContent = '';
                daysLabel.textContent = '天';
            }
            
            resultDiv.style.display = 'block';
            resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    })
    .catch(function() {
        loadingDiv.style.display = 'none';
        errorDiv.textContent = '网络错误，请重试';
        errorDiv.style.display = 'block';
    });
}

// ============================================
// 返回主界面
// ============================================

function goBack() {
    window.location.href = '/';
}

// ============================================
// 初始化
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    var today = new Date();
    var defaultDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    var year = defaultDate.getFullYear();
    var month = String(defaultDate.getMonth() + 1).padStart(2, '0');
    var day = String(defaultDate.getDate()).padStart(2, '0');
    dateInput.value = year + '-' + month + '-' + day;

    dateInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            calculate();
        }
    });
});