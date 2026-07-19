// お知らせデータ(data/notices.json)を取得する共通関数
// 各ページ側で <script>const NOTICES_JSON_PATH='data/notices.json';</script> のように
// パスを指定してから main.js を読み込む想定（ルート直下のページと admin/ 配下でパスが異なるため）
function fetchNotices(){
  const path = (typeof NOTICES_JSON_PATH !== 'undefined') ? NOTICES_JSON_PATH : 'data/notices.json';
  return fetch(path + '?t=' + Date.now())
    .then(res => {
      if(!res.ok) throw new Error('notices.json fetch failed');
      return res.json();
    })
    .catch(() => []);
}

function sortNoticesDesc(list){
  return [...list].sort((a, b) => (a.date < b.date ? 1 : -1));
}

function formatNoticeDate(dateStr){
  if(!dateStr) return '';
  return dateStr.replace(/-/g, '.') + ' 掲載';
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[s]));
}

// お知らせ一覧ページ（notice.html の #noticeList）
function renderNoticeList(list, el){
  const sorted = sortNoticesDesc(list);
  if(sorted.length === 0){
    el.innerHTML = '<p style="font-size:13.5px; color:var(--text-muted);">現在、お知らせはありません。</p>';
    return;
  }
  el.innerHTML = sorted.map(n => `
    <div class="notice-item${n.urgent ? ' urgent' : ''}">
      <div class="n-date">${escapeHtml(formatNoticeDate(n.date))}</div>
      <h3>${escapeHtml(n.title)}</h3>
      <p>${escapeHtml(n.body)}</p>
    </div>
  `).join('');
}

// トップページの休診お知らせバナー（index.html の #homeNoticeCard）
// urgent:true のうち最新のものを1件だけ表示。なければバナーごと非表示。
function renderHomeNotice(list, el){
  const sorted = sortNoticesDesc(list);
  const target = sorted.find(n => n.urgent) || sorted[0];
  if(!target){
    el.style.display = 'none';
    return;
  }
  el.innerHTML = `
    <a class="notice-box" href="notice.html">
      <span class="notice-icon">!</span>
      <div>
        <h3>${escapeHtml(target.title)}</h3>
        <p>${escapeHtml(target.body)}</p>
      </div>
    </a>
  `;
}

// ハンバーガーメニュー
document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('menuBtn');
  const nav = document.getElementById('primaryNav');
  if(menuBtn && nav){
    menuBtn.addEventListener('click', () => nav.classList.toggle('open'));
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
  }

  // お知らせ一覧（notice.html があるページのみ）
  const noticeListEl = document.getElementById('noticeList');
  if(noticeListEl){
    fetchNotices().then(list => renderNoticeList(list, noticeListEl));
  }

  // トップページの休診お知らせバナー（index.html にあるページのみ）
  const homeNoticeEl = document.getElementById('topNoticeCard');
  if(homeNoticeEl){
    fetchNotices().then(list => renderHomeNotice(list, homeNoticeEl));
  }

  // 診療時間の曜日ハイライト（診療時間表があるページのみ）
  const today = new Date().getDay(); // 0=日..6=土
  document.querySelectorAll('#hoursTable [data-day]').forEach(el => {
    if(parseInt(el.dataset.day) === today) el.classList.add('today');
  });

  // 本日の診療状況（ステータス表示があるページのみ）
  const pill = document.getElementById('statusPill');
  const text = document.getElementById('statusText');
  if(pill && text){
    const hoursByDay = {
      1:{am:true,pm:true}, 2:{am:true,pm:true}, 3:{am:true,pm:true},
      4:{am:false,pm:false}, 5:{am:true,pm:true}, 6:{am:true,pm:false}, 0:{am:false,pm:false}
    };
    const now = new Date();
    const hour = now.getHours() + now.getMinutes()/60;
    const t = hoursByDay[today];
    let isOpen = false;
    if(t){
      if(t.am && hour >= 9 && hour < 13) isOpen = true;
      if(t.pm && hour >= 16 && hour < 18) isOpen = true;
    }
    if(isOpen){
      pill.classList.add('open');
      text.textContent = '本日は診療しております';
    } else {
      pill.classList.add('closed');
      text.textContent = (t && (t.am || t.pm)) ? '本日は診療時間外です' : '本日は休診日です';
    }
  }
});
