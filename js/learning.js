// Learning page calculation functions

function calculateInduction() {
    const f = parseFloat(document.getElementById('calc-freq').value);
    const P = parseInt(document.getElementById('calc-poles').value);
    
    const ns = 120 * f / P;
    const slip = 0.05; // Typical 5% slip
    const nr = ns * (1 - slip);
    
    const result = `Synchronous Speed: ${ns.toFixed(0)} RPM<br>
                    Rotor Speed (5% slip): ${nr.toFixed(0)} RPM<br>
                    Slip: ${(slip * 100).toFixed(1)}%`;
    
    document.getElementById('calc-induction-result').innerHTML = result;
}

function calculateSync() {
    const V = parseFloat(document.getElementById('calc-sync-v').value);
    const pf = parseFloat(document.getElementById('calc-sync-pf').value);
    
    // Assume some current value for example
    const I = 50; // A
    
    const apparentPower = Math.sqrt(3) * V * I / 1000; // kVA
    const realPower = apparentPower * pf; // kW
    const reactivePower = apparentPower * Math.sin(Math.acos(pf)); // kVAR
    
    const result = `Apparent Power: ${apparentPower.toFixed(1)} kVA<br>
                    Real Power: ${realPower.toFixed(1)} kW<br>
                    Reactive Power: ${reactivePower.toFixed(1)} kVAR`;
    
    document.getElementById('calc-sync-result').innerHTML = result;
}

function calculateTorque() {
    const P = parseFloat(document.getElementById('calc-power').value); // kW
    const n = parseFloat(document.getElementById('calc-torquespeed').value); // RPM
    
    // P (kW) = T (Nm) * n (RPM) * 2π / 60 / 1000
    // T = P * 1000 * 60 / (2π * n)
    const T = P * 1000 * 60 / (2 * Math.PI * n);
    
    const result = `Torque: ${T.toFixed(2)} Nm<br>
                    Angular Velocity: ${(n * 2 * Math.PI / 60).toFixed(2)} rad/s`;
    
    document.getElementById('calc-torque-result').innerHTML = result;
}

function calculateEfficiency() {
    const Pout = parseFloat(document.getElementById('calc-output').value);
    const Pin = parseFloat(document.getElementById('calc-inputp').value);
    
    const eff = (Pout / Pin) * 100;
    const loss = Pin - Pout;
    
    const result = `Efficiency: ${eff.toFixed(1)}%<br>
                    Total Losses: ${loss.toFixed(0)} W`;
    
    document.getElementById('calc-eff-result').innerHTML = result;
}

// Quiz System
let quizScore = 0;
const answeredQuizzes = new Set();

function checkQuiz(button) {
    const quizCard = button.closest('.quiz-card');
    const options = quizCard.querySelectorAll('input[type="radio"]');
    const resultDiv = quizCard.querySelector('.quiz-result');
    const quizId = quizCard.dataset.quiz;
    
    // Find selected answer
    let selectedValue = null;
    options.forEach(opt => {
        if (opt.checked) selectedValue = opt.value;
    });
    
    if (!selectedValue) {
        resultDiv.innerHTML = '<span class="quiz-error">Please select an answer!</span>';
        resultDiv.className = 'quiz-result error';
        return;
    }
    
    // Check if already answered
    if (answeredQuizzes.has(quizId)) {
        resultDiv.innerHTML = '<span class="quiz-info">You already answered this question!</span>';
        resultDiv.className = 'quiz-result info';
        return;
    }
    
    // Mark as answered
    answeredQuizzes.add(quizId);
    
    if (selectedValue === 'correct') {
        quizScore++;
        resultDiv.innerHTML = '<span class="quiz-correct">✅ Correct! Well done!</span>';
        resultDiv.className = 'quiz-result correct';
        quizCard.classList.add('correct');
    } else {
        resultDiv.innerHTML = '<span class="quiz-incorrect">❌ Incorrect. Try reviewing the related topic!</span>';
        resultDiv.className = 'quiz-result incorrect';
        quizCard.classList.add('incorrect');
    }
    
    // Disable all options after answering
    options.forEach(opt => opt.disabled = true);
    
    // Update score display
    document.getElementById('quiz-correct').textContent = quizScore;
    
    // Save to user progress if logged in
    if (window.authSystem && window.authSystem.currentUser) {
        const quizProgress = window.authSystem.currentUser.quizScore || 0;
        window.authSystem.currentUser.quizScore = quizScore;
        
        // Save to localStorage
        const users = JSON.parse(localStorage.getItem('emlab_users') || '[]');
        const userIndex = users.findIndex(u => u.username === window.authSystem.currentUser.username);
        if (userIndex >= 0) {
            users[userIndex].quizScore = quizScore;
            localStorage.setItem('emlab_users', JSON.stringify(users));
            localStorage.setItem('emlab_user', JSON.stringify(window.authSystem.currentUser));
        }
    }
}

// Topic accordion toggle
document.addEventListener('DOMContentLoaded', function() {
    const topicHeaders = document.querySelectorAll('.topic-header');
    
    topicHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const item = this.parentElement;
            item.classList.toggle('active');
        });
    });
});
