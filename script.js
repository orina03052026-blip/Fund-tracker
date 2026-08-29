const ENTRIES_KEY = "fund-tracker-entries";
const JOBS_KEY = "fund-tracker-jobs";
const TARGETS_KEY = "fund-tracker-targets";

const TYPE_LABELS = {
  deposit: "入金",
  withdraw: "出金",
  gain: "運用益",
  loss: "運用損",
};

const JOB_STATUS_LABELS = {
  applying: "応募中",
  active: "受注・作業中",
  delivered: "納品済み・入金待ち",
  paid: "入金済み",
  cancelled: "見送り・不成立",
};

// ---------- storage helpers ----------

function loadList(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

const loadEntries = () => loadList(ENTRIES_KEY);
const saveEntries = (v) => saveList(ENTRIES_KEY, v);
const loadJobs = () => loadList(JOBS_KEY);
const saveJobs = (v) => saveList(JOBS_KEY, v);
const loadTargets = () => loadList(TARGETS_KEY);
const saveTargets = (v) => saveList(TARGETS_KEY, v);

function formatYen(value) {
  return "¥" + Math.round(value).toLocaleString("ja-JP");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- tabs ----------

const tabNav = document.getElementById("tabNav");
tabNav.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab-btn");
  if (!btn) return;
  const tab = btn.getAttribute("data-tab");
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b === btn));
  document.querySelectorAll(".tab-panel").forEach((p) => {
    p.classList.toggle("hidden", p.id !== `tab-${tab}`);
  });
});

// ================= 資金管理 =================

function signedAmount(entry) {
  const sign = entry.type === "withdraw" || entry.type === "loss" ? -1 : 1;
  return sign * entry.amount;
}

const form = document.getElementById("entryForm");
const dateInput = document.getElementById("inputDate");
const typeInput = document.getElementById("inputType");
const amountInput = document.getElementById("inputAmount");
const memoInput = document.getElementById("inputMemo");
const targetSelect = document.getElementById("inputTarget");
const tableBody = document.getElementById("entryTableBody");
const emptyMessage = document.getElementById("emptyMessage");
const exportBtn = document.getElementById("exportBtn");
const clearBtn = document.getElementById("clearBtn");
const canvas = document.getElementById("balanceChart");

function populateTargetSelect() {
  const targets = loadTargets();
  const current = targetSelect.value;
  targetSelect.innerHTML = '<option value="">（割り当てなし）</option>';
  for (const t of targets) {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.name;
    targetSelect.appendChild(opt);
  }
  targetSelect.value = current;
}

function renderEntries() {
  const entries = loadEntries();
  const targets = loadTargets();
  const targetName = (id) => targets.find((t) => String(t.id) === String(id))?.name || "";
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1));

  tableBody.innerHTML = "";
  emptyMessage.style.display = sorted.length === 0 ? "block" : "none";

  for (const entry of sorted) {
    const tr = document.createElement("tr");
    const amt = signedAmount(entry);
    tr.innerHTML = `
      <td>${entry.date}</td>
      <td>${TYPE_LABELS[entry.type] || entry.type}</td>
      <td class="amount ${amt >= 0 ? "positive" : "negative"}">${amt >= 0 ? "+" : ""}${formatYen(amt)}</td>
      <td>${entry.memo ? escapeHtml(entry.memo) : ""}</td>
      <td>${entry.targetId ? escapeHtml(targetName(entry.targetId)) : ""}</td>
      <td><button class="row-action delete" data-id="${entry.id}">削除</button></td>
    `;
    tableBody.appendChild(tr);
  }

  tableBody.querySelectorAll(".delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      saveEntries(loadEntries().filter((e) => String(e.id) !== id));
      renderAll();
    });
  });

  renderSummary(entries);
  renderChart(entries);
}

function renderSummary(entries) {
  let deposit = 0, withdraw = 0, gain = 0, loss = 0;
  for (const e of entries) {
    if (e.type === "deposit") deposit += e.amount;
    if (e.type === "withdraw") withdraw += e.amount;
    if (e.type === "gain") gain += e.amount;
    if (e.type === "loss") loss += e.amount;
  }
  const balance = deposit - withdraw + gain - loss;
  const pnl = gain - loss;

  document.getElementById("sumBalance").textContent = formatYen(balance);
  document.getElementById("sumDeposit").textContent = formatYen(deposit);
  document.getElementById("sumWithdraw").textContent = formatYen(withdraw);

  const pnlEl = document.getElementById("sumPnl");
  pnlEl.textContent = (pnl >= 0 ? "+" : "") + formatYen(pnl);
  pnlEl.classList.toggle("positive", pnl >= 0);
  pnlEl.classList.toggle("negative", pnl < 0);
}

function renderChart(entries) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  if (entries.length === 0) {
    ctx.fillStyle = "#9ca3af";
    ctx.font = "14px sans-serif";
    ctx.fillText("記録を追加するとグラフが表示されます", 20, height / 2);
    return;
  }

  const sorted = [...entries].sort((a, b) => (a.date < b.date ? -1 : 1));
  let running = 0;
  const points = sorted.map((e) => {
    running += signedAmount(e);
    return { date: e.date, balance: running };
  });

  const padding = 30;
  const values = points.map((p) => p.balance);
  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(0, ...values);
  const range = maxVal - minVal || 1;

  const xStep = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;
  const toX = (i) => padding + i * xStep;
  const toY = (v) => height - padding - ((v - minVal) / range) * (height - padding * 2);

  ctx.strokeStyle = "#d1d5db";
  ctx.beginPath();
  ctx.moveTo(padding, toY(0));
  ctx.lineTo(width - padding, toY(0));
  ctx.stroke();

  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = toX(i);
    const y = toY(p.balance);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = "#2563eb";
  points.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(toX(i), toY(p.balance), 3, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#6b7280";
  ctx.font = "11px sans-serif";
  ctx.fillText(points[0].date, padding, height - 8);
  ctx.fillText(points[points.length - 1].date, width - padding - 70, height - 8);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const entry = {
    id: Date.now(),
    date: dateInput.value,
    type: typeInput.value,
    amount: Number(amountInput.value),
    memo: memoInput.value.trim(),
    targetId: targetSelect.value || null,
  };
  if (!entry.date || !entry.amount) return;

  const entries = loadEntries();
  entries.push(entry);
  saveEntries(entries);

  form.reset();
  dateInput.valueAsDate = new Date();
  renderAll();
});

exportBtn.addEventListener("click", () => {
  const entries = loadEntries();
  const header = "date,type,amount,memo,targetId\n";
  const rows = entries.map(
    (e) => `${e.date},${e.type},${e.amount},"${(e.memo || "").replace(/"/g, '""')}",${e.targetId || ""}`
  );
  const csv = header + rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "fund-tracker-export.csv";
  a.click();
  URL.revokeObjectURL(url);
});

clearBtn.addEventListener("click", () => {
  if (!confirm("すべての資金記録を削除します。よろしいですか？")) return;
  saveEntries([]);
  renderAll();
});

// ================= 案件管理 =================

const jobForm = document.getElementById("jobForm");
const jobTitleInput = document.getElementById("jobTitle");
const jobPlatformInput = document.getElementById("jobPlatform");
const jobStatusInput = document.getElementById("jobStatus");
const jobAmountInput = document.getElementById("jobAmount");
const jobDueInput = document.getElementById("jobDue");
const jobMemoInput = document.getElementById("jobMemo");
const jobTableBody = document.getElementById("jobTableBody");
const jobEmptyMessage = document.getElementById("jobEmptyMessage");

function renderJobs() {
  const jobs = loadJobs();
  const sorted = [...jobs].sort((a, b) => (a.due || "") < (b.due || "") ? -1 : 1);

  jobTableBody.innerHTML = "";
  jobEmptyMessage.style.display = sorted.length === 0 ? "block" : "none";

  let activeCount = 0, paidTotal = 0, pendingTotal = 0;
  for (const job of jobs) {
    if (job.status === "active" || job.status === "applying") activeCount++;
    if (job.status === "paid") paidTotal += job.amount || 0;
    if (job.status === "delivered" || job.status === "active") pendingTotal += job.amount || 0;
  }
  document.getElementById("jobActiveCount").textContent = activeCount;
  document.getElementById("jobPaidTotal").textContent = formatYen(paidTotal);
  document.getElementById("jobPendingTotal").textContent = formatYen(pendingTotal);

  for (const job of sorted) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(job.title)}</td>
      <td>${job.platform ? escapeHtml(job.platform) : ""}</td>
      <td><span class="status-badge status-${job.status}">${JOB_STATUS_LABELS[job.status] || job.status}</span></td>
      <td>${job.amount ? formatYen(job.amount) : ""}</td>
      <td>${job.due || ""}</td>
      <td>${job.memo ? escapeHtml(job.memo) : ""}</td>
      <td>
        ${job.status !== "paid" ? `<button class="row-action mark-paid" data-id="${job.id}">入金済みにする</button>` : ""}
        <button class="row-action delete" data-id="${job.id}">削除</button>
      </td>
    `;
    jobTableBody.appendChild(tr);
  }

  jobTableBody.querySelectorAll(".delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      saveJobs(loadJobs().filter((j) => String(j.id) !== id));
      renderAll();
    });
  });

  jobTableBody.querySelectorAll(".mark-paid").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const jobs = loadJobs();
      const job = jobs.find((j) => String(j.id) === id);
      if (!job) return;
      job.status = "paid";
      saveJobs(jobs);

      const entries = loadEntries();
      entries.push({
        id: Date.now(),
        date: new Date().toISOString().slice(0, 10),
        type: "deposit",
        amount: job.amount || 0,
        memo: `案件入金：${job.title}`,
        targetId: null,
      });
      saveEntries(entries);

      renderAll();
      alert(`「${job.title}」の報酬 ${formatYen(job.amount || 0)} を資金記録に入金として追加しました。`);
    });
  });
}

jobForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!jobTitleInput.value.trim()) return;
  const jobs = loadJobs();
  jobs.push({
    id: Date.now(),
    title: jobTitleInput.value.trim(),
    platform: jobPlatformInput.value.trim(),
    status: jobStatusInput.value,
    amount: Number(jobAmountInput.value) || 0,
    due: jobDueInput.value,
    memo: jobMemoInput.value.trim(),
  });
  saveJobs(jobs);
  jobForm.reset();
  renderAll();
});

// ================= 投資ターゲット =================

const targetForm = document.getElementById("targetForm");
const targetNameInput = document.getElementById("targetName");
const targetAmountInput = document.getElementById("targetAmount");
const targetMemoInput = document.getElementById("targetMemo");
const targetListEl = document.getElementById("targetList");
const targetEmptyMessage = document.getElementById("targetEmptyMessage");

function renderTargets() {
  const targets = loadTargets();
  const entries = loadEntries();

  targetListEl.innerHTML = "";
  targetEmptyMessage.style.display = targets.length === 0 ? "block" : "none";

  for (const target of targets) {
    const allocated = entries
      .filter((e) => String(e.targetId) === String(target.id))
      .reduce((sum, e) => sum + signedAmount(e), 0);
    const pct = target.amount > 0 ? Math.min(100, Math.max(0, (allocated / target.amount) * 100)) : 0;

    const div = document.createElement("div");
    div.className = "target-card";
    div.innerHTML = `
      <div class="target-card-header">
        <h3>${escapeHtml(target.name)}</h3>
        <button class="row-action delete" data-id="${target.id}">削除</button>
      </div>
      <div class="progress-bar"><div class="progress-bar-fill ${pct >= 100 ? "complete" : ""}" style="width:${pct}%"></div></div>
      <div class="target-progress-text">${formatYen(allocated)} / ${formatYen(target.amount)}（${pct.toFixed(0)}%）</div>
      ${target.memo ? `<p class="target-memo">${escapeHtml(target.memo)}</p>` : ""}
    `;
    targetListEl.appendChild(div);
  }

  targetListEl.querySelectorAll(".delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      saveTargets(loadTargets().filter((t) => String(t.id) !== id));
      renderAll();
    });
  });
}

targetForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!targetNameInput.value.trim() || !targetAmountInput.value) return;
  const targets = loadTargets();
  targets.push({
    id: Date.now(),
    name: targetNameInput.value.trim(),
    amount: Number(targetAmountInput.value),
    memo: targetMemoInput.value.trim(),
  });
  saveTargets(targets);
  targetForm.reset();
  renderAll();
});

// ================= init =================

function renderAll() {
  populateTargetSelect();
  renderEntries();
  renderJobs();
  renderTargets();
}

dateInput.valueAsDate = new Date();
renderAll();
