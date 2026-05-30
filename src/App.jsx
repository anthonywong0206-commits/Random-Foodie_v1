import React, { useMemo, useState } from 'react'

const STORAGE_KEYS = {
  restaurants: 'foodRoulette_restaurantMenu_v2',
  history: 'foodRoulette_history_v2',
  settings: 'foodRoulette_settings_v2',
  exclusions: 'foodRoulette_exclusions_v2'
}

const CATEGORIES = ['快餐', '茶餐廳', '日式', '米線', '西式', '中餐', '飲品', '其他']
const defaultSettings = { favoriteBoost: true }

const defaultRestaurants = [
  makeRestaurant('麥當勞', '快餐', '全港', ['1號餐 巨無霸餐', '2號餐 麥香雞餐', '3號餐 雙層芝士孖堡餐', '4號餐 麥樂雞餐', '5號餐 魚柳包餐', '6號餐 板燒雞腿包餐', '7號餐 脆辣雞腿包餐', '8號餐 安格斯牛堡餐', '9號餐 豬柳蛋漢堡餐', '10號餐 開心樂園餐'], ['可樂', '雪碧', '凍檸茶', '熱咖啡', '朱古力奶昔'], true),
  makeRestaurant('KFC', '快餐', '全港', ['家鄉雞皇飯', '香辣脆雞餐', '葡撻套餐', '蘑菇飯', '雞翼餐', 'Zinger Burger 餐'], ['百事', '七喜', '檸檬茶', '咖啡', '熱奶茶'], false),
  makeRestaurant('大家樂', '茶餐廳', '全港', ['焗豬扒飯', '粟米魚柳飯', '燒味飯', '咖喱牛腩飯', '早餐常餐', '下午茶餐'], ['凍奶茶', '熱檸茶', '凍檸樂', '熱咖啡', '豆漿'], false),
  makeRestaurant('大快活', '茶餐廳', '全港', ['焗豬扒飯', '叉燒飯', '海南雞飯', '咖喱雞飯', '魚柳飯', '早餐通粉餐'], ['凍檸茶', '熱奶茶', '凍咖啡', '可樂', '忌廉'], false),
  makeRestaurant('一蘭', '日式', '尖沙咀 / 銅鑼灣', ['天然豚骨拉麵', '加替玉拉麵', '半熟鹽味蛋拉麵', '叉燒拉麵', '辣醬拉麵'], ['冰水', '綠茶', '可樂', '啤酒'], true),
  makeRestaurant('譚仔', '米線', '全港', ['三餸米線', '酸辣米線', '麻辣米線', '番茄湯米線', '清湯米線', '雞翼米線'], ['凍檸茶', '熱奶茶', '豆漿', '可樂', '忌廉'], true),
  makeRestaurant('譚仔三哥', '米線', '全港', ['麻辣米線', '酸辣米線', '煳辣米線', '土匪雞翼米線', '三餸米線'], ['凍檸茶', '熱檸水', '豆漿', '可樂'], false),
  makeRestaurant('壽司郎', '日式', '全港', ['三文魚壽司', '吞拿魚壽司', '炙燒壽司拼盤', '拉麵', '炸雞', '甜蝦壽司'], ['綠茶', '可樂', '蘋果汁', '烏龍茶'], false)
]

const chefLines = {
  idle: ['今日食咩？等本喵幫你抽！', '先抽餐廳，再抽菜式，最後飲品喵！'],
  rolling: ['第一轉：餐廳命運啟動喵！', '第二轉：菜式準備上碟！', '第三轉：飲品都要有儀式感！'],
  result: ['喵！今日就食呢個啦！', '命運套餐完成喵！'],
  tap: ['唔好再諗啦，肚餓最大！', '本喵今日想食魚。', '選擇困難？交俾喵主廚！', '再唔食飯就變扁喵。', '今日卡路里由命運負責。']
}

function cryptoId() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }
function makeRestaurant(name, category, district, dishes, drinks, favorite = false) {
  return { id: cryptoId(), name, category, district, note: '', favorite, dishes, drinks }
}
function load(key, fallback) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback } catch { return fallback } }
function save(key, value) { localStorage.setItem(key, JSON.stringify(value)) }
function pickOne(items) { return items.length ? items[Math.floor(Math.random() * items.length)] : null }
function weighted(items, boost) { return boost ? items.flatMap(i => i.favorite ? [i, i, i] : [i]) : items }
function includesExcluded(text, exclusions) { return exclusions.some(w => w.trim() && text.toLowerCase().includes(w.trim().toLowerCase())) }
function parseBulk(text) { return text.split(/\n|,|，/).map(x => x.trim()).filter(Boolean) }

function useStoredState(key, initialValue) {
  const [value, setValue] = useState(() => load(key, initialValue))
  const setter = next => {
    const resolved = typeof next === 'function' ? next(value) : next
    setValue(resolved); save(key, resolved)
  }
  return [value, setter]
}

export default function App() {
  const [tab, setTab] = useState('home')
  const [restaurants, setRestaurants] = useStoredState(STORAGE_KEYS.restaurants, defaultRestaurants)
  const [history, setHistory] = useStoredState(STORAGE_KEYS.history, [])
  const [settings, setSettings] = useStoredState(STORAGE_KEYS.settings, defaultSettings)
  const [exclusions, setExclusions] = useStoredState(STORAGE_KEYS.exclusions, [])
  const [excludeInput, setExcludeInput] = useState('')
  const [status, setStatus] = useState('idle')
  const [chefLine, setChefLine] = useState(chefLines.idle[0])
  const [slots, setSlots] = useState(['🏠 餐廳', '🍱 菜式', '🥤 飲品'])
  const [result, setResult] = useState(null)

  const validRestaurants = restaurants.filter(r => !includesExcluded(`${r.name} ${r.category} ${r.district} ${r.note}`, exclusions))

  function startRoll() {
    const pool = weighted(validRestaurants.filter(r => r.dishes?.length && r.drinks?.length), settings.favoriteBoost)
    if (!pool.length) { setChefLine('喵？可抽餐廳好似空晒，請先加入餐廳、菜式及飲品！'); return }
    setStatus('rolling'); setResult(null)
    let ticks = 0
    const timer = setInterval(() => {
      const r = pickOne(pool)
      const dishPool = (r.dishes || []).filter(d => !includesExcluded(`${r.name} ${d}`, exclusions))
      const drinkPool = (r.drinks || []).filter(d => !includesExcluded(`${r.name} ${d}`, exclusions))
      setSlots([`🏠 ${r.name}`, `🍱 ${pickOne(dishPool) || '神秘菜式'}`, `🥤 ${pickOne(drinkPool) || '神秘飲品'}`])
      setChefLine(chefLines.rolling[Math.min(2, Math.floor(ticks / 10))])
      ticks += 1
      if (ticks > 34) {
        clearInterval(timer)
        const finalRestaurant = pickOne(pool)
        const dishes = (finalRestaurant.dishes || []).filter(d => !includesExcluded(`${finalRestaurant.name} ${d}`, exclusions))
        const drinks = (finalRestaurant.drinks || []).filter(d => !includesExcluded(`${finalRestaurant.name} ${d}`, exclusions))
        const final = { id: cryptoId(), createdAt: new Date().toISOString(), restaurant: finalRestaurant, dish: pickOne(dishes) || '自由配搭', drink: pickOne(drinks) || '清水都得' }
        setSlots([`🏠 ${final.restaurant.name}`, `🍱 ${final.dish}`, `🥤 ${final.drink}`])
        setResult(final); setStatus('result')
        setChefLine(`喵！今日去${final.restaurant.name}，食${final.dish}，飲${final.drink}！`)
        setHistory([final, ...history].slice(0, 30))
      }
    }, 80)
  }

  function addExclusion() {
    const w = excludeInput.trim(); if (!w) return
    setExclusions([...new Set([...exclusions, w])]); setExcludeInput('')
  }
  function tapChef() {
    setChefLine(pickOne(chefLines.tap)); setStatus(s => s === 'rolling' ? 'rolling' : 'tap')
    setTimeout(() => setStatus(result ? 'result' : 'idle'), 650)
  }
  function shareResult() {
    if (!result) return
    const text = `Food Roulette｜今日食咩好\n🏠 ${result.restaurant.name}\n🍱 ${result.dish}\n🥤 ${result.drink}\n${chefLine}`
    if (navigator.share) navigator.share({ title: '今日食咩好', text }).catch(() => {})
    else navigator.clipboard?.writeText(text)
    setChefLine('結果已經準備好分享喵！')
  }

  return <div className="app-shell"><main className="screen">
    <Header />
    {tab === 'home' && <HomePage {...{status, chefLine, slots, result, startRoll, exclusions, excludeInput, setExcludeInput, addExclusion, setExclusions, tapChef, shareResult, restaurants, setTab}} />}
    {tab === 'restaurants' && <RestaurantPage restaurants={restaurants} setRestaurants={setRestaurants} />}
    {tab === 'stats' && <StatsPage history={history} setHistory={setHistory} />}
    {tab === 'settings' && <SettingsPage settings={settings} setSettings={setSettings} restaurants={restaurants} setRestaurants={setRestaurants} />}
  </main><BottomNav tab={tab} setTab={setTab} /></div>
}

function Header() { return <header className="topbar"><div><p className="eyebrow">Chef Meow presents</p><h1>Food Roulette</h1><p>今日食咩好</p></div><div className="logo-badge">🎰</div></header> }
function CatChef({ status, line, onTap }) { return <button className={`cat-chef ${status}`} onClick={onTap}><div className="chef-hat">☁️</div><div className="cat-face"><span className="ear left"/><span className="ear right"/><span className="eyes">● ●</span><span className="mouth">ω</span><span className="whiskers">≋ ≋</span></div><div className="apron">🍳</div><div className="tail">〰</div><div className="spatula">🍳</div><p className="speech">{line}</p></button> }

function HomePage(props) {
  const { status, chefLine, slots, result, startRoll, exclusions, excludeInput, setExcludeInput, addExclusion, setExclusions, tapChef, shareResult, restaurants, setTab } = props
  return <section className="home-grid">
    <div className="hero-card"><CatChef status={status} line={chefLine} onTap={tapChef}/><div className="hero-copy"><p className="pill">三段式抽獎</p><h2>先抽餐廳，再抽菜式，再抽飲品</h2><p>所有菜單以餐廳為主單位儲存，啱晒「今日去邊間＋食咩套餐」玩法。</p></div></div>
    <div className={`slot-machine ${status}`}><div className="slot-title">喵主廚老虎機</div><div className="slots">{slots.map((s,i)=><div className="slot" key={i}><small>{['餐廳','菜式','飲品'][i]}</small><strong>{s}</strong></div>)}</div><button className="primary-btn" onClick={startRoll} disabled={status==='rolling'}>{status==='rolling'?'抽緊喵...':'🎰 開始抽獎'}</button></div>
    <div className="quick-panel"><div className="panel-head"><h3>今日唔想食</h3><span>{exclusions.length} 個排除字</span></div><div className="input-row"><input value={excludeInput} onChange={e=>setExcludeInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addExclusion()} placeholder="例如：辣、飯、可樂"/><button onClick={addExclusion}>加入</button></div><div className="chips">{exclusions.map(w=><button key={w} onClick={()=>setExclusions(exclusions.filter(x=>x!==w))}>✕ {w}</button>)}</div></div>
    {result && <ResultCard result={result} shareResult={shareResult} startRoll={startRoll}/>} 
    <div className="mini-stats"><div><strong>{restaurants.length}</strong><span>餐廳</span></div><div><strong>{restaurants.reduce((a,r)=>a+(r.dishes?.length||0),0)}</strong><span>菜式</span></div><div><strong>{restaurants.reduce((a,r)=>a+(r.drinks?.length||0),0)}</strong><span>飲品</span></div><button onClick={()=>setTab('restaurants')}>管理餐廳</button></div>
  </section>
}
function ResultCard({ result, shareResult, startRoll }) { return <div className="result-card"><p className="eyebrow">🎉 今日推薦</p><h2>{result.restaurant.name}</h2><div className="result-grid"><div><span>🍱 菜式</span><strong>{result.dish}</strong></div><div><span>🥤 飲品</span><strong>{result.drink}</strong></div></div><p className="result-line">喵！呢個組合由命運之鍋新鮮抽出。</p><div className="action-row"><button onClick={startRoll}>🔄 再抽一次</button><button onClick={shareResult}>📤 分享結果</button></div></div> }

function RestaurantPage({ restaurants, setRestaurants }) {
  const [editing, setEditing] = useState(null)
  return <section className="page-stack"><div className="section-head"><div><p className="eyebrow">Database</p><h2>餐廳資料庫</h2><p>以餐廳為主單位，批量輸入菜式及飲品。</p></div><button className="primary-small" onClick={()=>setEditing({ id:null, name:'', category:'快餐', district:'', note:'', favorite:false, dishes:[], drinks:[] })}>＋ 新增餐廳</button></div>
    {editing && <RestaurantEditor item={editing} onCancel={()=>setEditing(null)} onSave={item=>{ if(item.id) setRestaurants(restaurants.map(r=>r.id===item.id?item:r)); else setRestaurants([{...item,id:cryptoId()},...restaurants]); setEditing(null)}} />}
    <div className="cards-list">{restaurants.map(r=><article className="item-card" key={r.id}><div><h3>{r.favorite?'❤️ ':''}{r.name}</h3><p>{r.category}・{r.district || '未設定地區'}</p><p className="subtext">{(r.dishes||[]).length} 款菜式｜{(r.drinks||[]).length} 款飲品</p></div><div className="card-actions"><button onClick={()=>setRestaurants(restaurants.map(x=>x.id===r.id?{...x,favorite:!x.favorite}:x))}>{r.favorite?'取消最愛':'最愛'}</button><button onClick={()=>setEditing(r)}>編輯</button><button className="danger" onClick={()=>setRestaurants(restaurants.filter(x=>x.id!==r.id))}>刪除</button></div><details><summary>查看菜單</summary><p><b>菜式：</b>{(r.dishes||[]).join('、') || '未有'}</p><p><b>飲品：</b>{(r.drinks||[]).join('、') || '未有'}</p></details></article>)}</div>
  </section>
}
function RestaurantEditor({ item, onSave, onCancel }) {
  const [form, setForm] = useState({...item, dishText:(item.dishes||[]).join('\n'), drinkText:(item.drinks||[]).join('\n')})
  function submit(e){ e.preventDefault(); if(!form.name.trim()) return; onSave({...form, name:form.name.trim(), dishes:parseBulk(form.dishText), drinks:parseBulk(form.drinkText)}) }
  return <form className="editor" onSubmit={submit}><h3>{item.id?'編輯餐廳':'新增餐廳'}</h3><div className="form-grid"><label>餐廳名稱<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="例如 麥當勞"/></label><label>分類<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></label><label>地區<input value={form.district} onChange={e=>setForm({...form,district:e.target.value})} placeholder="全港 / 旺角"/></label><label>備註<input value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/></label></div><label className="wide-label">批量菜式<textarea value={form.dishText} onChange={e=>setForm({...form,dishText:e.target.value})} placeholder={'每行一款，例如：\n1號餐 巨無霸餐\n2號餐 麥香雞餐\n炸雞餐'}/></label><label className="wide-label">批量飲品<textarea value={form.drinkText} onChange={e=>setForm({...form,drinkText:e.target.value})} placeholder={'每行一款，例如：\n可樂\n凍檸茶\n熱奶茶'}/></label><label className="check"><input type="checkbox" checked={form.favorite} onChange={e=>setForm({...form,favorite:e.target.checked})}/> 最愛餐廳，提高抽中機率</label><div className="action-row"><button type="submit">保存</button><button type="button" onClick={onCancel}>取消</button></div></form>
}

function StatsPage({ history, setHistory }) {
  const topRestaurants = countTop(history.map(h=>h.restaurant?.name))
  const topDishes = countTop(history.map(h=>h.dish))
  return <section className="page-stack"><div className="section-head"><div><p className="eyebrow">Last 30 rolls</p><h2>統計</h2></div><button className="danger" onClick={()=>setHistory([])}>清空紀錄</button></div><div className="stats-grid"><StatBox title="最常抽中餐廳" data={topRestaurants}/><StatBox title="最常抽中菜式" data={topDishes}/></div><div className="cards-list">{history.map(h=><article className="history-card" key={h.id}><strong>🏠 {h.restaurant?.name}</strong><span>🍱 {h.dish}</span><span>🥤 {h.drink}</span><small>{new Date(h.createdAt).toLocaleString('zh-HK')}</small></article>)}</div></section>
}
function countTop(arr){ return Object.entries(arr.filter(Boolean).reduce((a,x)=>({...a,[x]:(a[x]||0)+1}),{})).sort((a,b)=>b[1]-a[1]).slice(0,5) }
function StatBox({ title, data }) { return <div className="stat-box"><h3>{title}</h3>{data.length?data.map(([name,count])=><div className="bar-row" key={name}><span>{name}</span><b>{count}</b></div>):<p>未有紀錄</p>}</div> }
function SettingsPage({ settings, setSettings, restaurants, setRestaurants }) { return <section className="page-stack"><div className="section-head"><div><p className="eyebrow">Settings</p><h2>設定</h2></div></div><div className="setting-card"><label className="check"><input type="checkbox" checked={settings.favoriteBoost} onChange={e=>setSettings({...settings,favoriteBoost:e.target.checked})}/> 最愛餐廳提高抽中機率</label></div><div className="setting-card"><h3>資料備份</h3><textarea readOnly value={JSON.stringify(restaurants,null,2)} /><button onClick={()=>{localStorage.clear(); setRestaurants(defaultRestaurants); location.reload()}}>重設為預設餐廳</button></div></section> }
function BottomNav({ tab, setTab }) { const tabs=[['home','首頁','🏠'],['restaurants','餐廳庫','🍽️'],['stats','統計','📊'],['settings','設定','⚙️']]; return <nav className="bottom-nav">{tabs.map(([id,label,icon])=><button className={tab===id?'active':''} key={id} onClick={()=>setTab(id)}><span>{icon}</span>{label}</button>)}</nav> }
