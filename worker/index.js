const PROJECT_ID = "nongtrai-b8a27";
const ISSUER = "https://securetoken.google.com/" + PROJECT_ID;
const JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
let jwkCache = null;
let jwkCacheUntil = 0;

function decodePart(s) {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(b, c => c.charCodeAt(0));
}
async function verifyFirebaseToken(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) throw new Error("Phiên đăng nhập không hợp lệ");
  const header = JSON.parse(new TextDecoder().decode(decodePart(parts[0])));
  const payload = JSON.parse(new TextDecoder().decode(decodePart(parts[1])));
  const now = Math.floor(Date.now() / 1000);
  if (header.alg !== "RS256" || !payload.sub || payload.aud !== PROJECT_ID ||
      payload.iss !== ISSUER || payload.exp <= now || payload.iat > now + 60) {
    throw new Error("Phiên đăng nhập đã hết hạn");
  }
  if (!jwkCache || Date.now() > jwkCacheUntil) {
    const response = await fetch(JWKS_URL);
    if (!response.ok) throw new Error("Không xác thực được tài khoản");
    jwkCache = (await response.json()).keys;
    jwkCacheUntil = Date.now() + 45 * 60 * 1000;
  }
  const jwk = jwkCache.find(k => k.kid === header.kid);
  if (!jwk) throw new Error("Khóa đăng nhập không hợp lệ");
  const key = await crypto.subtle.importKey("jwk", jwk, {
    name: "RSASSA-PKCS1-v1_5", hash: "SHA-256"
  }, false, ["verify"]);
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5", key, decodePart(parts[2]),
    new TextEncoder().encode(parts[0] + "." + parts[1])
  );
  if (!valid) throw new Error("Chữ ký đăng nhập không hợp lệ");
  return {
    uid: payload.sub,
    name: String(payload.name || payload.email || "Nông Dân").slice(0, 32)
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const id = env.PVP_ROOM.idFromName("global");
    const room = env.PVP_ROOM.get(id);
    if (url.pathname === "/api/pvp/leaderboard" && request.method === "GET") {
      return room.fetch("https://pvp.internal/leaderboard");
    }
    if (url.pathname !== "/api/pvp/ws" || request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return new Response("Not found", { status: 404 });
    }
    try {
      const protocols = (request.headers.get("Sec-WebSocket-Protocol") || "").split(",").map(x => x.trim());
      if (protocols[0] !== "firebase" || !protocols[1]) throw new Error("Thiếu xác thực");
      const user = await verifyFirebaseToken(protocols[1]);
      const headers = new Headers({
        "Upgrade": "websocket",
        "Sec-WebSocket-Protocol": "firebase",
        "X-Player-Uid": user.uid,
        "X-Player-Name": user.name
      });
      return room.fetch(new Request("https://pvp.internal/connect", { method: "GET", headers }));
    } catch (error) {
      return new Response(error.message || "Unauthorized", { status: 401 });
    }
  }
};

export class PvpRoom {
  constructor(state) {
    this.state = state;
    this.players = new Map();
    this.queue = [];
    this.invites = new Map();
    this.matches = new Map();
    this.nextMatch = 1;
    this.ranks = {};
    this.ready = state.blockConcurrencyWhile(async () => {
      const saved = await state.storage.list({ prefix: "rank:" });
      for (const [key, value] of saved) this.ranks[key.slice(5)] = value;
    });
  }
  async fetch(request) {
    await this.ready;
    const url = new URL(request.url);
    if (url.pathname === "/leaderboard") {
      const rows = Object.values(this.ranks).sort((a, b) =>
        (b.points - a.points) || (b.wins - a.wins) || (a.name || "").localeCompare(b.name || "")
      ).slice(0, 50);
      return Response.json({ rows });
    }
    if (url.pathname !== "/connect" || request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return new Response("Not found", { status: 404 });
    }
    const uid = request.headers.get("X-Player-Uid");
    const name = request.headers.get("X-Player-Name") || "Nông Dân";
    if (!uid) return new Response("Unauthorized", { status: 401 });
    const pair = new WebSocketPair();
    const client = pair[0], server = pair[1];
    server.accept();
    server.serializeAttachment({ uid, name });
    this.players.set(uid, server);
    server.addEventListener("message", event => this.message(server, event.data));
    server.addEventListener("close", () => this.disconnected(server));
    server.addEventListener("error", () => this.disconnected(server));
    this.send(server, { type: "connected", uid, name });
    return new Response(null, {
      status: 101, webSocket: client,
      headers: { "Sec-WebSocket-Protocol": "firebase" }
    });
  }
  data(ws) { try { return ws.deserializeAttachment() || {}; } catch { return {}; } }
  send(ws, data) {
    try { if (ws && ws.readyState === 1) ws.send(JSON.stringify(data)); } catch {}
  }
  sendUid(uid, data) { this.send(this.players.get(uid), data); }
  async message(ws, raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch { return this.send(ws, { type: "error", message: "Dữ liệu không hợp lệ" }); }
    const { uid, name } = this.data(ws);
    if (!uid || this.players.get(uid) !== ws) return;
    if (msg.type === "queue") return this.joinQueue(uid, name, msg.element);
    if (msg.type === "cancel_queue") {
      this.queue = this.queue.filter(x => x.uid !== uid);
      return this.send(ws, { type: "queue_cancelled" });
    }
    if (msg.type === "invite") return this.invite(uid, name, String(msg.toUid || "").trim());
    if (msg.type === "accept_invite") return this.acceptInvite(uid, name, String(msg.fromUid || ""));
    if (msg.type === "decline_invite") {
      const from = this.invites.get(uid);
      this.invites.delete(uid);
      if (from) this.sendUid(from, { type: "invite_declined", name });
      return;
    }
    if (msg.type === "move") return this.move(uid, msg.action);
    if (msg.type === "leave_match") return this.finishForfeit(uid);
  }
  cleanElement(value) {
    return ["fire", "leaf", "water", "ice", "lightning", "dark", "gem"].includes(value) ? value : "fire";
  }
  joinQueue(uid, name, element) {
    if (this.findMatch(uid)) return this.sendUid(uid, { type: "error", message: "Bạn đang ở trong trận đấu" });
    this.queue = this.queue.filter(x => x.uid !== uid);
    const otherIndex = this.queue.findIndex(x => x.uid !== uid && this.players.get(x.uid)?.readyState === 1);
    if (otherIndex < 0) {
      this.queue.push({ uid, name, element: this.cleanElement(element) });
      return this.sendUid(uid, { type: "queued", message: "Đang tìm đối thủ online..." });
    }
    const opponent = this.queue.splice(otherIndex, 1)[0];
    this.createMatch(opponent, { uid, name, element: this.cleanElement(element) });
  }
  invite(uid, name, toUid) {
    if (!toUid || toUid === uid) return this.sendUid(uid, { type: "error", message: "UID người chơi không hợp lệ" });
    const target = this.players.get(toUid);
    if (!target || target.readyState !== 1) return this.sendUid(uid, { type: "error", message: "Người này chưa online ở Đảo Rồng" });
    this.invites.set(toUid, uid);
    this.send(target, { type: "invite_received", fromUid: uid, fromName: name });
    this.sendUid(uid, { type: "invite_sent", toUid });
  }
  acceptInvite(uid, name, fromUid) {
    if (this.invites.get(uid) !== fromUid) return this.sendUid(uid, { type: "error", message: "Lời mời không còn hiệu lực" });
    const inviter = this.players.get(fromUid);
    if (!inviter || inviter.readyState !== 1) {
      this.invites.delete(uid);
      return this.sendUid(uid, { type: "error", message: "Người mời đã ngoại tuyến" });
    }
    this.invites.delete(uid);
    const from = this.data(inviter);
    this.createMatch(
      { uid: fromUid, name: from.name, element: "fire" },
      { uid, name, element: "fire" }
    );
  }
  createMatch(a, b) {
    this.queue = this.queue.filter(x => x.uid !== a.uid && x.uid !== b.uid);
    const match = {
      id: "pvp-" + this.nextMatch++,
      a: { ...a, hp: 100, maxHp: 100, mana: 30, defending: false },
      b: { ...b, hp: 100, maxHp: 100, mana: 30, defending: false },
      turnUid: a.uid
    };
    this.matches.set(match.id, match);
    this.broadcast(match, {
      type: "match_start", matchId: match.id, turnUid: match.turnUid,
      you: null, players: [this.publicPlayer(match.a), this.publicPlayer(match.b)],
      note: "Trận PvP cân bằng: mỗi rồng bắt đầu với 100 máu và 30 mana."
    });
    this.sendUid(a.uid, { type: "match_role", you: a.uid });
    this.sendUid(b.uid, { type: "match_role", you: b.uid });
  }
  publicPlayer(p) {
    return { uid: p.uid, name: p.name, element: p.element, hp: p.hp, maxHp: p.maxHp, mana: p.mana };
  }
  broadcast(match, data) {
    this.sendUid(match.a.uid, data);
    this.sendUid(match.b.uid, data);
  }
  findMatch(uid) {
    for (const match of this.matches.values()) if (match.a.uid === uid || match.b.uid === uid) return match;
    return null;
  }
  async move(uid, action) {
    const match = this.findMatch(uid);
    if (!match) return this.sendUid(uid, { type: "error", message: "Bạn chưa ở trong trận" });
    if (match.turnUid !== uid) return this.sendUid(uid, { type: "error", message: "Chưa đến lượt của bạn" });
    if (!["attack", "special", "defend"].includes(action)) return;
    const me = match.a.uid === uid ? match.a : match.b;
    const enemy = match.a.uid === uid ? match.b : match.a;
    let damage = 0, log = "";
    if (action === "attack") {
      damage = 12;
      me.mana = Math.min(60, me.mana + 10);
      log = me.name + " dùng Đánh thường!";
    } else if (action === "special") {
      if (me.mana < 20) return this.sendUid(uid, { type: "error", message: "Chưa đủ 20 mana" });
      me.mana -= 20;
      damage = 24;
      const cycle = ["fire", "leaf", "water", "ice", "lightning", "dark", "gem"];
      if (cycle[(cycle.indexOf(me.element) + 1) % 7] === enemy.element) damage = 32;
      log = me.name + " tung Chiêu nguyên tố!";
    } else {
      me.mana = Math.min(60, me.mana + 10);
      me.hp = Math.min(me.maxHp, me.hp + 8);
      me.defending = true;
      log = me.name + " phòng thủ và hồi 8 máu.";
    }
    if (damage) {
      if (enemy.defending) { damage = Math.ceil(damage / 2); enemy.defending = false; }
      enemy.hp = Math.max(0, enemy.hp - damage);
      log += " Gây " + damage + " sát thương.";
    }
    const winner = enemy.hp <= 0 ? uid : null;
    if (!winner) match.turnUid = enemy.uid;
    this.broadcast(match, {
      type: "match_update", matchId: match.id, turnUid: match.turnUid,
      players: [this.publicPlayer(match.a), this.publicPlayer(match.b)],
      log, lastAction: action
    });
    if (winner) await this.finish(match, winner, "win");
  }
  async finishForfeit(uid) {
    const match = this.findMatch(uid);
    if (!match) return;
    const winner = match.a.uid === uid ? match.b.uid : match.a.uid;
    await this.finish(match, winner, "opponent_left");
  }
  async finish(match, winnerUid, reason) {
    this.matches.delete(match.id);
    const loserUid = match.a.uid === winnerUid ? match.b.uid : match.a.uid;
    const winner = match.a.uid === winnerUid ? match.a : match.b;
    const loser = match.a.uid === winnerUid ? match.b : match.a;
    const winRank = this.ranks[winnerUid] || { uid: winnerUid, name: winner.name, wins: 0, losses: 0, points: 0 };
    const loseRank = this.ranks[loserUid] || { uid: loserUid, name: loser.name, wins: 0, losses: 0, points: 0 };
    winRank.name = winner.name; winRank.wins++; winRank.points += 3; winRank.updatedAt = Date.now();
    loseRank.name = loser.name; loseRank.losses++; loseRank.updatedAt = Date.now();
    this.ranks[winnerUid] = winRank; this.ranks[loserUid] = loseRank;
    await Promise.all([
      this.state.storage.put("rank:" + winnerUid, winRank),
      this.state.storage.put("rank:" + loserUid, loseRank)
    ]);
    this.broadcast(match, {
      type: "match_end", winnerUid, reason,
      players: [this.publicPlayer(match.a), this.publicPlayer(match.b)],
      message: reason === "opponent_left" ? "Đối thủ đã rời trận." : (winner.name + " chiến thắng!")
    });
  }
  disconnected(ws) {
    const { uid } = this.data(ws);
    if (!uid) return;
    if (this.players.get(uid) === ws) this.players.delete(uid);
    this.queue = this.queue.filter(x => x.uid !== uid);
    const from = this.invites.get(uid);
    if (from) { this.invites.delete(uid); this.sendUid(from, { type: "error", message: "Người được mời đã ngoại tuyến" }); }
    const match = this.findMatch(uid);
    if (match) this.finishForfeit(uid);
  }
}
