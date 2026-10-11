// === STAN APLIKACJI I DANE POCZĄTKOWE ===
const defaultUsers = [
    { username: 'admin', pass: '123', name: 'Administrator Systemu', role: 'ADMIN', className: 'Brak' },
    { username: 'nauczyciel1', pass: '123', name: 'mgr Jan Kowalski', role: 'NAUCZYCIEL', className: '1A' },
    { username: 'uczen1', pass: '123', name: 'Piotr Nowak', role: 'UCZEN', className: '1A' },
    { username: 'uczen2', pass: '123', name: 'Anna Wiśniewska', role: 'UCZEN', className: '1A' }
];

// Pełny szkolny plan lekcji od 8:00 do 18:00 (11 godzin lekcyjnych)
const defaultSchedule = [
    { hour: 1, time: "8:00 - 8:45", days: ["Matematyka", "J. Polski", "Fizyka", "Informatyka", "WF"] },
    { hour: 2, time: "8:55 - 9:40", days: ["J. Angielski", "Matematyka", "Chemia", "J. Polski", "Informatyka"] },
    { hour: 3, time: "9:50 - 10:35", days: ["Historia", "Informatyka", "Matematyka", "Geografia", "J. Angielski"] },
    { hour: 4, time: "10:55 - 11:40", days: ["Biologia", "Historia", "J. Angielski", "Matematyka", "Religia"] },
    { hour: 5, time: "11:50 - 12:35", days: ["Geografia", "Biologia", "WF", "Historia", "J. Polski"] },
    { hour: 6, time: "12:45 - 13:30", days: ["WF", "Geografia", "J. Polski", "Biologia", "Chemia"] },
    { hour: 7, time: "13:45 - 14:30", days: ["Plastyka", "Godzina wychowawcza", "Religia", "Muzyka", "Fizyka"] },
    { hour: 8, time: "14:40 - 15:25", days: ["-", "-", "Godzina wychowawcza", "-", "-"] },
    { hour: 9, time: "15:35 - 16:20", days: ["-", "-", "-", "-", "-"] },
    { hour: 10, time: "16:30 - 17:15", days: ["-", "-", "-", "-", "-"] },
    { hour: 11, time: "17:25 - 18:10", days: ["-", "-", "-", "-", "-"] }
];

const defaultSubjects = ['Matematyka', 'Język Polski', 'Informatyka', 'Fizyka', 'Język Angielski', 'Chemia', 'Historia', 'Geografia', 'Biologia', 'WF', 'Religia', 'Plastyka', 'Muzyka', 'Godzina wychowawcza'];

let users = JSON.parse(localStorage.getItem('ed_users')) || defaultUsers;
let subjects = JSON.parse(localStorage.getItem('ed_subjects')) || defaultSubjects;
let grades = JSON.parse(localStorage.getItem('ed_grades')) || [
    { id: 1, student: 'uczen1', subject: 'Matematyka', val: '5', desc: 'Sprawdzian z równań' },
    { id: 2, student: 'uczen1', subject: 'Język Polski', val: '4', desc: 'Wypracowanie' }
];
let notices = JSON.parse(localStorage.getItem('ed_notices')) || [
    { student: 'uczen1', type: 'positive', text: 'Aktywność i wzorowa postawa na lekcji', author: 'mgr Jan Kowalski' }
];
let schedule = JSON.parse(localStorage.getItem('ed_schedule')) || defaultSchedule;
let substitutions = JSON.parse(localStorage.getItem('ed_substitutions')) || []; // [{id, dayIndex, hourIndex, info}]

let currentUser = null;
let isEditingSchedule = false;

function saveData() {
    localStorage.setItem('ed_users', JSON.stringify(users));
    localStorage.setItem('ed_subjects', JSON.stringify(subjects));
    localStorage.setItem('ed_grades', JSON.stringify(grades));
    localStorage.setItem('ed_notices', JSON.stringify(notices));
    localStorage.setItem('ed_schedule', JSON.stringify(schedule));
    localStorage.setItem('ed_substitutions', JSON.stringify(substitutions));
}

// === LOGOWANIE ===
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const loginInput = document.getElementById('login-input').value.trim();
    const passInput = document.getElementById('password-input').value.trim();

    const foundUser = users.find(u => u.username === loginInput && u.pass === passInput);

    if (foundUser) {
        currentUser = foundUser;
        document.getElementById('login-view').style.display = 'none';
        document.getElementById('header').style.display = 'flex';
        document.getElementById('app-view').style.display = 'block';

        const roleIcons = { 'ADMIN': '👑', 'NAUCZYCIEL': '📚', 'UCZEN': '🎓' };
        document.getElementById('user-display-name').innerText = `${roleIcons[currentUser.role] || ''} ${currentUser.name} (${currentUser.role})`;
        document.getElementById('current-class-badge').innerText = `Klasa: ${currentUser.className || 'Brak'}`;

        setupRoleInterface();
        renderAll();
    } else {
        alert('Niepoprawny login lub hasło!');
    }
});

document.getElementById('btn-logout').addEventListener('click', function() {
    currentUser = null;
    isEditingSchedule = false;
    document.getElementById('login-view').style.display = 'block';
    document.getElementById('header').style.display = 'none';
    document.getElementById('app-view').style.display = 'none';
    document.getElementById('login-form').reset();
});

// === STEROWANIE ROLAMI ===
function setupRoleInterface() {
    const isAdmin = currentUser.role === 'ADMIN';
    const isTeacher = currentUser.role === 'NAUCZYCIEL' || isAdmin;

    document.getElementById('nav-admin-btn').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('teacher-grade-panel').style.display = isTeacher ? 'block' : 'none';
    document.getElementById('teacher-notice-panel').style.display = isTeacher ? 'block' : 'none';
    
    document.getElementById('btn-edit-schedule').style.display = isAdmin ? 'inline-flex' : 'none';
    document.getElementById('substitutions-panel').style.display = isTeacher ? 'block' : 'none';
    isEditingSchedule = false;
}

// === ZAKŁADKI ===
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        this.classList.add('active');
        document.getElementById(this.getAttribute('data-target')).classList.add('active');
    });
});

function renderAll() {
    renderGrades();
    renderSchedule();
    renderNotices();
    populateSelects();
    if (currentUser.role === 'ADMIN') {
        renderAdminPanel();
    }
}

function populateSelects() {
    const students = users.filter(u => u.role === 'UCZEN');
    const gradeSelect = document.getElementById('grade-student-select');
    const noticeSelect = document.getElementById('notice-student-select');
    const subjectSelect = document.getElementById('grade-subject-select');
    const subHourSelect = document.getElementById('sub-hour-select');

    const fillStudents = (elem) => {
        if (!elem) return;
        elem.innerHTML = '<option value="">Wybierz ucznia...</option>';
        students.forEach(s => {
            elem.innerHTML += `<option value="${s.username}">${s.name} (kl. ${s.className})</option>`;
        });
    };

    fillStudents(gradeSelect);
    fillStudents(noticeSelect);

    if (subjectSelect) {
        subjectSelect.innerHTML = '<option value="">Wybierz przedmiot...</option>';
        subjects.forEach(subj => {
            subjectSelect.innerHTML += `<option value="${subj}">${subj}</option>`;
        });
    }

    if (subHourSelect) {
        subHourSelect.innerHTML = '<option value="">Wybierz godzinę...</option>';
        schedule.forEach((row, idx) => {
            subHourSelect.innerHTML += `<option value="${idx}">${row.hour}. lekcja (${row.time})</option>`;
        });
    }
}

// === 1. OCENY ===
function renderGrades() {
    const container = document.getElementById('grades-container');
    container.innerHTML = '';

    let studentsToDisplay = currentUser.role === 'UCZEN'
        ? users.filter(u => u.username === currentUser.username)
        : users.filter(u => u.role === 'UCZEN');

    if (studentsToDisplay.length === 0) {
        container.innerHTML = '<p>Brak uczniów w bazie.</p>';
        return;
    }

    studentsToDisplay.forEach(student => {
        const studentGrades = grades.filter(g => g.student === student.username);

        let html = `
            <div style="margin-bottom: 25px;">
                <h4 style="margin-bottom: 10px; color: var(--primary);">👤 ${student.name} <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: normal;">(Klasa: ${student.className})</span></h4>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr><th style="width: 220px;">Przedmiot</th><th>Oceny</th></tr>
                        </thead>
                        <tbody>
        `;

        subjects.forEach(subj => {
            const subjGrades = studentGrades.filter(g => g.subject === subj);
            const badges = subjGrades.length > 0 
                ? subjGrades.map(g => `<span class="grade-badge" title="${g.desc}">${g.val}</span>`).join('')
                : '<span style="color: var(--text-muted); font-style: italic; font-size: 0.9rem;">Brak ocen</span>';

            html += `<tr><td><strong>${subj}</strong></td><td>${badges}</td></tr>`;
        });

        html += `</tbody></table></div></div>`;
        container.innerHTML += html;
    });
}

document.getElementById('add-grade-form').addEventListener('submit', function(e) {
    e.preventDefault();
    grades.push({
        id: Date.now(),
        student: document.getElementById('grade-student-select').value,
        subject: document.getElementById('grade-subject-select').value,
        val: document.getElementById('grade-value-select').value,
        desc: document.getElementById('grade-desc-input').value
    });
    saveData();
    renderGrades();
    this.reset();
});

// === 2. PLAN LEKCJI I ZASTĘPSTWA ===
function renderSchedule() {
    const tbody = document.getElementById('schedule-tbody');
    tbody.innerHTML = '';

    schedule.forEach((row, rowIndex) => {
        let tr = `<tr><td><strong>${row.hour}.</strong><br><span style="font-size:0.8rem; color:var(--text-muted);">${row.time}</span></td>`;
        
        row.days.forEach((daySubject, dayIndex) => {
            const sub = substitutions.find(s => s.hourIndex === rowIndex && s.dayIndex === dayIndex);
            
            if (isEditingSchedule) {
                tr += `<td><input type="text" class="schedule-input" value="${daySubject}" data-row="${rowIndex}" data-day="${dayIndex}"></td>`;
            } else if (sub) {
                tr += `<td style="background: #fef9c3; border-left: 3px solid #eab308;">
                        <span style="text-decoration: line-through; color: #713f12; font-size: 0.85rem;">${daySubject}</span><br>
                        <strong style="color: #854d0e;">zast.: ${sub.info}</strong>
                       </td>`;
            } else {
                tr += `<td>${daySubject}</td>`;
            }
        });
        tr += `</tr>`;
        tbody.innerHTML += tr;
    });

    renderSubstitutionsList();
}

// Renderowanie listy aktywnych zastępstw z opcją usuwania
function renderSubstitutionsList() {
    const listContainer = document.getElementById('substitutions-list');
    if (!listContainer) return;

    if (substitutions.length === 0) {
        listContainer.innerHTML = '<p style="font-size: 0.85rem; color: var(--text-muted);">Brak aktywnych zastępstw.</p>';
        return;
    }

    const daysMap = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek'];
    let html = '<ul style="list-style-type: none; padding: 0;">';
    
    substitutions.forEach((sub) => {
        const dayName = daysMap[sub.dayIndex];
        const hourInfo = schedule[sub.hourIndex] ? `${schedule[sub.hourIndex].hour}. lekcja (${schedule[sub.hourIndex].time})` : '';
        
        html += `
            <li style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 8px 12px; margin-bottom: 6px; border-radius: 6px; border: 1px solid var(--border); font-size: 0.9rem;">
                <span>📅 <strong>${dayName}</strong>, ${hourInfo} — ${sub.info}</span>
                <button onclick="deleteSubstitution(${sub.id})" class="btn btn-danger" style="padding: 3px 8px; font-size: 0.75rem;">Usuń</button>
            </li>
        `;
    });
    html += '</ul>';
    listContainer.innerHTML = html;
}

document.getElementById('btn-edit-schedule').addEventListener('click', function() {
    if (!isEditingSchedule) {
        isEditingSchedule = true;
        this.innerText = "💾 Zapisz plan lekcji";
        this.className = "btn btn-success";
        renderSchedule();
    } else {
        const inputs = document.querySelectorAll('.schedule-input');
        inputs.forEach(input => {
            const rIndex = input.getAttribute('data-row');
            const dIndex = input.getAttribute('data-day');
            schedule[rIndex].days[dIndex] = input.value.trim();
        });

        saveData();
        isEditingSchedule = false;
        this.innerText = "✏️ Edytuj plan lekcji";
        this.className = "btn btn-secondary";
        renderSchedule();
        alert('Plan lekcji zaktualizowany!');
    }
});

// Dodawanie zastępstwa
document.getElementById('add-substitution-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const dayIndex = parseInt(document.getElementById('sub-day-select').value);
    const hourIndex = parseInt(document.getElementById('sub-hour-select').value);
    const info = document.getElementById('sub-info-input').value.trim();

    // Usuń stare zastępstwo w tym samym slocie jeśli było
    substitutions = substitutions.filter(s => !(s.hourIndex === hourIndex && s.dayIndex === dayIndex));

    substitutions.push({
        id: Date.now(),
        dayIndex,
        hourIndex,
        info
    });

    saveData();
    renderSchedule();
    this.reset();
    alert('Zastępstwo zostało dodane!');
});

// Usuwanie zastępstwa (globalna funkcja)
window.deleteSubstitution = function(id) {
    substitutions = substitutions.filter(s => s.id !== id);
    saveData();
    renderSchedule();
};

// === 3. UWAGI I POCHWAŁY ===
function renderNotices() {
    const container = document.getElementById('notices-container');
    container.innerHTML = '';

    let filteredNotices = currentUser.role === 'UCZEN'
        ? notices.filter(n => n.student === currentUser.username)
        : notices;

    if (filteredNotices.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">Brak uwag lub pochwał w systemie.</p>';
        return;
    }

    filteredNotices.forEach(n => {
        const studentObj = users.find(u => u.username === n.student);
        const studentName = studentObj ? studentObj.name : n.student;
        const isPositive = n.type === 'positive';
        
        const cardStyle = isPositive 
            ? 'border-left: 5px solid var(--success); background: #f0fdf4;' 
            : 'border-left: 5px solid var(--danger); background: #fef2f2;';
        
        container.innerHTML += `
            <div style="${cardStyle} padding: 18px; border-radius: var(--radius); margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                ${currentUser.role !== 'UCZEN' ? `<div style="font-weight: 600; margin-bottom: 5px; color: var(--primary);">Uczeń: ${studentName}</div>` : ''}
                <p style="margin: 6px 0; font-size: 1rem;">${n.text}</p>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 8px;">
                    ${isPositive ? '⭐ Pochwała' : '⚠️ Uwaga'} od: <strong>${n.author}</strong>
                </div>
            </div>
        `;
    });
}

document.getElementById('add-notice-form').addEventListener('submit', function(e) {
    e.preventDefault();
    notices.push({
        student: document.getElementById('notice-student-select').value,
        type: document.getElementById('notice-type-select').value,
        text: document.getElementById('notice-text-input').value,
        author: currentUser.name
    });
    saveData();
    renderNotices();
    this.reset();
});

// === 4. PANEL ADMINISTRATORA ===
function renderAdminPanel() {
    const tbodyUsers = document.getElementById('admin-users-tbody');
    tbodyUsers.innerHTML = '';
    users.forEach(u => {
        const isSelf = u.username === currentUser.username;
        tbodyUsers.innerHTML += `
            <tr>
                <td><strong>${u.username}</strong></td>
                <td>${u.name}</td>
                <td><span class="badge" style="background: var(--primary);">${u.role}</span></td>
                <td>${u.className}</td>
                <td>
                    ${!isSelf ? `<button onclick="deleteUser('${u.username}')" class="btn btn-danger" style="padding: 6px 12px; font-size: 0.85rem;">Usuń konto</button>` : '<em style="color: var(--text-muted);">Twoje konto</em>'}
                </td>
            </tr>
        `;
    });

    const tbodySubjects = document.getElementById('admin-subjects-tbody');
    tbodySubjects.innerHTML = '';
    subjects.forEach((subj, idx) => {
        tbodySubjects.innerHTML += `
            <tr>
                <td><strong>${subj}</strong></td>
                <td><button onclick="deleteSubject(${idx})" class="btn btn-danger" style="padding: 4px 10px; font-size: 0.85rem;">Usuń</button></td>
            </tr>
        `;
    });
}

document.getElementById('admin-add-user-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('admin-new-username').value.trim();

    if (users.some(u => u.username === username)) {
        alert('Użytkownik o takim loginie już istnieje!');
        return;
    }

    users.push({
        username: username,
        pass: document.getElementById('admin-new-pass').value.trim(),
        name: document.getElementById('admin-new-fullname').value.trim(),
        role: document.getElementById('admin-new-role').value,
        className: document.getElementById('admin-new-class').value.trim()
    });

    saveData();
    renderAdminPanel();
    populateSelects();
    this.reset();
    alert('Użytkownik utworzony pomyślnie!');
});

document.getElementById('admin-add-subject-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const newSubj = document.getElementById('admin-new-subject-name').value.trim();

    if (subjects.includes(newSubj)) {
        alert('Taki przedmiot już istnieje!');
        return;
    }

    subjects.push(newSubj);
    saveData();
    renderAdminPanel();
    populateSelects();
    this.reset();
    alert('Przedmiot został dodany do bazy!');
});

window.deleteUser = function(username) {
    if (confirm(`Czy na pewno chcesz usunąć konto: ${username}?`)) {
        users = users.filter(u => u.username !== username);
        saveData();
        renderAdminPanel();
        populateSelects();
        renderGrades();
    }
};

window.deleteSubject = function(index) {
    if (confirm(`Czy na pewno chcesz usunąć przedmiot: ${subjects[index]}?`)) {
        subjects.splice(index, 1);
        saveData();
        renderAdminPanel();
        populateSelects();
        renderGrades();
    }
};