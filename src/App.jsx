import React, { useState } from 'react'

const STORAGE_KEYS = {
  restaurants: 'foodRoulette_restaurantMenu_v3_bigSlot',
  history: 'foodRoulette_history_v3_bigSlot',
  settings: 'foodRoulette_settings_v3_bigSlot',
  exclusions: 'foodRoulette_exclusions_v3_bigSlot'
}

const CATEGORIES = ['快餐', '茶餐廳', '日式', '米線', '西式', '中餐', '飲品', '其他']
const defaultSettings = { favoriteBoost: true, vibration: true, slotDelaySeconds: 3 }

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
  idle: ['今日食咩？拉下拉桿，本喵幫你抽！', '今次會先出飲品，再出食品，最後揭曉餐廳喵！'],
  rolling: ['第一轉：今日飲咩先決定喵！', '第二轉：食品開始上碟！', '第三轉：餐廳壓軸揭曉！'],
  result: ['喵！今日就食呢個啦！', '命運套餐完成喵！'],
  tap: ['唔好再諗啦，肚餓最大！', '本喵今日想食魚。', '選擇困難？交俾喵主廚！', '再唔食飯就變扁喵。', '今日卡路里由命運負責。']
}

function cryptoId() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }
function makeRestaurant(name, category, district, dishes, drinks, favorite = false) { return { id: cryptoId(), name, category, district, note: '', favorite, dishes, drinks } }
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
  const [phase, setPhase] = useState(0)
  const [chefLine, setChefLine] = useState(chefLines.idle[0])
  const [slots, setSlots] = useState(['🏠 餐廳', '🍱 食品', '🥤 飲品'])
  const [result, setResult] = useState(null)

  const validRestaurants = restaurants.filter(r => !includesExcluded(`${r.name} ${r.category} ${r.district} ${r.note}`, exclusions))

  function safeVibrate(pattern) {
    if (settings.vibration && navigator.vibrate) navigator.vibrate(pattern)
  }

  function startRoll() {
    const pool = weighted(validRestaurants.filter(r => r.dishes?.length && r.drinks?.length), settings.favoriteBoost)
    if (!pool.length) { setChefLine('喵？可抽餐廳好似空晒，請先加入餐廳、菜式及飲品！'); return }

    const delaySeconds = Math.max(0.5, Number(settings.slotDelaySeconds || 3))
    const stepMs = delaySeconds * 1000
    const finalRestaurant = pickOne(pool)
    const finalDishes = (finalRestaurant.dishes || []).filter(d => !includesExcluded(`${finalRestaurant.name} ${d}`, exclusions))
    const finalDrinks = (finalRestaurant.drinks || []).filter(d => !includesExcluded(`${finalRestaurant.name} ${d}`, exclusions))
    const final = {
      id: cryptoId(),
      createdAt: new Date().toISOString(),
      restaurant: finalRestaurant,
      dish: pickOne(finalDishes) || '自由配搭',
      drink: pickOne(finalDrinks) || '清水都得'
    }

    safeVibrate([60, 40, 60])
    setStatus('rolling'); setResult(null); setPhase(1)
    setChefLine(`第一轉：飲品先揭曉喵！每格相隔 ${delaySeconds} 秒。`)

    let locked = { restaurant: null, dish: null, drink: null }
    const spinTimer = setInterval(() => {
      const r = pickOne(pool)
      const dishPool = (r.dishes || []).filter(d => !includesExcluded(`${r.name} ${d}`, exclusions))
      const drinkPool = (r.drinks || []).filter(d => !includesExcluded(`${r.name} ${d}`, exclusions))
      const preview = {
        restaurant: locked.restaurant || `🏠 ${r.name}`,
        dish: locked.dish || `🍱 ${pickOne(dishPool) || '神秘食品'}`,
        drink: locked.drink || `🥤 ${pickOne(drinkPool) || '神秘飲品'}`
      }
      setSlots([preview.restaurant, preview.dish, preview.drink])
    }, 75)

    const timers = [
      setTimeout(() => {
        locked.drink = `🥤 ${final.drink}`
        setPhase(1)
        setChefLine(`飲品出爐：${final.drink}！下一格到食品喵！`)
        safeVibrate([45, 30, 45])
      }, stepMs),
      setTimeout(() => {
        locked.dish = `🍱 ${final.dish}`
        setPhase(2)
        setChefLine(`食品上碟：${final.dish}！最後揭曉餐廳！`)
        safeVibrate([55, 35, 55])
      }, stepMs * 2),
      setTimeout(() => {
        locked.restaurant = `🏠 ${final.restaurant.name}`
        setPhase(3)
        setChefLine(`餐廳壓軸：${final.restaurant.name}！命運套餐完成喵！`)
        safeVibrate([80, 40, 120])
      }, stepMs * 3),
      setTimeout(() => {
        clearInterval(spinTimer)
        setSlots([`🏠 ${final.restaurant.name}`, `🍱 ${final.dish}`, `🥤 ${final.drink}`])
        setResult(final); setStatus('result'); setPhase(4)
        setChefLine(`喵！今日去${final.restaurant.name}，食${final.dish}，飲${final.drink}！`)
        setHistory(current => [final, ...current].slice(0, 30))
      }, stepMs * 3 + 550)
    ]
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
    const text = `Food Roulette｜今日食咩好\n🥤 ${result.drink}\n🍱 ${result.dish}\n🏠 ${result.restaurant.name}\n${chefLine}`
    if (navigator.share) navigator.share({ title: '今日食咩好', text }).catch(() => {})
    else navigator.clipboard?.writeText(text)
    setChefLine('結果已經準備好分享喵！')
  }

  return <div className="app-shell"><main className="screen">
    <Header />
    {tab === 'home' && <HomePage {...{status, phase, chefLine, slots, result, startRoll, exclusions, excludeInput, setExcludeInput, addExclusion, setExclusions, tapChef, shareResult, restaurants, setTab}} />}
    {tab === 'restaurants' && <RestaurantPage restaurants={restaurants} setRestaurants={setRestaurants} />}
    {tab === 'stats' && <StatsPage history={history} setHistory={setHistory} />}
    {tab === 'settings' && <SettingsPage settings={settings} setSettings={setSettings} restaurants={restaurants} setRestaurants={setRestaurants} />}
  </main><BottomNav tab={tab} setTab={setTab} /></div>
}

function Header() { return <header className="topbar"><button className="round-icon">⚙️</button><div className="brand"><h1>Food Roulette</h1><p>今日食咩？交俾喵主廚決定！</p></div><div className="record-pill">📋 我的紀錄</div></header> }
function CatChef({ status, line, onTap }) { return <button className={`cat-chef ${status}`} onClick={onTap}><div className="chef-hat">☁️</div><div className="cat-face"><span className="ear left"/><span className="ear right"/><span className="eyes">● ●</span><span className="mouth">ω</span><span className="whiskers">≋ ≋</span></div><div className="apron">🍳</div><div className="tail">〰</div><div className="spatula">🍳</div><p className="speech">{line}</p></button> }

function HomePage(props) {
  const { status, phase, chefLine, slots, result, startRoll, exclusions, excludeInput, setExcludeInput, addExclusion, setExclusions, tapChef, shareResult, restaurants, setTab } = props
  return <section className="home-grid">
    <div className="main-showcase">
      <CatChef status={status} line={chefLine} onTap={tapChef}/>
      <div className="machine-zone">
        <div className={`slot-machine big ${status} phase-${phase}`}>
          <div className="machine-lights" aria-hidden="true">{Array.from({length:18}).map((_,i)=><span key={i}/>)}</div>
          <div className="slot-title"><span>🐾</span><b>喵主廚 Chef Meow</b></div>
          <div className="slots big-slots">{slots.map((s,i)=>{ const stopped = (i===2 && phase>=1) || (i===1 && phase>=2) || (i===0 && phase>=3); return <div className={`slot slot-${i} ${stopped?'stopped':''}`} key={i}><small>{['餐廳','食品','飲品'][i]}</small><strong>{s}</strong></div> })}</div>
        </div>
        <button className={`lever ${status}`} onClick={startRoll} disabled={status==='rolling'} aria-label="拉下拉桿開始抽籤"><span className="lever-ball"/><span className="lever-stick"/><b>拉下拉桿<br/>開始抽籤！</b></button>
      </div>
    </div>
    <div className="quick-panel"><div className="panel-head"><h3>今日唔想食</h3><span>{exclusions.length} 個排除字</span></div><div className="input-row"><input value={excludeInput} onChange={e=>setExcludeInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addExclusion()} placeholder="例如：辣、飯、可樂"/><button onClick={addExclusion}>加入</button></div><div className="chips">{exclusions.map(w=><button key={w} onClick={()=>setExclusions(exclusions.filter(x=>x!==w))}>✕ {w}</button>)}</div></div>
    {result && <ResultCard result={result} shareResult={shareResult} startRoll={startRoll}/>} 
    <div className="mini-stats"><div><strong>{restaurants.length}</strong><span>餐廳</span></div><div><strong>{restaurants.reduce((a,r)=>a+(r.dishes?.length||0),0)}</strong><span>食品</span></div><div><strong>{restaurants.reduce((a,r)=>a+(r.drinks?.length||0),0)}</strong><span>飲品</span></div><button onClick={()=>setTab('restaurants')}>管理餐廳</button></div>
  </section>
}
function ResultCard({ result, shareResult, startRoll }) { return <div className="result-card"><p className="eyebrow">🎉 今日推薦</p><h2>{result.restaurant.name}</h2><div className="result-grid"><div><span>🥤 飲品</span><strong>{result.drink}</strong></div><div><span>🍱 食品</span><strong>{result.dish}</strong></div><div><span>🏠 餐廳</span><strong>{result.restaurant.name}</strong></div></div><p className="result-line">喵！飲品、食品、餐廳三連抽完成！</p><div className="action-row"><button onClick={startRoll}>🔄 再拉一次</button><button onClick={shareResult}>📤 分享結果</button></div></div> }

function RestaurantPage({ restaurants, setRestaurants }) {
  const [editing, setEditing] = useState(null)
  return <section className="page-stack"><div className="section-head"><div><p className="eyebrow">Database</p><h2>餐廳資料庫</h2><p>以餐廳為主單位，批量輸入食品及飲品。</p></div><button className="primary-small" onClick={()=>setEditing({ id:null, name:'', category:'快餐', district:'', note:'', favorite:false, dishes:[], drinks:[] })}>＋ 新增餐廳</button></div>
    {editing && <RestaurantEditor item={editing} onCancel={()=>setEditing(null)} onSave={item=>{ if(item.id) setRestaurants(restaurants.map(r=>r.id===item.id?item:r)); else setRestaurants([{...item,id:cryptoId()},...restaurants]); setEditing(null)}} />}
    <div className="cards-list">{restaurants.map(r=><article className="item-card" key={r.id}><div><h3>{r.favorite?'❤️ ':''}{r.name}</h3><p>{r.category}・{r.district || '未設定地區'}</p><p className="subtext">{(r.dishes||[]).length} 款食品｜{(r.drinks||[]).length} 款飲品</p></div><div className="card-actions"><button onClick={()=>setRestaurants(restaurants.map(x=>x.id===r.id?{...x,favorite:!x.favorite}:x))}>{r.favorite?'取消最愛':'最愛'}</button><button onClick={()=>setEditing(r)}>編輯</button><button className="danger" onClick={()=>setRestaurants(restaurants.filter(x=>x.id!==r.id))}>刪除</button></div><details><summary>查看菜單</summary><p><b>食品：</b>{(r.dishes||[]).join('、') || '未有'}</p><p><b>飲品：</b>{(r.drinks||[]).join('、') || '未有'}</p></details></article>)}</div>
  </section>
}
function RestaurantEditor({ item, onSave, onCancel }) {
  const [form, setForm] = useState({...item, dishText:(item.dishes||[]).join('\n'), drinkText:(item.drinks||[]).join('\n')})
  function submit(e){ e.preventDefault(); if(!form.name.trim()) return; onSave({...form, name:form.name.trim(), dishes:parseBulk(form.dishText), drinks:parseBulk(form.drinkText)}) }
  return <form className="editor" onSubmit={submit}><h3>{item.id?'編輯餐廳':'新增餐廳'}</h3><div className="form-grid"><label>餐廳名稱<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="例如 麥當勞"/></label><label>分類<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></label><label>地區<input value={form.district} onChange={e=>setForm({...form,district:e.target.value})} placeholder="全港 / 旺角"/></label><label>備註<input value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/></label></div><label className="wide-label">批量食品<textarea value={form.dishText} onChange={e=>setForm({...form,dishText:e.target.value})} placeholder={'每行一款，例如：\n1號餐 巨無霸餐\n2號餐 麥香雞餐\n炸雞餐'}/></label><label className="wide-label">批量飲品<textarea value={form.drinkText} onChange={e=>setForm({...form,drinkText:e.target.value})} placeholder={'每行一款，例如：\n可樂\n凍檸茶\n熱奶茶'}/></label><label className="check"><input type="checkbox" checked={form.favorite} onChange={e=>setForm({...form,favorite:e.target.checked})}/> 最愛餐廳，提高抽中機率</label><div className="action-row"><button type="submit">保存</button><button type="button" onClick={onCancel}>取消</button></div></form>
}

function StatsPage({ history, setHistory }) {
  const topRestaurants = countTop(history.map(h=>h.restaurant?.name))
  const topDishes = countTop(history.map(h=>h.dish))
  const topDrinks = countTop(history.map(h=>h.drink))
  return <section className="page-stack"><div className="section-head"><div><p className="eyebrow">Last 30 rolls</p><h2>統計</h2></div><button className="danger" onClick={()=>setHistory([])}>清空紀錄</button></div><div className="stats-grid"><StatBox title="最常抽中飲品" data={topDrinks}/><StatBox title="最常抽中食品" data={topDishes}/><StatBox title="最常抽中餐廳" data={topRestaurants}/></div><div className="cards-list">{history.map(h=><article className="history-card" key={h.id}><strong>🥤 {h.drink}</strong><span>🍱 {h.dish}</span><span>🏠 {h.restaurant?.name}</span><small>{new Date(h.createdAt).toLocaleString('zh-HK')}</small></article>)}</div></section>
}
function countTop(arr){ return Object.entries(arr.filter(Boolean).reduce((a,x)=>({...a,[x]:(a[x]||0)+1}),{})).sort((a,b)=>b[1]-a[1]).slice(0,5) }
function StatBox({ title, data }) { return <div className="stat-box"><h3>{title}</h3>{data.length?data.map(([name,count])=><div className="bar-row" key={name}><span>{name}</span><b>{count}</b></div>):<p>未有紀錄</p>}</div> }
function SettingsPage({ settings, setSettings, restaurants, setRestaurants }) { return <section className="page-stack"><div className="section-head"><div><p className="eyebrow">Settings</p><h2>設定</h2></div></div><div className="setting-card"><label className="check"><input type="checkbox" checked={settings.favoriteBoost} onChange={e=>setSettings({...settings,favoriteBoost:e.target.checked})}/> 最愛餐廳提高抽中機率</label><label className="check"><input type="checkbox" checked={settings.vibration} onChange={e=>setSettings({...settings,vibration:e.target.checked})}/> 手機支援時啟用振動特效</label><label className="wide-label">每格抽籤相隔秒數<input type="number" min="0.5" step="0.5" value={settings.slotDelaySeconds || 3} onChange={e=>setSettings({...settings,slotDelaySeconds:Number(e.target.value)})}/><small>預設 3 秒。動畫停止次序固定為：飲品 → 食品 → 餐廳。</small></label></div><div className="setting-card"><h3>資料備份</h3><textarea readOnly value={JSON.stringify(restaurants,null,2)} /><button onClick={()=>{localStorage.clear(); setRestaurants(defaultRestaurants); location.reload()}}>重設為預設餐廳</button></div></section> }
function BottomNav({ tab, setTab }) { const tabs=[['home','首頁','🏠'],['restaurants','餐廳','🍽️'],['stats','統計','📊'],['settings','設定','⚙️']]; return <nav className="bottom-nav">{tabs.map(([id,label,icon])=><button className={tab===id?'active':''} key={id} onClick={()=>setTab(id)}><span>{icon}</span>{label}</button>)}</nav> }
