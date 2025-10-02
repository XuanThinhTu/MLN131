(() => {
  const SIZE = 8;
  const gameEl = document.getElementById('game');
  const scoreEl = document.getElementById('score');
  const needsEl = document.getElementById('needs');
  const bagEl = document.getElementById('bag');
  const barEl = document.getElementById('bar');
  const msgEl = document.getElementById('msg');
  const timeEl = document.getElementById('time');
  const restartBtn = document.getElementById('restart');

  const IMAGES = {
    player: 'assets/player.png',
    policyEdu: 'assets/graduation-cap.png',
    policyHealth: 'assets/hospital-building.png',
    policyWelfare: 'assets/welfare.png',
    policyDialog: 'assets/handshake.png',
    villageA: 'assets/rong.png',
    villageB: 'assets/stilt-house.png',
    religionX: 'assets/religion.png',
    misinformation: 'assets/fake-news.png',
  };

  const POLICY_KEYS = ['Edu', 'Health', 'Welfare', 'Dialog'];
  const COMMUNITY_TYPES = [
    { key: 'A', label: 'Cộng đồng Dân tộc Kinh', icon: 'villageA' },
    { key: 'B', label: 'Cộng đồng Dân tộc Ê-đê', icon: 'villageB' },
    { key: 'X', label: 'Cộng đồng Tôn giáo', icon: 'religionX' },
  ];

  let cells = [];
  let player = { x: 3, y: 3 };
  let bag = [];
  let score = 0;
  let needs = [];
  let policies = [];
  let communities = [];
  let clouds = [];
  let timer = 60,
    tId = null,
    cloudId = null,
    finished = false;

  function idx(x, y) {
    return y * SIZE + x;
  }
  function inBounds(x, y) {
    return x >= 0 && x < SIZE && y >= 0 && y < SIZE;
  }

  function initGrid() {
    gameEl.style.setProperty('--size', SIZE);
    gameEl.innerHTML = '';
    cells = [];
    for (let i = 0; i < SIZE * SIZE; i++) {
      const c = document.createElement('div');
      c.className = 'cell';
      gameEl.appendChild(c);
      cells.push(c);
    }
  }

  function randEmptyCell(exclude = []) {
    let x,
      y,
      tries = 0;
    do {
      x = Math.floor(Math.random() * SIZE);
      y = Math.floor(Math.random() * SIZE);
      tries++;
      if (tries > 5000) break;
    } while (
      (x === player.x && y === player.y) ||
      exclude.some((p) => p.x === x && p.y === y)
    );
    return { x, y };
  }

  function setupGame() {
    player = { x: Math.floor(SIZE / 2), y: Math.floor(SIZE / 2) };
    bag = [];
    score = 0;
    needs = [];
    policies = [];
    communities = [];
    clouds = [];
    finished = false;
    timer = 60;

    COMMUNITY_TYPES.forEach((ct) => {
      const pos = randEmptyCell([
        { x: player.x, y: player.y },
        ...communities,
        ...policies,
      ]);
      communities.push({ x: pos.x, y: pos.y, comm: ct.key });
      const need = POLICY_KEYS[Math.floor(Math.random() * POLICY_KEYS.length)];
      needs.push({ comm: ct.key, need, done: false });
    });

    for (let i = 0; i < 6; i++) {
      const kind = POLICY_KEYS[Math.floor(Math.random() * POLICY_KEYS.length)];
      const pos = randEmptyCell([
        { x: player.x, y: player.y },
        ...communities,
        ...policies,
      ]);
      policies.push({ x: pos.x, y: pos.y, kind });
    }

    for (let i = 0; i < 2; i++) {
      const pos = randEmptyCell([
        { x: player.x, y: player.y },
        ...communities,
        ...policies,
      ]);
      clouds.push({ x: pos.x, y: pos.y });
    }

    render();
    updateHUD();
    msgEl.textContent = 'Hãy thu chính sách và giao đúng nhu cầu!';

    if (tId) clearInterval(tId);
    if (cloudId) clearInterval(cloudId);
    tId = setInterval(() => {
      if (!finished) {
        timer--;
        timeEl.textContent = timer;
        if (timer <= 0) endGame();
      }
    }, 1000);
    cloudId = setInterval(moveClouds, 800);
  }

  function render() {
    cells.forEach((c) => (c.innerHTML = ''));

    // policies
    for (const p of policies) {
      const el = cells[idx(p.x, p.y)];
      el.innerHTML = `<img src="${IMAGES['policy' + p.kind]}" class="icon">`;
      el.title = 'Chính sách: ' + p.kind;
    }

    // communities
    for (const c of communities) {
      const type = COMMUNITY_TYPES.find((t) => t.key === c.comm);
      const el = cells[idx(c.x, c.y)];
      el.innerHTML = `<img src="${IMAGES[type.icon]}" class="icon">`;
      el.title = type.label;
    }

    // misinformation
    for (const m of clouds) {
      const el = cells[idx(m.x, m.y)];
      el.innerHTML = `<img src="${IMAGES.misinformation}" class="icon">`;
      el.title = 'Misinformation – tránh va chạm';
    }

    // player
    cells[
      idx(player.x, player.y)
    ].innerHTML = `<img src="${IMAGES.player}" class="icon">`;
  }

  function updateHUD() {
    scoreEl.textContent = score;
    barEl.style.width = Math.max(0, Math.min(100, score)) + '%';
    bagEl.innerHTML = bag.length
      ? bag
          .map(
            (k) =>
              `<span class="tag"><img src="${
                IMAGES['policy' + k]
              }" class="icon small"> ${k}</span>`
          )
          .join('')
      : '<span class="tag">Trống</span>';
    needsEl.innerHTML = needs
      .map((n) => {
        const ct = COMMUNITY_TYPES.find((c) => c.key === n.comm);
        return `<div><img src="${IMAGES[ct.icon]}" class="icon small"> <b>${
          ct.label
        }</b> cần: <img src="${
          IMAGES['policy' + n.need]
        }" class="icon small"> ${n.need} ${
          n.done ? '<span class="good">✔</span>' : ''
        }</div>`;
      })
      .join('');
  }

  function endGame() {
    finished = true;
    clearInterval(tId);
    clearInterval(cloudId);
    const allDone = needs.every((n) => n.done);
    msgEl.innerHTML = allDone
      ? `🎉 <b>Hoàn thành!</b> Bạn đã đáp ứng mọi nhu cầu. Chỉ số Đoàn Kết: <b>${score}</b>.`
      : `⌛ Hết giờ. Hoàn thành <b>${needs.filter((n) => n.done).length}/${
          needs.length
        }</b> cộng đồng. Điểm: <b>${score}</b>.`;
  }

  function move(dx, dy) {
    if (finished) return;
    const nx = player.x + dx,
      ny = player.y + dy;
    if (!inBounds(nx, ny)) return;
    player.x = nx;
    player.y = ny;

    const i = policies.findIndex((p) => p.x === nx && p.y === ny);
    if (i > -1) {
      const kind = policies[i].kind;
      bag.push(kind);
      policies.splice(i, 1);
      msgEl.textContent = `Đã nhặt ${kind}.`;
      score += 5;
    }

    const c = communities.find((cc) => cc.x === nx && cc.y === ny);
    if (c) {
      const needObj = needs.find((n) => n.comm === c.comm);
      if (!needObj.done) {
        const has = bag.indexOf(needObj.need);
        if (has > -1) {
          bag.splice(has, 1);
          needObj.done = true;
          score += 20;
          msgEl.innerHTML = `✅ Giao đúng cho ${
            COMMUNITY_TYPES.find((x) => x.key === c.comm).label
          }.`;
          if (needs.every((n) => n.done)) endGame();
        } else {
          msgEl.innerHTML = `<span class="bad">✖ Chưa có chính sách phù hợp.</span>`;
          score = Math.max(0, score - 3);
        }
      }
    }

    if (clouds.some((m) => m.x === nx && m.y === ny)) {
      score = Math.max(0, score - 8);
      msgEl.innerHTML = `<span class="bad">⚠ Bị misinformation. Điểm giảm!</span>`;
    }

    render();
    updateHUD();
  }

  function endGame() {
    finished = true;
    clearInterval(tId);
    clearInterval(cloudId);

    const allDone = needs.every((n) => n.done);
    const popup = document.getElementById('popup');
    const popupTitle = document.getElementById('popup-title');
    const popupMessage = document.getElementById('popup-message');

    if (allDone) {
      popupTitle.innerHTML = '🎉 Chiến thắng!';
      popupMessage.innerHTML = `
    Bạn đã đáp ứng mọi nhu cầu.<br>
    <b>Chỉ số Đoàn Kết: ${score}</b><br><br>
    🌍 <b>Thông điệp:</b> Phân bổ công bằng – Tôn trọng sự khác biệt – 
    Tăng cường đoàn kết dân tộc & hòa hợp tôn giáo.
  `;
    } else {
      popupTitle.innerHTML = '⚠️ Thất bại!';
      popupMessage.innerHTML = `
    Hoàn thành <b>${needs.filter((n) => n.done).length}/${
        needs.length
      }</b> cộng đồng.<br>
    Điểm: <b>${score}</b><br><br>
    ❌ <b>Thông điệp:</b> Thiếu công bằng & bị ảnh hưởng bởi thông tin sai lệch 
    sẽ làm suy giảm đoàn kết xã hội.
  `;
    }

    popup.classList.remove('hidden');
  }

  document.getElementById('popup-close').addEventListener('click', () => {
    document.getElementById('popup').classList.add('hidden');
    setupGame();
  });

  function moveClouds() {
    if (finished) return;
    for (const m of clouds) {
      const dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];
      const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
      const nx = m.x + dx,
        ny = m.y + dy;
      if (inBounds(nx, ny)) {
        if (!communities.some((c) => c.x === nx && c.y === ny)) {
          m.x = nx;
          m.y = ny;
        }
      }
    }
    if (policies.length < 6 && Math.random() < 0.25) {
      const kind = POLICY_KEYS[Math.floor(Math.random() * POLICY_KEYS.length)];
      const pos = randEmptyCell([
        { x: player.x, y: player.y },
        ...communities,
        ...policies,
        ...clouds,
      ]);
      policies.push({ x: pos.x, y: pos.y, kind });
    }
    render();
  }

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'w'].includes(k)) {
      e.preventDefault();
      move(0, -1);
    } else if (['arrowdown', 's'].includes(k)) {
      e.preventDefault();
      move(0, 1);
    } else if (['arrowleft', 'a'].includes(k)) {
      e.preventDefault();
      move(-1, 0);
    } else if (['arrowright', 'd'].includes(k)) {
      e.preventDefault();
      move(1, 0);
    }
  });

  restartBtn.addEventListener('click', setupGame);

  initGrid();
  setupGame();
})();
