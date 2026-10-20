/* ===== NHIỆM VỤ NGÀY: lưu tiến độ trong dữ liệu người chơi ===== */
const DQ = [
  { id: 'harvest', icon: '🌾', name: 'Thu hoạch nông sản', desc: 'Thu hoạch 3 ô cây', goal: 3, reward: [80, 0] },
  { id: 'animal', icon: '🐮', name: 'Chăm sóc vật nuôi', desc: 'Thu sản phẩm từ vật nuôi 2 lần', goal: 2, reward: [60, 0] },
  { id: 'chat', icon: '💬', name: 'Giao lưu cộng đồng', desc: 'Gửi 1 tin nhắn cộng đồng', goal: 1, reward: [40, 0] },
  { id: 'market', icon: '🛍️', name: 'Ghé thăm khu chợ', desc: 'Mua 1 món ở chợ người chơi', goal: 1, reward: [50, 0] }
];

const dqDay = () => new Date().toLocaleDateString('en-CA');

function dqState() {
  const day = dqDay();
  if (!S.dq || S.dq.day !== day) S.dq = { day, progress: {}, claimed: {} };
  S.dq.progress = S.dq.progress || {};
  S.dq.claimed = S.dq.claimed || {};
  return S.dq;
}

function dqInc(k, n = 1) {
  const d = dqState();
  d.progress[k] = Math.min(999, (d.progress[k] || 0) + n);
  if (typeof save === 'function') save();
}

function dqReward(id) {
  const q = DQ.find(x => x.id === id);
  const d = dqState();

  if (!q || d.claimed[id] || (d.progress[id] || 0) < q.goal) return;

  d.claimed[id] = 1;
  S.c += q.reward[0];
  if (q.reward[1]) add('gem', q.reward[1]);
  hud();
  save();
  if (typeof cloudSave === 'function') cloudSave(true);
  toast('🎁 Nhận thưởng nhiệm vụ: +' + q.reward[0] + ' xu');
  if (typeof openSoc === 'function') openSoc('daily');
}

/* ===== MÃ KHUYẾN MÃI ===== */
const PROMO_CODES = {
  SAVE10: { type: 'percent', value: 10 },
  FARM100: { type: 'cash', value: 100 },
  GEM5: { type: 'gem', value: 5 }
};

function applyPromoCode(code) {
  const key = String(code || '').trim().toUpperCase();
  if (!key) return { ok: false, msg: 'Vui lòng nhập mã khuyến mãi.' };

  const item = PROMO_CODES[key];
  if (!item) return { ok: false, msg: 'Mã không hợp lệ.' };

  S.promo = S.promo || {};
  if (S.promo[key]) return { ok: false, msg: 'Mã này đã được dùng.' };

  S.promo[key] = true;
  save();

  if (item.type === 'percent') {
    const bonus = Math.floor(S.c * (item.value / 100));
    S.c += bonus;
    hud();
    return { ok: true, msg: 'Áp dụng thành công: ' + key + ' (+' + bonus + ' 🪙)' };
  }

  if (item.type === 'cash') {
    S.c += item.value;
    hud();
    return { ok: true, msg: 'Áp dụng thành công: +' + item.value + ' 🪙' };
  }

  if (item.type === 'gem') {
    add('gem', item.value);
    hud();
    return { ok: true, msg: 'Áp dụng thành công: +' + item.value + ' 💎' };
  }

  return { ok: false, msg: 'Loại mã không hỗ trợ.' };
}

function openPromoCodeModal() {
  dOpen = false;

  let h = `
    <h2>🎫 Mã khuyến mãi</h2>
    <div class="row">
      <input
        id="promoInput"
        type="text"
        placeholder="Nhập mã"
        value=""
        style="flex:1;border:2px solid var(--bd);border-radius:10px;padding:10px 12px;font-size:14px;background:#fff;color:var(--tx)"
      />
      <button class="btn g" id="promoApplyBtn">Áp dụng</button>
    </div>

    <div style="margin-top:12px;font-size:13px;color:var(--mu)">
      Mã có sẵn: <b>SAVE10</b>, <b>FARM100</b>, <b>GEM5</b>
    </div>

    <div id="promoResult" style="margin-top:12px;font-size:13px;color:var(--mu)"></div>

    <div style="text-align:right;margin-top:14px">
      <button class="btn" id="promoCloseBtn">Đóng</button>
    </div>
  `;

  $('md').innerHTML = h;
  $('ov').classList.add('on');

  $('promoApplyBtn').onclick = function () {
    const result = applyPromoCode($('promoInput').value);
    const box = $('promoResult');
    box.textContent = result.msg;
    box.style.color = result.ok ? 'var(--ac)' : 'crimson';
    toast(result.msg);
  };

  $('promoCloseBtn').onclick = closeM;
}

/* ===== CÁC TAB CỦA CỘNG ĐỒNG ===== */
if (typeof SOCX !== 'object') SOCX = {};

SOCX.daily = {
  label: '📅 Nhiệm vụ ngày',
  local: true,
  badge() {
    const d = dqState();
    return DQ.some(q => !d.claimed[q.id] && (d.progress[q.id] || 0) >= q.goal) ? ' !' : '';
  },
  body() {
    const d = dqState();
    let h = '<div class="dq-intro">Hoàn thành nhiệm vụ để nhận xu. Tiến độ làm mới mỗi ngày.</div>';
    h += '<div class="dq-list">';

    DQ.forEach(function (q) {
      const n = Math.min(q.goal, d.progress[q.id] || 0);
      const done = !!d.claimed[q.id];
      const ready = n >= q.goal;

      let action = '<button class="btn" disabled>Chưa đủ</button>';
      if (done) action = '<button class="btn" disabled>Đã nhận</button>';
      else if (ready) action = '<button class="btn g" data-dq="' + q.id + '">Nhận thưởng</button>';

      h +=
        '<div class="dq-item">' +
        '<div class="dq-icon">' + q.icon + '</div>' +
        '<div class="dq-info">' +
        '<b>' + q.name + '</b>' +
        '<small>' + q.desc + '</small>' +
        '<div class="dq-track"><i style="width:' + Math.floor((n / q.goal) * 100) + '%"></i></div>' +
        '<div class="dq-meta"><span>' + n + '/' + q.goal + '</span>' + action + '</div>' +
        '</div>' +
        '</div>';
    });

    h += '<div style="margin-top:12px;text-align:center"><button class="btn g" id="promoBtnDaily">🎫 Mã khuyến mãi</button></div>';
    return h + '</div>';
  },
  init() {
    if ($('md')) {
      $('md').querySelectorAll('[data-dq]').forEach(function (b) {
        b.onclick = function () {
          dqReward(b.dataset.dq);
        };
      });
    }

    const promoBtn = $('promoBtnDaily');
    if (promoBtn) {
      promoBtn.onclick = function () {
        openPromoCodeModal();
      };
    }
  }
};

/* Theo dõi một số hành động hiện có mà không thay thế logic gốc. */
{
  const _cp = clickPlot;
  clickPlot = function (i, el) {
    const p = S.p[i];
    const ready = !!(p && p.u && p.c && Date.now() >= p.e);
    _cp(i, el);
    if (ready && S.p[i] && !S.p[i].c) dqInc('harvest');
  };
}

{
  const _rc = rclick;
  rclick = function (a, el) {
    const v = rvar(a);
    const p = v ? v.p : null;
    const b = p ? inv(p) : 0;
    _rc(a, el);
    if (p && inv(p) > b) dqInc('animal');
  };
}

{
  const _sc = sendChat;
  sendChat = async function () {
    const i = $('cin');
    const before = i && i.value.trim();
    await _sc();
    if (before) dqInc('chat');
  };
}

{
  const _mb = mBuy;
  mBuy = async function (id) {
    const before = S.c;
    await _mb(id);
    if (S.c < before) dqInc('market');
  };
                   }
