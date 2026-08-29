const STORAGE_KEY = "fund-tracker-entries";

const TYPE_LABELS = {
  deposit: "入金",
  withdraw: "出金",
  gain: "運用益",
  loss: "運用損",
};

const form = document.getElementById("entryForm");
const dateInput = document.getElementById("inputDate");
const typeInput = document.getElementById("inputType");
const amountInput = document.getElementById("inputAmount");
const memoInput = document.getElementById("inputMemo");
const tableBody = document.getElementById("entryTableBody");
const emptyMessage = document.getElementById("emptyMessage");
const exportBtn = document.getElementById("exportBtn");
const clearBtn = document.getElementById("clearBtn");
const canvas = document.getElementById("balanceChart");

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function signedAmount(entry) {
  const sign = entry.type === "withdraw" || entry.type === "loss" ? -1 : 1;
  return sign * entry.amount;
}

function formatYen(value) {
  return "¥" + Math.round(value).toLocaleString("ja-JP");
}

function render() {
  const entries = loadEntries();
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
      <td><button class="row-delete" data-id="${entry.id}">削除</button></td>
    `;
    tableBody.appendChild(tr);
  }

  tableBody.querySelectorAll(".row-delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const remaining = loadEntries().filter((e) => String(e.id) !== id);
      saveEntries(remaining);
      render();
    });
  });

  renderSummary(entries);
  renderChart(entries);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
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

  // zero line
  ctx.strokeStyle = "#d1d5db";
  ctx.beginPath();
  ctx.moveTo(padding, toY(0));
  ctx.lineTo(width - padding, toY(0));
  ctx.stroke();

  // balance line
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

  // points
  ctx.fillStyle = "#2563eb";
  points.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(toX(i), toY(p.balance), 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // labels for first/last date
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
  };
  if (!entry.date || !entry.amount) return;

  const entries = loadEntries();
  entries.push(entry);
  saveEntries(entries);

  form.reset();
  render();
});

exportBtn.addEventListener("click", () => {
  const entries = loadEntries();
  const header = "date,type,amount,memo\n";
  const rows = entries.map((e) => `${e.date},${e.type},${e.amount},"${(e.memo || "").replace(/"/g, '""')}"`);
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
  if (!confirm("すべての記録を削除します。よろしいですか？")) return;
  saveEntries([]);
  render();
});

dateInput.valueAsDate = new Date();
render();
