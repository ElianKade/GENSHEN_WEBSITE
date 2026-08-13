var questions = [];
var currentIndex = 0;
var correctCount = 0;
var answered = false;

function loadQuestions() {
    fetch('/quiz/easy/api')
        .then(function(response) {
            if (!response.ok) {
                throw new Error('加载题目失败');
            }
            return response.json();
        })
        .then(function(data) {
            if (data.error) {
                alert(data.error);
                return;
            }
            questions = data;
            currentIndex = 0;
            correctCount = 0;
            answered = false;
            showQuestion();
        })
        .catch(function(error) {
            alert('加载题目失败，请重试');
            console.error(error);
        });
}

function showQuestion() {
    if (currentIndex >= questions.length) {
        showResult();
        return;
    }

    var q = questions[currentIndex];
    document.getElementById('question-text').textContent = q.question;
    document.getElementById('question-number').textContent = (currentIndex + 1) + '/' + questions.length;

    var optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    var labels = ['A', 'B', 'C', 'D'];
    q.options.forEach(function(option, index) {
        var btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = labels[index] + '. ' + option;
        btn.dataset.index = index;
        btn.onclick = function() { selectOption(index); };
        optionsContainer.appendChild(btn);
    });

    document.getElementById('feedback').style.display = 'none';
    document.getElementById('next-btn').style.display = 'none';
    document.getElementById('result-area').style.display = 'none';
    answered = false;
}

function selectOption(index) {
    if (answered) return;
    answered = true;

    var q = questions[currentIndex];
    var buttons = document.querySelectorAll('.option-btn');
    var isCorrect = (index === q.answer);

    buttons.forEach(function(btn, i) {
        btn.disabled = true;
        if (i === q.answer) {
            btn.classList.add('correct');
        }
        if (i === index && !isCorrect) {
            btn.classList.add('wrong');
        }
    });

    if (isCorrect) {
        correctCount++;
        document.getElementById('feedback').textContent = '正确！';
        document.getElementById('feedback').className = 'feedback correct';
    } else {
        document.getElementById('feedback').textContent = '正确答案是 ' + ['A', 'B', 'C', 'D'][q.answer];
        document.getElementById('feedback').className = 'feedback wrong';
    }

    document.getElementById('feedback').style.display = 'block';
    document.getElementById('next-btn').style.display = 'block';
}

function nextQuestion() {
    currentIndex++;
    showQuestion();
}

function showResult() {
    document.getElementById('question-area').style.display = 'none';
    document.getElementById('result-area').style.display = 'block';

    var passed = correctCount >= 8;
    var resultTitle = document.getElementById('result-title');
    var resultDesc = document.getElementById('result-desc');

    if (passed) {
        resultTitle.textContent = '恭喜成为一名入门的旅行者';
        resultDesc.textContent = '答对了 ' + correctCount + '/10 题，你对提瓦特大陆已经有了初步了解！';
        resultTitle.className = 'result-title pass';
    } else {
        resultTitle.textContent = '再试一次吧';
        resultDesc.textContent = '答对了 ' + correctCount + '/10 题，多看看原神的故事吧！';
        resultTitle.className = 'result-title fail';
    }
}

function retryQuiz() {
    window.location.href = '/quiz/easy';
}

function goHome() {
    window.location.href = '/';
}