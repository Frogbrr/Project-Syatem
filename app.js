(() => {
  "use strict";
  const STORE = "project-system-rpg-v2";

  const statNames = { forca: "Força", inteligencia: "Inteligência", disciplina: "Disciplina", vitalidade: "Vitalidade", foco: "Foco" };

  const defaultMissions = [
    { id: "m1", title: "Beber 1L de água no dia", stat: "vitalidade", xp: 15, gold: 10, doneOn: null },
    { id: "m2", title: "Ler ou estudar por 15 min", stat: "inteligencia", xp: 20, gold: 15, doneOn: null },
    { id: "m3", title: "Sessão de Foco sem distrações", stat: "foco", xp: 20, gold: 15, doneOn: null },
    { id: "m4", title: "Treino rápido ou caminhada", stat: "forca", xp: 25, gold: 20, doneOn: null }
  ];

  const defaultShop = [
    { id: "s1", title: "1h de Jogos / Séries", cost: 50 },
    { id: "s2", title: "Lanche especial no FDS", cost: 150 }
  ];

  const today = () => new Date().toLocaleDateString("en-CA");
  const $ = id => document.getElementById(id);

  const fresh = () => ({
    xp: 0, level: 1, gold: 0,
    missions: defaultMissions,
    stats: { forca: 1, inteligencia: 1, disciplina: 1, vitalidade: 1, foco: 1 },
    boss: { name: "👹 Monstro da Procrastinação", maxHp: 500, hp: 500 },
    waterMl: 0, sleepHours: 7,
    cards: [], shop: defaultShop, journal: [], completed: [], activeDays: []
  });

  let data;
  try { data = JSON.parse(localStorage.getItem(STORE)) || fresh(); } catch { data = fresh(); }

  let currentCardIndex = 0;
  let timerSeconds = 25 * 60, timerRunning = false, timerInterval = null;

  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(data)); } catch(e){} };

  function toast(msg) {
    const el = $("toast"); el.textContent = msg; el.classList.add("show");
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("show"), 2300);
  }

  function levelFor(xp) { return Math.floor(xp / 100) + 1; }
  function rankFor(level) {
    if (level >= 30) return "CAÇADOR S";
    if (level >= 20) return "CAÇADOR A";
    if (level >= 10) return "CAÇADOR B";
    if (level >= 5) return "CAÇADOR C";
    return "CAÇADOR E";
  }

  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  function damageBoss(amount) {
    data.boss.hp = Math.max(0, data.boss.hp - amount);
    if (data.boss.hp === 0) {
      toast("🏆 CHEFE DERROTADO! +100 XP Bônus +50 Gold");
      data.xp += 100; data.gold += 50;
      data.boss.hp = data.boss.maxHp; // Reset
    }
  }

  function render() {
    data.level = levelFor(data.xp);
    $("rankName").textContent = rankFor(data.level);
    $("levelLine").textContent = `Nível ${data.level} · ${data.level === 1 ? "Iniciante" : "Evoluindo"}`;
    $("levelNum").textContent = data.level;
    $("xpText").textContent = `${data.xp % 100} / 100 XP`;
    $("xpBar").style.width = (data.xp % 100) + "%";
    $("goldDisplay").textContent = `💰 ${data.gold}`;

    // Boss
    $("bossName").textContent = data.boss.name;
    $("bossHpText").textContent = `${data.boss.hp} / ${data.boss.maxHp} HP`;
    $("bossHpFill").style.width = (data.boss.hp / data.boss.maxHp * 100) + "%";

    // Date & Missions
    $("todayDate").textContent = new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
    const done = data.missions.filter(m => m.doneOn === today()).length;
    $("missionCount").textContent = `${done}/${data.missions.length} concluídas`;

    $("missionList").innerHTML = data.missions.map(m => `
      <article class="mission ${m.doneOn === today() ? "done" : ""}">
        <button class="mission-check" data-complete="${m.id}">${m.doneOn === today() ? "✓" : ""}</button>
        <div class="mission-body">
          <strong>${esc(m.title)}</strong>
          <span class="mission-meta">Atributo: ${statNames[m.stat] || m.stat}</span>
        </div>
        <span class="daily-xp">+${m.xp}XP / +${m.gold}G</span>
      </article>
    `).join("") || '<div class="empty-state">Sem missões cadastradas.</div>';

    // Fitness
    $("waterCount").textContent = `${data.waterMl} / 2500 ml`;
    $("waterBar").style.width = Math.min(100, (data.waterMl / 2500) * 100) + "%";

    // Stats
    $("statsGrid").innerHTML = Object.entries(statNames).map(([key, name]) => `
      <div class="stat-card">
        <span class="eyebrow">${name.toUpperCase()}</span>
        <strong>${data.stats[key] || 1}</strong>
      </div>
    `).join("");

    $("totalDone").textContent = data.completed.length;
    $("activeDays").textContent = new Set(data.activeDays).size;

    renderShop(); renderCards(); renderJournal(); save();
  }

  // Mission actions
  $("missionList").addEventListener("click", e => {
    const btn = e.target.closest("[data-complete]");
    if (!btn) return;
    const m = data.missions.find(x => x.id === btn.dataset.complete);
    if (!m) return;
    if (m.doneOn === today()) { toast("Missão já concluída hoje."); return; }

    m.doneOn = today();
    data.xp += m.xp;
    data.gold += m.gold;
    data.activeDays.push(today());
    data.completed.push({ id: m.id, date: today() });
    if (m.stat) data.stats[m.stat] = (data.stats[m.stat] || 1) + 1;

    damageBoss(20);
    toast(`Missão concluída! +${m.xp} XP / +${m.gold} Gold`);
    render();
  });

  $("addMissionForm").addEventListener("submit", e => {
    e.preventDefault();
    const title = $("missionInput").value.trim();
    const stat = $("missionStatSelect").value;
    if (!title) return;
    data.missions.push({ id: "custom-" + Date.now(), title, stat, xp: 15, gold: 10, doneOn: null });
    $("missionInput").value = "";
    render();
    toast("Missão criada.");
  });

  // Fitness actions
  $("addWaterBtn").addEventListener("click", () => {
    data.waterMl += 250;
    if (data.waterMl % 1000 === 0) { data.stats.vitalidade++; toast("Meta de água progredindo! +Vitalidade"); }
    render();
  });

  $("completeWorkoutBtn").addEventListener("click", () => {
    data.xp += 25; data.gold += 15; data.stats.forca++;
    damageBoss(40);
    toast("Treino concluído! +25 XP / -40 HP no Chefe");
    render();
  });

  // Shop actions
  function renderShop() {
    $("shopList").innerHTML = data.shop.map(s => `
      <div class="shop-card">
        <h4>${esc(s.title)}</h4>
        <button class="primary-btn wide mt-2" data-buy="${s.id}">💰 ${s.cost} Gold</button>
      </div>
    `).join("");
  }

  $("shopList").addEventListener("click", e => {
    const btn = e.target.closest("[data-buy]");
    if (!btn) return;
    const item = data.shop.find(x => x.id === btn.dataset.buy);
    if (data.gold < item.cost) { toast("Gold insuficiente!"); return; }
    data.gold -= item.cost;
    toast(`Recompensa resgatada: ${item.title}`);
    render();
  });

  $("addRewardForm").addEventListener("submit", e => {
    e.preventDefault();
    const title = $("rewardTitle").value.trim();
    const cost = Number($("rewardCost").value) || 50;
    if (!title) return;
    data.shop.push({ id: "shop-" + Date.now(), title, cost });
    $("rewardTitle").value = "";
    render();
  });

  // Flashcards
  function renderCards() {
    if (!data.cards.length) {
      $("cardFront").textContent = "Nenhum card cadastrado.";
      $("cardBack").classList.add("hidden");
      return;
    }
    const card = data.cards[currentCardIndex % data.cards.length];
    $("cardFront").textContent = card.front;
    $("cardBack").textContent = card.back;
  }

  $("revealCardBtn").addEventListener("click", () => {
    $("cardBack").classList.remove("hidden");
    $("correctCardBtn").classList.remove("hidden");
  });

  $("correctCardBtn").addEventListener("click", () => {
    data.xp += 5; data.stats.inteligencia++;
    toast("Card revisado! +5 XP");
    currentCardIndex++;
    $("cardBack").classList.add("hidden");
    $("correctCardBtn").classList.add("hidden");
    render();
  });

  $("addCardForm").addEventListener("submit", e => {
    e.preventDefault();
    const front = $("cardFrontInput").value.trim();
    const back = $("cardBackInput").value.trim();
    if (!front || !back) return;
    data.cards.push({ front, back });
    $("cardFrontInput").value = ""; $("cardBackInput").value = "";
    toast("Flashcard salvo!");
    render();
  });

  // Journal
  $("journalForm").addEventListener("submit", e => {
    e.preventDefault();
    const text = $("journalText").value.trim();
    if (!text) return;
    data.journal.unshift({ mood: $("moodSelect").value, text, date: today() });
    $("journalText").value = "";
    renderJournal();
    toast("Registro salvo!");
  });

  function renderJournal() {
    $("journalHistory").innerHTML = data.journal.slice(0, 10).map(j => `
      <div class="panel mt-2">
        <strong>${j.mood} · ${j.date}</strong>
        <p class="muted tiny mt-1">${esc(j.text)}</p>
      </div>
    `).join("");
  }

  // Timer Focus
  function updateTimer() {
    const m = Math.floor(timerSeconds / 60), s = timerSeconds % 60;
    $("timerDisplay").textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  $("timerStart").addEventListener("click", () => {
    if (timerRunning) { clearInterval(timerInterval); timerRunning = false; $("timerStart").textContent = "Continuar"; return; }
    timerRunning = true; $("timerStart").textContent = "Pausar";
    timerInterval = setInterval(() => {
      timerSeconds--; updateTimer();
      if (timerSeconds <= 0) {
        clearInterval(timerInterval); timerRunning = false;
        data.xp += 20; data.gold += 15; data.stats.foco++; damageBoss(30);
        toast("Foco concluído! +20 XP / +15 Gold"); render();
      }
    }, 1000);
  });

  $("timerReset").addEventListener("click", () => {
    clearInterval(timerInterval); timerRunning = false; timerSeconds = 25 * 60; updateTimer(); $("timerStart").textContent = "Iniciar";
  });

  // Navigation
  document.querySelectorAll("[data-tab]").forEach(b => b.addEventListener("click", () => {
    document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === "view-" + b.dataset.tab));
    document.querySelectorAll(".tab, .bottom-item").forEach(x => x.classList.toggle("active", x.dataset.tab === b.dataset.tab));
  }));

  // Settings
  $("settingsBtn").addEventListener("click", () => $("settingsDialog").showModal());
  $("exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "project-system-backup.json"; a.click();
  });
  $("resetBtn").addEventListener("click", () => {
    if (confirm("Resetar todo o seu progresso?")) { data = fresh(); save(); render(); $("settingsDialog").close(); }
  });

  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }

  render(); updateTimer();
})();
