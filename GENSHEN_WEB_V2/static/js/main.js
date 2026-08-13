function goToCalculator() {
    window.location.href = '/calculator';
}

function goToQuiz() {
    window.location.href = '/quiz';
}

function goToTrap() {
    window.location.href = '/trap';
}

function goToGacha() {
    window.location.href = '/gacha';
}

document.addEventListener('DOMContentLoaded', function() {
    var items = document.querySelectorAll('.menu-item.active');
    items.forEach(function(item, index) {
        item.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                if (index === 0) {
                    goToCalculator();
                } else if (index === 1) {
                    goToQuiz();
                } else if (index === 5) {
                    goToTrap();
                }
            }
        });
        item.setAttribute('tabindex', '0');
    });
});