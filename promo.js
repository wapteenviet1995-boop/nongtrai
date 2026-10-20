/* promo.js */
(function () {
  function getPromoClaimed() {
    S.promo = S.promo || {};
    return S.promo;
  }

  function applyPromoCode(code) {
    const key = String(code || "").trim().toUpperCase();
    if (!key) return { ok: false, msg: "Vui lòng nhập mã khuyến mãi." };

    const promos = {
      SAVE10: { type: "percent", value: 10 },
      FARM100: { type: "cash", value: 100 },
      GEM5: { type: "gem", value: 5 }
    };

    const item = promos[key];
    if (!item) return { ok: false, msg: "Mã không hợp lệ." };

    const used = getPromoClaimed();
    if (used[key]) return { ok: false, msg: "Mã này đã được dùng." };

    used[key] = true;
    save();

    if (item.type === "percent") {
      const bonus = Math.floor(S.c * (item.value / 100));
      S.c += bonus;
      hud();
      return { ok: true, msg: `Áp dụng thành công: ${key} (+${bonus} 🪙)` };
    }

    if (item.type === "cash") {
      S.c += item.value;
      hud();
      return { ok: true, msg: `Áp dụng thành công: +${item.value} 🪙` };
    }

    if (item.type === "gem") {
      add("gem", item.value);
      hud();
      return { ok: true, msg: `Áp dụng thành công: +${item.value} 💎` };
    }

    return { ok: false, msg: "Loại mã không hỗ trợ." };
  }

  function openPromoCodeModal() {
    dOpen = false;
    const h = `
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

    $('promoApplyBtn').onclick = () => {
      const result = applyPromoCode($('promoInput').value);
      const box = $('promoResult');
      box.textContent = result.msg;
      box.style.color = result.ok ? "var(--ac)" : "crimson";
      toast(result.msg);
    };

    $('promoCloseBtn').onclick = closeM;
  }

  window.openPromoCodeModal = openPromoCodeModal;
  window.applyPromoCode = applyPromoCode;
})();
