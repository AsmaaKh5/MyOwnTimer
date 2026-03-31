// app.js

const quotes = [
    "✨ التركيز مش في الساعات، في اللي بتعمله فيها",
    "📚 كل دقيقة بتذاكر فيها هي استثمار في نفسك",
    "🌱 النجاح مش بيجي فجأة، هو نتيجة لحظات صغيرة متراكمة",
    "💪 ابدأ وإنت مش مستعد، الاستعداد هييجي وأنت بتشتغل",
    "🎯 الانضباط هو الجسر بين الأهداف والإنجاز",
    "🔥 الاستمرارية أعلى مهارة ممكن تتعلمها في حياتك",
    "💡 مش مهم تكمل كل مرة، المهم ترجع كل مرة",
    "⚡ التركيز على الـ process والنتيجة هتجيلك لوحدها"
];

let currentQuoteIndex = 0;
let quoteInterval = null;

function showNextQuote() {
    const quoteEl = document.getElementById('quoteText');
    quoteEl.style.opacity = '0';

    setTimeout(() => {
        currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
        quoteEl.textContent = quotes[currentQuoteIndex];
        quoteEl.style.opacity = '1';
    }, 500);
}

function startQuoteRotation() {
    if (quoteInterval) clearInterval(quoteInterval);

    // أول quote فوراً
    const quoteEl = document.getElementById('quoteText');
    quoteEl.textContent = quotes[currentQuoteIndex];

    // تغيير كل دقيقتين
    quoteInterval = setInterval(showNextQuote, 120000);
}

// ـــ الإحصائيات ـــ
function loadStats() {
    const today = new Date().toDateString();
    const stats = JSON.parse(localStorage.getItem('studyStats') || '{}');

    if (stats.date !== today) {
        stats.date = today;
        stats.sessionsToday = 0;
        stats.minutesToday = 0;
    }

    stats.totalSessions = stats.totalSessions || 0;

    document.getElementById('sessionsToday').textContent = stats.sessionsToday || 0;
    document.getElementById('minutesToday').textContent = stats.minutesToday || 0;
    document.getElementById('totalSessions').textContent = stats.totalSessions || 0;
}

function saveSession(minutes) {
    const today = new Date().toDateString();
    const stats = JSON.parse(localStorage.getItem('studyStats') || '{}');

    if (stats.date !== today) {
        stats.date = today;
        stats.sessionsToday = 0;
        stats.minutesToday = 0;
    }

    stats.sessionsToday = (stats.sessionsToday || 0) + 1;
    stats.minutesToday = (stats.minutesToday || 0) + minutes;
    stats.totalSessions = (stats.totalSessions || 0) + 1;

    localStorage.setItem('studyStats', JSON.stringify(stats));
    loadStats();
}

// ـــ التايمر ـــ
let endTime = null;
let startTime = null;
let totalDuration = null;
let timerInterval = null;

function formatTime(date) {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
}

function startTimer() {
    const minutes = parseInt(document.getElementById('minutesInput').value);

    if (!minutes || minutes < 1 || minutes > 180) {
        alert('من فضلك أدخل عدد دقائق صحيح (1 - 180)');
        return;
    }

    startTime = Date.now();
    endTime = startTime + minutes * 60 * 1000;
    totalDuration = minutes * 60 * 1000;

    document.getElementById('endTimeDisplay').textContent = formatTime(new Date(endTime));
    document.getElementById('startLabel').textContent = formatTime(new Date(startTime));
    document.getElementById('endLabel').textContent = formatTime(new Date(endTime));

    document.getElementById('setupScreen').style.display = 'none';
    document.getElementById('timerScreen').style.display = 'block';
    document.getElementById('doneScreen').style.display = 'none';

    timerInterval = setInterval(tick, 1000);
    tick();
}

function tick() {
    const remaining = endTime - Date.now();

    if (remaining <= 0) {
        clearInterval(timerInterval);
        document.getElementById('countdown').textContent = '00:00';
        document.getElementById('progressBar').style.width = '100%';
        saveSession(Math.round(totalDuration / 60000));
        showDoneScreen();
        return;
    }

    const totalSeconds = Math.ceil(remaining / 1000);
    const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');

    const countdownEl = document.getElementById('countdown');
    const progressBar = document.getElementById('progressBar');

    countdownEl.textContent = `${mins}:${secs}`;

    const isUrgent = remaining < 5 * 60 * 1000;
    countdownEl.classList.toggle('urgent', isUrgent);
    progressBar.classList.toggle('urgent', isUrgent);

    const progress = ((totalDuration - remaining) / totalDuration) * 100;
    progressBar.style.width = `${progress}%`;
}

function showDoneScreen() {
    document.getElementById('timerScreen').style.display = 'none';
    document.getElementById('doneScreen').style.display = 'block';
    document.getElementById('doneTime').textContent = formatTime(new Date(endTime));
    playBeep();
    showNextQuote();
}

function playBeep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 1.5);
    } catch(e) {
        console.log('Audio not supported');
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    endTime = null;
    startTime = null;
    totalDuration = null;

    document.getElementById('minutesInput').value = '';
    document.getElementById('countdown').textContent = '00:00';
    document.getElementById('countdown').classList.remove('urgent');
    document.getElementById('progressBar').style.width = '0%';
    document.getElementById('progressBar').classList.remove('urgent');

    document.getElementById('timerScreen').style.display = 'none';
    document.getElementById('doneScreen').style.display = 'none';
    document.getElementById('setupScreen').style.display = 'block';

    document.getElementById('minutesInput').focus();
}

// ـــ تشغيل عند التحميل ـــ
window.addEventListener('load', () => {
    loadStats();
    startQuoteRotation();
    document.getElementById('minutesInput').focus();
});

document.getElementById('minutesInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') startTimer();
});