from flask import Flask, render_template, request, jsonify
from datetime import datetime, date
import random
import json
import os
import sys

app = Flask(__name__)

# 原神开服日期：2020年9月28日
GENSHIN_RELEASE = date(2020, 9, 28)


# ============================================
# 获取资源文件路径（适配打包）
# ============================================
def get_resource_path(relative_path):
    """获取资源文件的正确路径（开发环境和打包后都适用）"""
    try:
        # PyInstaller 打包后的临时目录
        base_path = sys._MEIPASS
    except Exception:
        # 开发环境
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)


# ============================================
# 加载题库
# ============================================
def load_questions(filename):
    """从JSON文件加载题库"""
    filepath = get_resource_path(os.path.join('data', filename))
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"警告: 文件 {filepath} 不存在，使用空题库")
        return []
    except json.JSONDecodeError:
        print(f"错误: 文件 {filepath} 格式错误，请检查JSON格式")
        return []


# 加载所有题库
QUIZ_QUESTIONS = load_questions('questions_easy.json')
EXTREME_QUESTIONS = load_questions('questions_extreme.json')

print(f"加载成功: 简单题库 {len(QUIZ_QUESTIONS)} 题, 绝境题库 {len(EXTREME_QUESTIONS)} 题")

# ============================================
# 路由：首页
# ============================================
@app.route('/')
def index():
    """主界面"""
    return render_template('index.html')


# ============================================
# 路由：老资历检测
# ============================================
@app.route('/calculator')
def calculator():
    """计算器界面"""
    return render_template('calculator.html')


@app.route('/calculate', methods=['POST'])
def calculate():
    """计算入坑天数"""
    try:
        birth_str = request.form.get('birth_date')
        if not birth_str:
            return jsonify({'error': '请选择入坑日期'}), 400

        birth_date = datetime.strptime(birth_str, '%Y-%m-%d').date()
        today = date.today()

        if birth_date > today:
            return jsonify({
                'success': True,
                'birth_date': birth_date.strftime('%Y年%m月%d日'),
                'days_lived': 0,
                'level': '尊敬的伊斯塔露大人您好',
                'special': True,
                'days_to_future': (birth_date - today).days
            })

        days_lived = (today - birth_date).days

        if birth_date < GENSHIN_RELEASE:
            return jsonify({
                'success': True,
                'birth_date': birth_date.strftime('%Y年%m月%d日'),
                'days_lived': days_lived,
                'level': '你要和钟老爷子称兄道弟吗？',
                'special': True,
                'days_before_release': (GENSHIN_RELEASE - birth_date).days
            })

        level = get_lao_deng_level(days_lived)

        return jsonify({
            'success': True,
            'birth_date': birth_date.strftime('%Y年%m月%d日'),
            'days_lived': days_lived,
            'level': level,
            'special': False
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400


def get_lao_deng_level(days):
    """根据天数返回老登等级"""
    if days < 365:
        return "萌新"
    elif days < 1095:
        return "中登"
    else:
        return "老登"


# ============================================
# 路由：提瓦特问答
# ============================================
@app.route('/quiz')
def quiz():
    """问答主界面"""
    return render_template('quiz.html')


@app.route('/quiz/easy')
def quiz_easy():
    """简单模式 - 答题页面"""
    return render_template('quiz_easy.html')


@app.route('/quiz/easy/api')
def api_quiz_easy():
    """API: 获取简单模式10道随机题"""
    if len(QUIZ_QUESTIONS) < 10:
        return jsonify({'error': '题库题目不足10题，请补充题库'}), 400
    selected = random.sample(QUIZ_QUESTIONS, 10)
    return jsonify(selected)


@app.route('/quiz/hard')
def quiz_hard():
    """困难模式 - 开发中"""
    return render_template('quiz_hard.html')


@app.route('/quiz/extreme')
def quiz_extreme():
    """绝境模式 - 答题页面"""
    return render_template('quiz_extreme.html')


@app.route('/quiz/extreme/api')
def api_quiz_extreme():
    """API: 获取绝境模式5道随机题"""
    if len(EXTREME_QUESTIONS) < 5:
        return jsonify({'error': '题库题目不足5题，请补充题库'}), 400
    selected = random.sample(EXTREME_QUESTIONS, 5)
    return jsonify(selected)


@app.route('/api/questions/count')
def get_question_count():
    """获取各题库题目数量"""
    return jsonify({
        'easy': len(QUIZ_QUESTIONS),
        'extreme': len(EXTREME_QUESTIONS),
        'hard': 0
    })


# ============================================
# 路由：原老诱捕器
# ============================================
@app.route('/trap')
def trap():
    """原老诱捕器 - 图片展示"""
    return render_template('trap.html')



# ============================================
# 路由：抽卡模拟器
# ============================================

@app.route('/gacha')
def gacha():
    """抽卡模拟器主界面"""
    return render_template('gacha.html')


# ============================================
# 启动应用
# ============================================
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)