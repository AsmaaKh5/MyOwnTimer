// app.js — Time Blocker (Final Version)

// ============ Quotes ============

const quotes = [
    "✨ التركيز مش في الساعات، في اللي بتعمله فيها",
    "📚 كل دقيقة بتذاكر فيها هي استثمار في نفسك",
    "🌱 النجاح مش بييجي فجأة، هو نتيجة لحظات صغيرة متراكمة",
    "💪 ابدأ وأنت مش مستعد، الاستعداد هييجي وأنت بتشتغل",
    "🎯 الانضباط هو الجسر بين الأهداف والإنجاز",
    "🔥 الاستمرارية أعلى مهارة ممكن تتعلمها في حياتك",
    "💡 مش مهم تكمل كل مرة، المهم ترجع كل مرة",
    "⚡ التركيز على الـ process والنتيجة هتجيلك لوحدها",
    "🧠 عقلك بيحب الوضوح — حدد وابدأ",
    "🎯 لو الوقت خلص ومكملتش، يبقى المرة الجاية تركّز أكتر"
];

let currentQuoteIndex = 0;
let quoteInterval = null;

function showNextQuote() {
    const el = document.getElementById('quoteText');
    el.style.opacity = '0';
    setTimeout(() => {
        currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
        el.textContent = quotes[currentQuoteIndex];
        el.style.opacity = '1';
    }, 400);
}

function startQuoteRotation() {
    const el = document.getElementById('quoteText');
    if (el) el.textContent = quotes[currentQuoteIndex];
    quoteInterval = setInterval(showNextQuote, 120000);
}

// ============ البيانات ============

let tasks = [];
let mainInterval = null;
let dayStarted = false;
let isEditMode = false;
let selectedColor = '#3498db';

// ============ Helpers ============

function formatTimeStr(h, m) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function formatTimeFromDate(date) {
    return formatTimeStr(date.getHours(), date.getMinutes());
}

function todayAt(h, m) {
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.getTime();
}

function parseTimeInput(val) {
    if (!val) return null;
    const parts = val.split(':');
    return { h: parseInt(parts[0]), m: parseInt(parts[1]) };
}

function getTaskStart(task) {
    return todayAt(task.startH, task.startM);
}

function getTaskEnd(task) {
    return todayAt(task.endH, task.endM);
}

function getTaskDurationMins(task) {
    return Math.round((getTaskEnd(task) - getTaskStart(task)) / 60000);
}

function formatCountdown(ms) {
    if (ms <= 0) return '00:00';
    const totalSec = Math.ceil(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSec % 60).toString().padStart(2, '0');
    if (h > 0) return `${h}:${mins}:${secs}`;
    return `${mins}:${secs}`;
}

function formatMinutes(mins) {
    if (mins < 60) return `${mins} دقيقة`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h} ساعة و ${m} دقيقة` : `${h} ساعة`;
}

function removeConflictWarning() {
    const w = document.getElementById('conflictWarning');
    if (w) w.remove();
}

// ============ Init ============

document.addEventListener('DOMContentLoaded', () => {
    // الألوان
    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
            dot.classList.add('selected');
            selectedColor = dot.dataset.color;
        });
    });

    // التاريخ
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('todayDate').textContent = today.toLocaleDateString('ar-EG', options);

    startQuoteRotation();
    restoreState();

    // Enter key
    document.getElementById('taskNameInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') addTask();
    });
});

// Tab visibility
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && dayStarted && !isEditMode) {
        updateRunScreen();
    }
});

// ============ إضافة تاسك ============

function addTask() {
    const nameInput = document.getElementById('taskNameInput');
    const startInput = document.getElementById('taskStartTime');
    const endInput = document.getElementById('taskEndTime');

    const name = nameInput.value.trim();
    const startParsed = parseTimeInput(startInput.value);
    const endParsed = parseTimeInput(endInput.value);

    let hasError = false;

    if (!name) {
        nameInput.classList.add('input-error');
        setTimeout(() => nameInput.classList.remove('input-error'), 1500);
        hasError = true;
    }

    if (!startParsed) {
        startInput.classList.add('input-error');
        setTimeout(() => startInput.classList.remove('input-error'), 1500);
        hasError = true;
    }

    if (!endParsed) {
        endInput.classList.add('input-error');
        setTimeout(() => endInput.classList.remove('input-error'), 1500);
        hasError = true;
    }

    if (hasError) return;

    const startMs = todayAt(startParsed.h, startParsed.m);
    const endMs = todayAt(endParsed.h, endParsed.m);

    // وقت النهاية لازم بعد البداية
    if (endMs <= startMs) {
        startInput.classList.add('input-error');
        endInput.classList.add('input-error');
        setTimeout(() => {
            startInput.classList.remove('input-error');
            endInput.classList.remove('input-error');
        }, 1500);
        return;
    }

    // في وضع التعديل — منع تاسك وقتها فات
    if (isEditMode && startMs < Date.now()) {
        removeConflictWarning();
        const warning = document.createElement('div');
        warning.className = 'conflict-warning';
        warning.id = 'conflictWarning';
        warning.textContent = '⚠️ مينفعش تضيف تاسك وقتها فات!';
        document.querySelector('.add-task-box').appendChild(warning);
        setTimeout(() => removeConflictWarning(), 3000);
        return;
    }

    // تعارض
    const hasConflict = tasks.some(t => {
        const tStart = getTaskStart(t);
        const tEnd = getTaskEnd(t);
        return (startMs < tEnd && endMs > tStart);
    });

    if (hasConflict) {
        removeConflictWarning();
        const warning = document.createElement('div');
        warning.className = 'conflict-warning';
        warning.id = 'conflictWarning';
        warning.textContent = '⚠️ فيه تعارض مع تاسك تانية في نفس الوقت!';
        document.querySelector('.add-task-box').appendChild(warning);
        setTimeout(() => removeConflictWarning(), 3000);
        return;
    }

    tasks.push({
        id: Date.now(),
        name,
        startH: startParsed.h,
        startM: startParsed.m,
        endH: endParsed.h,
        endM: endParsed.m,
        color: selectedColor,
        status: 'pending'
    });

    tasks.sort((a, b) => getTaskStart(a) - getTaskStart(b));

    nameInput.value = '';
    startInput.value = '';
    endInput.value = '';
    nameInput.focus();

    renderTasks();
    updateSummary();
    saveState();
}

// ============ حذف تاسك ============

function removeTask(id) {
    const task = tasks.find(t => t.id === id);

    if (task && isEditMode && task.status !== 'pending') {
        return;
    }

    tasks = tasks.filter(t => t.id !== id);
    renderTasks();
    updateSummary();
    saveState();
}

// ============ عرض التاسكات ============

function renderTasks() {
    const list = document.getElementById('tasksList');
    const empty = document.getElementById('emptyState');

    if (tasks.length === 0) {
        list.innerHTML = '';
        list.appendChild(empty);
        empty.style.display = 'block';
        document.getElementById('planSummary').style.display = 'none';
        return;
    }

    empty.style.display = 'none';
    list.innerHTML = '';

    tasks.forEach(task => {
        const durationMins = getTaskDurationMins(task);
        const startStr = formatTimeStr(task.startH, task.startM);
        const endStr = formatTimeStr(task.endH, task.endM);

        const isLocked = isEditMode && task.status !== 'pending';

        const item = document.createElement('div');
        item.className = `task-item ${isLocked ? 'locked' : ''}`;
        item.style.borderRightColor = task.color;

        let statusBadge = '';
        if (isEditMode && task.status !== 'pending') {
            switch (task.status) {
                case 'completed':
                    statusBadge = '<span class="task-status-badge badge-completed">✅ خلصت</span>';
                    break;
                case 'ended':
                    statusBadge = '<span class="task-status-badge badge-ended">⏰ خلص وقتها</span>';
                    break;
                case 'active':
                    statusBadge = '<span class="task-status-badge badge-active">🔵 شغالة دلوقتي</span>';
                    break;
                case 'missed':
                    statusBadge = '<span class="task-status-badge badge-missed">❌ فاتت</span>';
                    break;
            }
        }

        item.innerHTML = `
            <div class="task-info">
                <div class="task-name">${task.name}</div>
                <div class="task-time-info">🕐 ${startStr} → ${endStr}</div>
                <span class="task-duration-badge">${durationMins} دقيقة</span>
                ${statusBadge}
            </div>
            ${!isLocked ? `
                <button class="task-action-btn" onclick="removeTask(${task.id})" title="حذف">✕</button>
            ` : ''}
        `;
        list.appendChild(item);
    });
}

// ============ الملخص ============

function updateSummary() {
    if (tasks.length === 0) {
        document.getElementById('planSummary').style.display = 'none';
        return;
    }

    document.getElementById('planSummary').style.display = 'block';

    const totalMins = tasks.reduce((sum, t) => sum + getTaskDurationMins(t), 0);
    const pendingMins = tasks
        .filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + getTaskDurationMins(t), 0);

    const lastTask = tasks[tasks.length - 1];
    const lastEnd = formatTimeStr(lastTask.endH, lastTask.endM);

    document.getElementById('totalTasks').textContent = tasks.length;

    if (isEditMode) {
        document.getElementById('totalTime').textContent =
            `${formatMinutes(totalMins)} (${formatMinutes(pendingMins)} فاضلين)`;
    } else {
        document.getElementById('totalTime').textContent = formatMinutes(totalMins);
    }

    document.getElementById('expectedEnd').textContent = lastEnd;
}

// ============ بدء اليوم ============

function startDay() {
    if (tasks.length === 0) return;

    dayStarted = true;
    isEditMode = false;

    document.getElementById('planScreen').style.display = 'none';
    document.getElementById('runScreen').style.display = 'block';

    if (mainInterval) clearInterval(mainInterval);
    mainInterval = setInterval(updateRunScreen, 1000);
    updateRunScreen();

    saveState();
}

// ============ تعديل الخطة ============

function editPlan() {
    isEditMode = true;

    if (mainInterval) {
        clearInterval(mainInterval);
        mainInterval = null;
    }

    document.getElementById('runScreen').style.display = 'none';
    document.getElementById('planScreen').style.display = 'block';

    document.getElementById('planTitle').textContent = '✏️ تعديل الخطة';
    document.getElementById('backToRunBtn').style.display = 'block';
    document.getElementById('editNotice').style.display = 'block';

    const btn = document.getElementById('startDayBtn');
    btn.textContent = '💾 حفظ والرجوع';
    btn.onclick = backToRun;

    renderTasks();
    updateSummary();
    saveState();
}

function backToRun() {
    isEditMode = false;

    document.getElementById('planScreen').style.display = 'none';
    document.getElementById('runScreen').style.display = 'block';

    document.getElementById('planTitle').textContent = '📋 خطط يومك';
    document.getElementById('backToRunBtn').style.display = 'none';
    document.getElementById('editNotice').style.display = 'none';

    const btn = document.getElementById('startDayBtn');
    btn.textContent = '🚀 ابدأ يومك!';
    btn.onclick = startDay;

    dayStarted = true;
    if (mainInterval) clearInterval(mainInterval);
    mainInterval = setInterval(updateRunScreen, 1000);
    updateRunScreen();

    saveState();
}

// ============ التحديث الرئيسي ============

function updateRunScreen() {
    const now = Date.now();

    // تحديث حالات التاسكات
    tasks.forEach(task => {
        const start = getTaskStart(task);
        const end = getTaskEnd(task);

        if (task.status === 'completed') return;

        if (now >= end) {
            if (task.status !== 'ended') {
                task.status = 'ended';
                playBeep();
            }
        } else if (now >= start && now < end) {
            if (task.status === 'pending') {
                task.status = 'active';
                playBeep();
            }
        }
    });

    // هل كل التاسكات خلصت وقتها؟
    const allEnded = tasks.every(t =>
        t.status === 'completed' || t.status === 'ended'
    );

    if (allEnded) {
        clearInterval(mainInterval);
        mainInterval = null;
        showReview();
        return;
    }

    const activeTask = tasks.find(t => t.status === 'active');
    const nextTask = tasks.find(t => t.status === 'pending' && getTaskStart(t) > now);

    const waitingCard = document.getElementById('waitingCard');
    const taskCard = document.getElementById('currentTaskCard');

    if (activeTask) {
        // في تاسك شغالة
        waitingCard.style.display = 'none';
        taskCard.style.display = 'block';

        const start = getTaskStart(activeTask);
        const end = getTaskEnd(activeTask);
        const remaining = end - now;
        const duration = end - start;
        const progress = ((duration - remaining) / duration) * 100;
        const idx = tasks.indexOf(activeTask);

        document.getElementById('currentTaskBadge').textContent =
            `${idx + 1}/${tasks.length}`;
        document.getElementById('currentTaskName').textContent = activeTask.name;
        document.getElementById('taskTimeRange').textContent =
            `${formatTimeStr(activeTask.startH, activeTask.startM)} → ${formatTimeStr(activeTask.endH, activeTask.endM)}`;
        taskCard.style.borderTop = `4px solid ${activeTask.color}`;

        const countdownEl = document.getElementById('countdown');
        const progressBar = document.getElementById('progressBar');
        countdownEl.textContent = formatCountdown(remaining);

        const isUrgent = remaining < 2 * 60 * 1000;
        countdownEl.classList.toggle('urgent', isUrgent);
        progressBar.classList.toggle('urgent', isUrgent);
        progressBar.style.background = isUrgent ? '#e74c3c' : activeTask.color;
        progressBar.style.width = `${Math.min(progress, 100)}%`;

    } else if (nextTask) {
        // في انتظار التاسك الجاية
        taskCard.style.display = 'none';
        waitingCard.style.display = 'block';

        const nextStart = getTaskStart(nextTask);
        const waitRemaining = nextStart - now;

        document.getElementById('nextTaskName').textContent = nextTask.name;
        document.getElementById('waitCountdown').textContent = formatCountdown(waitRemaining);
        document.getElementById('nextStartTime').textContent =
            formatTimeStr(nextTask.startH, nextTask.startM);

    } else {
        // فيه تاسكات ended بس لسه فيه pending
        const nextPending = tasks.find(t => t.status === 'pending');
        if (nextPending) {
            taskCard.style.display = 'none';
            waitingCard.style.display = 'block';

            const nextStart = getTaskStart(nextPending);
            const waitRemaining = nextStart - now;
            document.getElementById('nextTaskName').textContent = nextPending.name;
            document.getElementById('waitCountdown').textContent = formatCountdown(waitRemaining);
            document.getElementById('nextStartTime').textContent =
                formatTimeStr(nextPending.startH, nextPending.startM);
        } else {
            // مفيش حاجة تانية
            clearInterval(mainInterval);
            mainInterval = null;
            showReview();
            return;
        }
    }

    renderSchedule();
    saveState();
}

// ============ خلصت بدري ============

function markDoneEarly() {
    const activeTask = tasks.find(t => t.status === 'active');
    if (!activeTask) return;

    activeTask.status = 'completed';
    updateRunScreen();
}

// ============ عرض الجدول ============

function renderSchedule() {
    const list = document.getElementById('scheduleList');
    list.innerHTML = '';

    tasks.forEach((task, i) => {
        const startStr = formatTimeStr(task.startH, task.startM);
        const endStr = formatTimeStr(task.endH, task.endM);

        let statusClass = 'sch-waiting';
        let statusEmoji = '⏳';

        switch (task.status) {
            case 'active':
                statusClass = 'sch-active';
                statusEmoji = '🔵';
                break;
            case 'completed':
                statusClass = 'sch-completed';
                statusEmoji = '✅';
                break;
            case 'ended':
                statusClass = 'sch-ended';
                statusEmoji = '⏰';
                break;
            case 'missed':
                statusClass = 'sch-missed';
                statusEmoji = '❌';
                break;
            default:
                statusClass = 'sch-waiting';
                statusEmoji = '⏳';
        }

        const item = document.createElement('div');
        item.className = `schedule-item ${statusClass}`;
        item.style.borderRightColor = task.color;
        item.innerHTML = `
            <span class="sch-status">${statusEmoji}</span>
            <span class="sch-name">${task.name}</span>
            <span class="sch-time">${startStr} → ${endStr}</span>
        `;
        list.appendChild(item);

        // بريك
        if (i < tasks.length - 1) {
            const thisEnd = getTaskEnd(task);
            const nextStart = getTaskStart(tasks[i + 1]);
            const breakMins = Math.round((nextStart - thisEnd) / 60000);

            if (breakMins > 0) {
                const breakItem = document.createElement('div');
                breakItem.className = 'break-indicator';
                breakItem.textContent = `☕ بريك ${formatMinutes(breakMins)}`;
                list.appendChild(breakItem);
            }
        }
    });
}

// ============ شاشة المراجعة ============

function showReview() {
    dayStarted = false;

    document.getElementById('runScreen').style.display = 'none';
    document.getElementById('resultsScreen').style.display = 'block';
    document.getElementById('reviewPhase').style.display = 'block';
    document.getElementById('resultsPhase').style.display = 'none';

    renderReviewList();
    playBeep();
    saveState();
}

function renderReviewList() {
    const list = document.getElementById('reviewList');
    list.innerHTML = '';

    tasks.forEach((task, index) => {
        const startStr = formatTimeStr(task.startH, task.startM);
        const endStr = formatTimeStr(task.endH, task.endM);
        const isAutoCompleted = task.status === 'completed';

        const item = document.createElement('div');
        item.className = `review-item ${isAutoCompleted ? 'review-done' : ''}`;
        item.id = `review-${index}`;
        item.style.borderRightColor = task.color;

        item.innerHTML = `
            <div class="review-info">
                <div class="review-name">${task.name}</div>
                <div class="review-time">🕐 ${startStr} → ${endStr}</div>
            </div>
            <div class="review-toggle">
                <button class="toggle-btn ${isAutoCompleted ? 'active-yes' : ''}"
                        id="yes-${index}"
                        onclick="setReview(${index}, true)">✅</button>
                <button class="toggle-btn"
                        id="no-${index}"
                        onclick="setReview(${index}, false)">❌</button>
            </div>
        `;

        list.appendChild(item);

        if (isAutoCompleted) {
            task._review = true;
        }
    });

    updateConfirmButton();
}

function setReview(index, done) {
    tasks[index]._review = done;

    const item = document.getElementById(`review-${index}`);
    const yesBtn = document.getElementById(`yes-${index}`);
    const noBtn = document.getElementById(`no-${index}`);

    yesBtn.className = `toggle-btn ${done ? 'active-yes' : ''}`;
    noBtn.className = `toggle-btn ${done ? '' : 'active-no'}`;

    item.classList.remove('review-done', 'review-not-done');
    item.classList.add(done ? 'review-done' : 'review-not-done');

    updateConfirmButton();
}

function updateConfirmButton() {
    const allReviewed = tasks.every(t => t._review === true || t._review === false);
    const btn = document.getElementById('confirmReviewBtn');
    btn.disabled = !allReviewed;

    if (!allReviewed) {
        const remaining = tasks.filter(t => t._review === undefined).length;
        btn.textContent = `📋 حدد كل التاسكات الأول (${remaining} فاضلين)`;
    } else {
        btn.textContent = '✅ تأكيد وعرض النتائج';
    }
}

function confirmReview() {
    const allReviewed = tasks.every(t => t._review === true || t._review === false);
    if (!allReviewed) return;

    tasks.forEach(task => {
        if (task._review === true) {
            task.status = 'completed';
        } else {
            task.status = 'missed';
        }
        delete task._review;
    });

    document.getElementById('reviewPhase').style.display = 'none';
    document.getElementById('resultsPhase').style.display = 'block';

    showFinalResults();
}

// ============ النتائج النهائية ============

function showFinalResults() {
    const completed = tasks.filter(t => t.status === 'completed').length;
    const missed = tasks.filter(t => t.status === 'missed').length;

    document.getElementById('completedCount').textContent = completed;
    document.getElementById('missedCount').textContent = missed;

    const ratio = tasks.length > 0 ? completed / tasks.length : 0;
    let msg = '';
    if (ratio === 1) msg = '🔥 يوم مثالي! خلصت كل حاجة';
    else if (ratio >= 0.7) msg = '💪 يوم كويس جداً! كمّل كده';
    else if (ratio >= 0.4) msg = '👍 مش وحش، بس تقدر أحسن!';
    else msg = '😤 بكرة يوم جديد — ركّز أكتر!';

    document.getElementById('resultsSubtitle').textContent = msg;

    const timeline = document.getElementById('resultsTimeline');
    timeline.innerHTML = '';

    tasks.forEach(task => {
        const isCompleted = task.status === 'completed';
        const item = document.createElement('div');
        item.className = `timeline-item ${isCompleted ? 'tl-completed' : 'tl-missed'}`;
        item.style.borderRightColor = task.color;
        item.innerHTML = `
            <span class="tl-status">${isCompleted ? '✅' : '❌'}</span>
            <span class="tl-name">${task.name}</span>
            <span class="tl-time">${formatTimeStr(task.startH, task.startM)} → ${formatTimeStr(task.endH, task.endM)}</span>
        `;
        timeline.appendChild(item);
    });

    saveStats(completed, missed);
    showNextQuote();
    saveState();
}

// ============ يوم جديد ============

function newDay() {
    tasks = [];
    dayStarted = false;
    isEditMode = false;

    if (mainInterval) clearInterval(mainInterval);
    mainInterval = null;

    document.getElementById('resultsScreen').style.display = 'none';
    document.getElementById('reviewPhase').style.display = 'block';
    document.getElementById('resultsPhase').style.display = 'none';
    document.getElementById('runScreen').style.display = 'none';
    document.getElementById('planScreen').style.display = 'block';

    // نرجع عناوين شاشة التخطيط لأصلها
    document.getElementById('planTitle').textContent = '📋 خطط يومك';
    document.getElementById('backToRunBtn').style.display = 'none';
    document.getElementById('editNotice').style.display = 'none';

    const btn = document.getElementById('startDayBtn');
    btn.textContent = '🚀 ابدأ يومك!';
    btn.onclick = startDay;

    renderTasks();
    updateSummary();
    localStorage.removeItem('timeBlockerState');

    document.getElementById('taskNameInput').focus();
}

// ============ الصوت ============

let audioCtx = null;

function playBeep() {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 1);
    } catch (e) {
        console.log('Audio not supported');
    }
}

// ============ حفظ واستعادة ============

function saveState() {
    const state = {
        tasks: tasks.map(t => ({
            id: t.id,
            name: t.name,
            startH: t.startH,
            startM: t.startM,
            endH: t.endH,
            endM: t.endM,
            color: t.color,
            status: t.status
        })),
        dayStarted,
        isEditMode,
        savedAt: Date.now()
    };
    localStorage.setItem('timeBlockerState', JSON.stringify(state));
}

function restoreState() {
    const saved = localStorage.getItem('timeBlockerState');
    if (!saved) return;

    try {
        const state = JSON.parse(saved);

        // لو من يوم تاني — نتجاهل
        if (new Date(state.savedAt).toDateString() !== new Date().toDateString()) {
            localStorage.removeItem('timeBlockerState');
            return;
        }

        tasks = state.tasks || [];
        dayStarted = state.dayStarted || false;
        isEditMode = state.isEditMode || false;

        // هل كل التاسكات خلصت وقتها؟
        const allEnded = tasks.length > 0 && tasks.every(t =>
            t.status === 'completed' || t.status === 'ended' || t.status === 'missed'
        );

        if (allEnded) {
            // نروح لشاشة المراجعة
            document.getElementById('planScreen').style.display = 'none';
            showReview();

        } else if (isEditMode) {
            // كان في وضع التعديل
            document.getElementById('planScreen').style.display = 'block';
            document.getElementById('planTitle').textContent = '✏️ تعديل الخطة';
            document.getElementById('backToRunBtn').style.display = 'block';
            document.getElementById('editNotice').style.display = 'block';

            const btn = document.getElementById('startDayBtn');
            btn.textContent = '💾 حفظ والرجوع';
            btn.onclick = backToRun;

            renderTasks();
            updateSummary();

        } else if (dayStarted && tasks.length > 0) {
            // كان في وسط التنفيذ
            document.getElementById('planScreen').style.display = 'none';
            document.getElementById('runScreen').style.display = 'block';

            if (mainInterval) clearInterval(mainInterval);
            mainInterval = setInterval(updateRunScreen, 1000);
            updateRunScreen();

        } else {
            // لسه في التخطيط
            renderTasks();
            updateSummary();
        }

    } catch (e) {
        console.log('Restore error:', e);
        localStorage.removeItem('timeBlockerState');
    }
}

// ============ إحصائيات ============

function saveStats(completed, missed) {
    const stats = JSON.parse(localStorage.getItem('timeBlockerStats') || '{}');
    if (!stats.history) stats.history = [];

    stats.history.push({
        date: new Date().toDateString(),
        total: tasks.length,
        completed,
        missed,
        tasks: tasks.map(t => ({
            name: t.name,
            startH: t.startH,
            startM: t.startM,
            endH: t.endH,
            endM: t.endM,
            status: t.status,
            color: t.color
        }))
    });

    // نحتفظ بآخر 30 يوم
    if (stats.history.length > 30) {
        stats.history = stats.history.slice(-30);
    }

    localStorage.setItem('timeBlockerStats', JSON.stringify(stats));
}