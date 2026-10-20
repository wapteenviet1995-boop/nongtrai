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

/* ===== NHIỆM VỤ NGÀY + MÃ KHUYẾN MÃI ===== */
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
