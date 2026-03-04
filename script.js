// --- 0. LOCAL STORAGE SETUP (100% BLANCO RESET) ---
// Ich habe die Speichernamen ('japp_...') geändert. 
// Dein Browser behandelt dies nun als komplett neue App. Alle Geister-Einträge sind weg!
let planData = JSON.parse(localStorage.getItem('japp_plan')) || {};
let expenses = JSON.parse(localStorage.getItem('japp_expenses')) || [];
let hubData = JSON.parse(localStorage.getItem('japp_hub')) || [];
let checklistData = JSON.parse(localStorage.getItem('japp_checklist')) || [];

let speakData = JSON.parse(localStorage.getItem('japp_speak')) || [
  { id: 1, de: "Zahlen, bitte!", jp: "お会計をお願いします", romaji: "Okaikei o onegaishimasu" },
  { id: 2, de: "Wo ist die Toilette?", jp: "トイレはどこですか？", romaji: "Toire wa doko desu ka?" },
  { id: 3, de: "Haben Sie ein englisches Menü?", jp: "英語のメニューはありますか？", romaji: "Eigo no menyū wa arimasu ka?" },
  { id: 4, de: "Ich habe eine Allergie.", jp: "私はアレルギーがあります。", romaji: "Watashi wa arerugī ga arimasu." },
  { id: 5, de: "Sehr lecker!", jp: "とても美味しいです！", romaji: "Totemo oishī desu!" },
  { id: 6, de: "Entschuldigung / Verzeihung", jp: "すみません", romaji: "Sumimasen" }
];

let currentRomaji = "";

function saveAllData() {
  localStorage.setItem('japp_plan', JSON.stringify(planData));
  localStorage.setItem('japp_expenses', JSON.stringify(expenses));
  localStorage.setItem('japp_hub', JSON.stringify(hubData));
  localStorage.setItem('japp_checklist', JSON.stringify(checklistData));
  localStorage.setItem('japp_speak', JSON.stringify(speakData));
}

// --- 1. THEME & NAVIGATION ---
const appContainer = document.getElementById('app');
if(localStorage.getItem('japp_theme') === 'light') {
  appContainer.classList.remove('dark-mode');
  document.querySelector('#theme-toggle i').classList.replace('fa-sun', 'fa-moon');
}

document.getElementById('theme-toggle').addEventListener('click', (e) => {
  appContainer.classList.toggle('dark-mode');
  const icon = e.currentTarget.querySelector('i');
  icon.classList.toggle('fa-moon'); icon.classList.toggle('fa-sun');
  localStorage.setItem('japp_theme', appContainer.classList.contains('dark-mode') ? 'dark' : 'light');
});

const navItems = document.querySelectorAll('.nav-item');
const tabSections = document.querySelectorAll('.tab-section');
const headerTitle = document.getElementById('header-title');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    navItems.forEach(nav => nav.classList.remove('active'));
    item.classList.add('active');
    headerTitle.textContent = item.getAttribute('data-title');
    tabSections.forEach(section => section.classList.remove('active'));
    document.getElementById(item.getAttribute('data-target')).classList.add('active');
    closeBonusTool();
  });
});

// --- 2. TIMETABLE ---
const calendarStrip = document.getElementById('calendar-strip');
const timelineContent = document.getElementById('timeline-content');
const currentDateTitle = document.getElementById('current-date-title');
let currentlySelectedDateStr = "";

const startDate = new Date(2026, 1, 20); 
const endDate = new Date(2026, 3, 30);   
const today = new Date(); 
const daysName = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
let elementToScrollTo = null;

let d = new Date(startDate);
while (d <= endDate) {
  let day = d.getDate(); let month = d.getMonth() + 1; let year = d.getFullYear();
  let dateStr = `${day < 10 ? '0'+day : day}.${month < 10 ? '0'+month : month}.${year}`;
  let div = document.createElement('div');
  div.className = 'cal-day';
  div.innerHTML = `<span>${daysName[d.getDay()]}</span><strong>${day}</strong>`;
  
  div.addEventListener('click', () => {
    document.querySelectorAll('.cal-day').forEach(el => el.classList.remove('active'));
    div.classList.add('active');
    currentlySelectedDateStr = dateStr;
    currentDateTitle.textContent = dateStr;
    renderTimeline(dateStr);
  });
  calendarStrip.appendChild(div);
  if (d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) {
    elementToScrollTo = div;
  }
  d.setDate(d.getDate() + 1);
}

setTimeout(() => {
  let target = elementToScrollTo || calendarStrip.firstChild;
  target.click(); 
  target.scrollIntoView({ behavior: 'smooth', inline: 'center' });
}, 300);

function renderTimeline(dateStr) {
  timelineContent.innerHTML = '';
  const events = planData[dateStr] || [];
  if (events.length === 0) {
    timelineContent.innerHTML = `<div class="timeline-item"><div class="time">-</div><div class="event"><h3>Nichts geplant</h3><p>Zeit für Spontanes!</p></div></div>`;
    return;
  }
  events.sort((a, b) => a.time.localeCompare(b.time));
  events.forEach(ev => {
    timelineContent.innerHTML += `<div class="timeline-item">
      <div class="time">${ev.time}</div>
      <div class="event">
        <div style="display:flex; justify-content:space-between;">
          <h3>${ev.title}</h3>
          <button class="del-btn-small" onclick="deleteTimelineEvent('${dateStr}', ${ev.id})"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <p>${ev.desc}</p>
      </div>
    </div>`;
  });
}

window.deleteTimelineEvent = function(dateStr, id) {
  planData[dateStr] = planData[dateStr].filter(e => e.id !== id);
  saveAllData(); 
  renderTimeline(dateStr);
};

document.getElementById('show-tt-form-btn').addEventListener('click', () => {
  document.getElementById('add-tt-form').style.display = 'block';
  document.getElementById('show-tt-form-btn').style.display = 'none';
});
document.getElementById('cancel-tt-btn').addEventListener('click', () => {
  document.getElementById('add-tt-form').style.display = 'none';
  document.getElementById('show-tt-form-btn').style.display = 'block';
});
document.getElementById('save-tt-btn').addEventListener('click', () => {
  const time = document.getElementById('tt-time').value || "00:00";
  const title = document.getElementById('tt-title').value;
  const desc = document.getElementById('tt-desc').value;
  if(!title) return alert("Bitte einen Titel eingeben.");
  if(!planData[currentlySelectedDateStr]) planData[currentlySelectedDateStr] = [];
  
  planData[currentlySelectedDateStr].push({ id: Date.now(), time, title, desc });
  saveAllData(); 
  
  document.getElementById('tt-time').value = ''; document.getElementById('tt-title').value = ''; document.getElementById('tt-desc').value = '';
  document.getElementById('add-tt-form').style.display = 'none'; document.getElementById('show-tt-form-btn').style.display = 'block';
  renderTimeline(currentlySelectedDateStr);
});

// --- 3. MONEY TRACKER ---
let currentFilter = 'all';

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentFilter = e.target.getAttribute('data-filter');
    renderExpenses();
  });
});

function renderExpenses() {
  const list = document.getElementById('expense-list');
  list.innerHTML = '';
  let total = 0;
  expenses.forEach(exp => total += exp.amount);
  document.getElementById('total-amount').textContent = total.toFixed(2).replace('.', ',') + ' €';

  const filteredExpenses = currentFilter === 'all' ? expenses : expenses.filter(e => e.cat === currentFilter);
  if(filteredExpenses.length === 0) {
    list.innerHTML = `<p class="text-muted text-center mt-15">Keine Ausgaben.</p>`;
    return;
  }

  filteredExpenses.forEach(exp => {
    list.innerHTML += `
      <div class="expense-item">
        <div class="exp-left">
          <div class="exp-icon ${exp.color}"><i class="fa-solid ${exp.icon}"></i></div>
          <div class="exp-details"><h4>${exp.title}</h4></div>
        </div>
        <div class="exp-right">
          <div class="exp-amount">${exp.amount.toFixed(2).replace('.', ',')} €</div>
          <button class="del-btn" onclick="deleteExpense(${exp.id})"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </div>
    `;
  });
}

window.deleteExpense = function(id) {
  expenses = expenses.filter(e => e.id !== id);
  saveAllData(); 
  renderExpenses();
}

document.getElementById('add-expense-btn').addEventListener('click', () => {
  const customTitle = document.getElementById('expense-title').value;
  const amtInput = document.getElementById('expense-amount');
  const catInput = document.getElementById('expense-category');
  const amt = parseFloat(amtInput.value.replace(',', '.')); 
  if(isNaN(amt) || amt <= 0) return alert("Bitte gültigen Betrag eingeben!");
  
  let icon = "fa-receipt", color = "bg-food", title = "Ausgabe";
  if(catInput.value === "food") { icon = "fa-bowl-rice"; color = "bg-food"; title = "Essen & Trinken"; }
  if(catInput.value === "transport") { icon = "fa-train"; color = "bg-transport"; title = "Transport"; }
  if(catInput.value === "sightseeing") { icon = "fa-camera"; color = "bg-sight"; title = "Sightseeing"; }
  if(catInput.value === "shopping") { icon = "fa-bag-shopping"; color = "bg-shop"; title = "Shopping"; }
  if(catInput.value === "hotel") { icon = "fa-plane-departure"; color = "bg-hotel"; title = "Flug & Hotel"; }
  
  const finalTitle = customTitle.trim() !== "" ? customTitle : title;
  expenses.unshift({ id: Date.now(), amount: amt, cat: catInput.value, icon: icon, color: color, title: finalTitle });
  
  saveAllData(); 
  
  document.getElementById('expense-title').value = ''; amtInput.value = '';
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-filter="all"]').classList.add('active');
  currentFilter = 'all';
  renderExpenses();
});
renderExpenses();

// --- 4. TRAVEL HUB ---
window.copyText = function(text) {
  navigator.clipboard.writeText(text).then(() => { alert("Kopiert!"); }).catch(err => { alert("Kopieren fehlgeschlagen."); });
};

function renderHub() {
  const list = document.getElementById('hub-list');
  list.innerHTML = '';
  hubData.forEach(item => {
    const safeText = item.desc.replace(/'/g, "\\'").replace(/\n/g, "\\n");
    list.innerHTML += `
      <div class="vault-card">
        <button class="copy-btn" onclick="copyText('${safeText}')" title="Kopieren"><i class="fa-regular fa-copy"></i></button>
        <div class="vault-top" style="justify-content: space-between; width: 100%;">
          <div style="display:flex; align-items:center; gap:12px;">
            <i class="fa-solid fa-file-lines vault-icon"></i> <h3>${item.title}</h3>
          </div>
          <button class="del-btn-small" onclick="deleteHub(${item.id})" style="margin-right:25px;"><i class="fa-solid fa-trash"></i></button>
        </div>
        <p class="vault-desc">${item.desc}</p>
      </div>`;
  });
}

window.deleteHub = function(id) {
  hubData = hubData.filter(e => e.id !== id);
  saveAllData(); 
  renderHub();
}

document.getElementById('show-hub-form-btn').addEventListener('click', () => { document.getElementById('add-hub-form').style.display = 'block'; document.getElementById('show-hub-form-btn').style.display = 'none'; });
document.getElementById('cancel-hub-btn').addEventListener('click', () => { document.getElementById('add-hub-form').style.display = 'none'; document.getElementById('show-hub-form-btn').style.display = 'block'; });
document.getElementById('save-hub-btn').addEventListener('click', () => {
  const t = document.getElementById('hub-title').value; const d = document.getElementById('hub-desc').value;
  if(!t) return alert("Bitte Titel eingeben.");
  hubData.push({ id: Date.now(), title: t, desc: d });
  saveAllData(); 
  
  document.getElementById('hub-title').value = ''; document.getElementById('hub-desc').value = '';
  document.getElementById('add-hub-form').style.display = 'none'; document.getElementById('show-hub-form-btn').style.display = 'block';
  renderHub();
});
renderHub();

// --- 5. BONUS TOOLS ---
const bonusMenu = document.getElementById('bonus-menu');
const subPages = document.querySelectorAll('.sub-page');

window.openBonusTool = function(id) { 
  bonusMenu.classList.add('hidden'); 
  document.getElementById(id).classList.remove('hidden'); 
  if(id === 'tool-speak') renderSpeak(); 
};
window.closeBonusTool = function() { subPages.forEach(p => p.classList.add('hidden')); bonusMenu.classList.remove('hidden'); };

// GEFIXT: Die offizielle Google Maps Search URL API!
window.openMapSearch = function(query) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  window.open(mapsUrl, '_blank');
};

// --- PACKLISTE ---
function renderChecklist() {
  const ul = document.getElementById('checklist-items');
  ul.innerHTML = '';
  checklistData.forEach(item => {
    const li = document.createElement('li');
    if(item.checked) li.className = 'checked';
    li.innerHTML = `
      <div class="check-left" onclick="toggleCheck(${item.id})">
        <i class="fa-regular ${item.checked ? 'fa-square-check' : 'fa-square'}"></i> <span>${item.text}</span>
      </div>
      <button class="del-btn-small" onclick="deleteCheckItem(${item.id})"><i class="fa-solid fa-xmark"></i></button>
    `;
    ul.appendChild(li);
  });
}

window.toggleCheck = function(id) {
  const item = checklistData.find(i => i.id === id);
  if(item) { item.checked = !item.checked; saveAllData(); renderChecklist(); }
};

window.deleteCheckItem = function(id) {
  checklistData = checklistData.filter(i => i.id !== id);
  saveAllData(); renderChecklist();
}

document.getElementById('add-pack-btn').addEventListener('click', () => {
  const input = document.getElementById('new-pack-item');
  if(!input.value.trim()) return;
  checklistData.push({ id: Date.now(), text: input.value, checked: false });
  saveAllData(); input.value = ''; renderChecklist();
});
renderChecklist(); 

// --- WÄHRUNGSRECHNER ---
let liveExchangeRate = 162.50;
fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json')
  .then(res => res.json())
  .then(data => {
    liveExchangeRate = data.eur.jpy;
    document.getElementById('live-rate-badge').textContent = "Live-Kurs aktiv";
    document.getElementById('live-rate-badge').style.backgroundColor = "var(--accent-transport)";
  }).catch(err => {
    document.getElementById('live-rate-badge').textContent = "Offline Kurs";
    document.getElementById('live-rate-badge').style.backgroundColor = "var(--danger)";
  });

window.convertYen = function() {
  const yen = document.getElementById('yen-input').value;
  const euroOutput = document.getElementById('euro-output');
  if(!yen) { euroOutput.textContent = "0,00 €"; return; }
  const euro = yen / liveExchangeRate;
  euroOutput.textContent = euro.toFixed(2).replace('.', ',') + " €";
};

// --- ÜBERSETZER (GOOGLE API) & POINT & SPEAK ---
window.translateText = function() {
  const input = document.getElementById('trans-input').value;
  const outputDiv = document.getElementById('trans-output');
  const romajiDiv = document.getElementById('trans-romaji');
  const resultBox = document.getElementById('trans-result-box');
  const btn = document.getElementById('trans-btn');
  
  if(!input.trim()) return alert("Bitte Text eingeben.");
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Lädt...';
  
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=ja&dt=t&dt=rm&q=${encodeURIComponent(input)}`;
  
  fetch(url)
    .then(res => res.json())
    .then(data => {
      let translatedText = ""; let romajiText = "";
      if (data && data[0]) {
        data[0].forEach(item => {
          if (item[0]) translatedText += item[0]; 
          if (item[2]) romajiText += item[2];     
        });
      }
      outputDiv.textContent = translatedText || "Fehler";
      romajiDiv.textContent = romajiText || "";
      currentRomaji = romajiText || ""; 
      
      resultBox.style.display = 'block';
      btn.innerHTML = '<i class="fa-solid fa-language"></i> Übersetzen';
    })
    .catch(err => {
      outputDiv.textContent = "Fehler bei der Übersetzung. Bist du online?";
      romajiDiv.textContent = "";
      resultBox.style.display = 'block';
      btn.innerHTML = '<i class="fa-solid fa-language"></i> Übersetzen';
    });
};

window.saveTranslationToSpeak = function() {
  const de = document.getElementById('trans-input').value;
  const jp = document.getElementById('trans-output').textContent;
  speakData.push({ id: Date.now(), de: de, jp: jp, romaji: currentRomaji });
  saveAllData(); 
  alert("Erfolgreich in 'Point & Speak' gespeichert!");
};

window.playTTS = function(lang) {
  let text = "";
  if (lang === 'de') text = document.getElementById('trans-input').value;
  else if (lang === 'ja') text = document.getElementById('trans-output').textContent;
  
  if (!text.trim()) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === 'de' ? 'de-DE' : 'ja-JP'; 
  window.speechSynthesis.speak(utterance);
};

window.renderSpeak = function() {
  const list = document.getElementById('speak-list');
  list.innerHTML = '';
  speakData.forEach(item => {
    list.innerHTML += `
      <div class="speak-card">
        <button class="del-btn-small" onclick="deleteSpeakItem(${item.id})"><i class="fa-solid fa-xmark"></i></button>
        <p class="text-muted mb-10">${item.de}</p>
        <div class="speak-jp">${item.jp}</div>
        ${item.romaji ? `<p class="small-text mt-10" style="color: var(--accent); font-size: 15px;">${item.romaji}</p>` : ''}
      </div>
    `;
  });
}

window.deleteSpeakItem = function(id) {
  speakData = speakData.filter(i => i.id !== id);
  saveAllData();
  renderSpeak();
}