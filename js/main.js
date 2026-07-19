// ハンバーガーメニュー
document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('menuBtn');
  const nav = document.getElementById('primaryNav');
  if(menuBtn && nav){
    menuBtn.addEventListener('click', () => nav.classList.toggle('open'));
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
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
