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
  const [quickAiStatus, setQuickAiStatus] = useState('')
  const [quickAiDishes, setQuickAiDishes] = useState('')
  const [quickAiPreview, setQuickAiPreview] = useState('')
  const [quickAiRestaurant, setQuickAiRestaurant] = useState(null)
  const blankRestaurant = { id:null, name:'', category:'快餐', district:'', note:'', favorite:false, dishes:[], drinks:[] }

  function saveRestaurant(item) {
    if (item.id) setRestaurants(restaurants.map(r => r.id === item.id ? item : r))
    else setRestaurants([{ ...item, id: cryptoId() }, ...restaurants])
    setEditing(null)
  }

  function patchRestaurant(id, patch) {
    setRestaurants(restaurants.map(r => r.id === id ? { ...r, ...patch } : r))
  }

  async function quickAnalyze(file) {
    if (!file) return
    setQuickAiStatus('AI 分析中喵⋯手機/電腦都可用，請保持頁面開啟。')
    setQuickAiPreview('')
    try {
      const result = await analyzeMenuImageFile(file)
      const inferred = inferRestaurantFromText(result.text, file?.name)
      setQuickAiRestaurant(inferred)
      setQuickAiPreview(result.text.slice(0, 1200))
      if (!result.dishes.length) {
        setQuickAiStatus('暫時未辨識到菜式名稱。請試用更清晰、正面、光線足夠的餐牌相。')
        return
      }
      setQuickAiDishes(result.dishes.join('\n'))
      setQuickAiStatus(`已生成預覽：${inferred.name || '未命名餐廳'}，共 ${result.dishes.length} 款菜式。請按「加入新增餐廳頁面」檢查後保存。`)
    } catch (error) {
      console.error(error)
      setQuickAiStatus('AI 圖片分析未能完成。請檢查網絡，或先手動貼上菜式名稱。')
    }
  }

  function createRestaurantFromAi() {
    const inferred = quickAiRestaurant || blankRestaurant
    setEditing({ ...blankRestaurant, ...inferred, dishText: quickAiDishes, dishes: parseBulk(quickAiDishes), drinks: inferred.drinks || [], drinkText: (inferred.drinks || []).join('\n') })
    setTimeout(() => document.querySelector('.editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }

  return <section className="page-stack restaurant-page">
    <div className="section-head restaurant-head">
      <div>
        <p className="eyebrow">Database</p>
        <h2>餐廳資料庫</h2>
        <p>以餐廳為主單位，批量輸入食品及飲品。手機及電腦都可直接修改菜單。</p>
      </div>
      <button className="primary-small add-restaurant-btn" onClick={()=>setEditing(blankRestaurant)}>＋ 新增餐廳</button>
    </div>

    <div className="ai-hero-card">
      <div>
        <p className="eyebrow">AI MENU SCAN</p>
        <h3>📷 一鍵輸入餐廳及菜單</h3>
        <p>上傳或拍攝餐牌，系統會生成「餐廳＋菜式」預覽；進入新增餐廳頁面後，由你確認再保存。</p>
      </div>
      <div className="ai-upload-actions hero-actions">
        <label className="upload-box ai-hero-upload">
          📷 開啟相機拍餐牌
          <input type="file" accept="image/*" capture="environment" onChange={e=>quickAnalyze(e.target.files?.[0])}/>
        </label>
        <label className="upload-box ai-hero-upload secondary">
          🖼️ 上傳餐牌圖片
          <input type="file" accept="image/*" onChange={e=>quickAnalyze(e.target.files?.[0])}/>
        </label>
      </div>
      {quickAiStatus && <p className="ocr-status">{quickAiStatus}</p>}
      {quickAiDishes && <div className="ai-result-box ai-preview-card">
        <div className="preview-title"><span>生成預覽</span><strong>{quickAiRestaurant?.name || '未命名餐廳'}</strong></div>
        <label>AI 生成菜式名稱<textarea value={quickAiDishes} onChange={e=>setQuickAiDishes(e.target.value)} /></label>
        <button type="button" onClick={createRestaurantFromAi}>加入新增餐廳頁面，檢查後保存</button>
      </div>}
      {quickAiPreview && <details className="ocr-preview"><summary>查看 AI 讀到的原始文字</summary><pre>{quickAiPreview}</pre></details>}
    </div>

    {editing && <RestaurantEditor
      item={editing}
      onCancel={()=>setEditing(null)}
      onSave={saveRestaurant}
    />}

    <div className="cards-list restaurant-cards">
      {restaurants.map(r => <RestaurantCard
        key={r.id}
        restaurant={r}
        onPatch={patch => patchRestaurant(r.id, patch)}
        onEdit={()=>setEditing(r)}
        onDelete={()=>setRestaurants(restaurants.filter(x=>x.id!==r.id))}
      />)}
    </div>
  </section>
}

function RestaurantCard({ restaurant: r, onPatch, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [newDish, setNewDish] = useState('')
  const [newDrink, setNewDrink] = useState('')
  const dishes = r.dishes || []
  const drinks = r.drinks || []

  function uniq(list) { return [...new Set(list.map(x => String(x).trim()).filter(Boolean))] }
  function addDish() { const value = newDish.trim(); if (!value) return; onPatch({ dishes: uniq([...dishes, value]) }); setNewDish('') }
  function addDrink() { const value = newDrink.trim(); if (!value) return; onPatch({ drinks: uniq([...drinks, value]) }); setNewDrink('') }
  function renameDish(index, value) { const next = [...dishes]; next[index] = value.trim(); onPatch({ dishes: uniq(next) }) }
  function renameDrink(index, value) { const next = [...drinks]; next[index] = value.trim(); onPatch({ drinks: uniq(next) }) }
  function removeDish(index) { onPatch({ dishes: dishes.filter((_, i) => i !== index) }) }
  function removeDrink(index) { onPatch({ drinks: drinks.filter((_, i) => i !== index) }) }

  return <article className={`item-card restaurant-card compact-restaurant-card ${expanded ? 'expanded' : ''}`}>
    <button className="restaurant-summary-button" type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
      <div className="restaurant-summary-name">
        <h3>{r.name}</h3>
      </div>
      <div className="restaurant-summary-actions" onClick={e => e.stopPropagation()}>
        <button type="button" className={`fav-chip ${r.favorite ? 'active' : ''}`} onClick={()=>onPatch({ favorite: !r.favorite })}>{r.favorite?'❤️ 已最愛':'🤍 加入最愛'}</button>
        <span className="expand-hint">{expanded ? '收起 ▲' : '查看菜單 ▼'}</span>
      </div>
    </button>

    {expanded && <div className="restaurant-expanded-panel">
      <div className="restaurant-meta-row">
        <span>{r.category || '未分類'}</span>
        <span>{r.district || '未設定地區'}</span>
        <span>{dishes.length} 款食品</span>
        <span>{drinks.length} 款飲品</span>
      </div>
      {r.note && <p className="restaurant-note">{r.note}</p>}
      <div className="expanded-action-row">
        <button type="button" className="edit-menu-btn" onClick={onEdit}>✏️ 完整編輯 / AI</button>
        <button type="button" className="danger" onClick={onDelete}>刪除餐廳</button>
      </div>
      <div className="menu-edit-panel expanded-menu-panel">
        <div className="menu-edit-title">
          <h4>餐廳菜單修改</h4>
          <span>可即時新增、改名、刪除菜式及飲品</span>
        </div>
        <div className="menu-edit-grid">
          <InlineMenuEditor
            title="菜式"
            items={dishes}
            value={newDish}
            setValue={setNewDish}
            addItem={addDish}
            renameItem={renameDish}
            removeItem={removeDish}
            placeholder="新增菜式，例如：焗豬扒飯"
          />
          <InlineMenuEditor
            title="飲品"
            items={drinks}
            value={newDrink}
            setValue={setNewDrink}
            addItem={addDrink}
            renameItem={renameDrink}
            removeItem={removeDrink}
            placeholder="新增飲品，例如：凍檸茶"
          />
        </div>
      </div>
    </div>}
  </article>
}

function InlineMenuEditor({ title, items, value, setValue, addItem, renameItem, removeItem, placeholder }) {
  return <div className="inline-menu-editor">
    <div className="panel-head"><h4>{title}</h4><span>{items.length} 項</span></div>
    <div className="input-row compact"><input value={value} onChange={e=>setValue(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); addItem()}}} placeholder={placeholder}/><button type="button" onClick={addItem}>加入</button></div>
    <div className="editable-list compact-list">
      {items.length ? items.map((name, index) => <div className="editable-row" key={`${name}-${index}`}>
        <input defaultValue={name} onBlur={e=>renameItem(index, e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); e.currentTarget.blur()}}}/>
        <button type="button" className="danger" onClick={()=>removeItem(index)}>刪除</button>
      </div>) : <p className="empty-note">未有{title}</p>}
    </div>
  </div>
}

function RestaurantEditor({ item, onSave, onCancel }) {
  const [form, setForm] = useState({...item, dishText:(item.dishes||[]).join('\n'), drinkText:(item.drinks||[]).join('\n')})
  const [ocrStatus, setOcrStatus] = useState('')
  const [ocrPreview, setOcrPreview] = useState('')
  const [newDish, setNewDish] = useState('')
  const [newDrink, setNewDrink] = useState('')
  const dishes = parseBulk(form.dishText)
  const drinks = parseBulk(form.drinkText)

  function updateDishList(next) { setForm(f => ({...f, dishText: next.join('\n')})) }
  function updateDrinkList(next) { setForm(f => ({...f, drinkText: next.join('\n')})) }
  function addDish() { const value = newDish.trim(); if (!value) return; updateDishList([...new Set([...dishes, value])]); setNewDish('') }
  function addDrink() { const value = newDrink.trim(); if (!value) return; updateDrinkList([...new Set([...drinks, value])]); setNewDrink('') }
  function removeDish(name) { updateDishList(dishes.filter(x => x !== name)) }
  function removeDrink(name) { updateDrinkList(drinks.filter(x => x !== name)) }
  function renameDish(oldName, nextName) { const value = nextName.trim(); if (!value) return; updateDishList(dishes.map(x => x === oldName ? value : x)) }
  function renameDrink(oldName, nextName) { const value = nextName.trim(); if (!value) return; updateDrinkList(drinks.map(x => x === oldName ? value : x)) }

  async function analyzeMenuImage(file) {
    if (!file) return
    setOcrStatus('AI 分析中喵⋯首次使用需要下載辨識模型，請等一等。')
    setOcrPreview('')
    try {
      const result = await analyzeMenuImageFile(file)
      setOcrPreview(result.text.slice(0, 1200))
      const extracted = result.dishes
      if (!extracted.length) {
        setOcrStatus('暫時未辨識到菜式名稱。可以換一張較清晰、正面、光線足夠的餐牌相再試。')
        return
      }
      const merged = [...new Set([...dishes, ...extracted])]
      updateDishList(merged)
      setOcrStatus(`已自動加入 ${extracted.length} 款菜式到「批量食品」喵！飲品不會自動填入。`)
    } catch (error) {
      console.error(error)
      setOcrStatus('圖片分析未能完成。請檢查網絡，或直接把餐牌文字貼入批量食品。')
    }
  }

  function submit(e){
    e.preventDefault()
    if(!form.name.trim()) return
    onSave({...form, name:form.name.trim(), dishes:parseBulk(form.dishText), drinks:parseBulk(form.drinkText)})
  }

  return <form className="editor" onSubmit={submit}>
    <h3>{item.id?'編輯餐廳':'新增餐廳'}</h3>
    <div className="form-grid">
      <label>餐廳名稱<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="例如 麥當勞"/></label>
      <label>分類<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></label>
      <label>地區<input value={form.district} onChange={e=>setForm({...form,district:e.target.value})} placeholder="全港 / 旺角"/></label>
      <label>備註<input value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/></label>
    </div>

    <div className="ai-panel">
      <div>
        <p className="eyebrow">AI menu scan</p>
        <h4>拍照 / 上傳餐牌，自動加入菜式</h4>
        <p>系統會用圖片文字辨識擷取菜式名稱，並只填入「批量食品」。飲品請在下方飲品區自行輸入。</p>
      </div>
      <div className="ai-upload-actions">
        <label className="upload-box">
          📷 開啟相機拍餐牌
          <input type="file" accept="image/*" capture="environment" onChange={e=>analyzeMenuImage(e.target.files?.[0])}/>
        </label>
        <label className="upload-box secondary">
          🖼️ 上傳餐牌圖片
          <input type="file" accept="image/*" onChange={e=>analyzeMenuImage(e.target.files?.[0])}/>
        </label>
      </div>
      {ocrStatus && <p className="ocr-status">{ocrStatus}</p>}
      {ocrPreview && <details className="ocr-preview"><summary>查看 AI 讀到的原始文字</summary><pre>{ocrPreview}</pre></details>}
    </div>

    <label className="wide-label">批量食品<textarea value={form.dishText} onChange={e=>setForm({...form,dishText:e.target.value})} placeholder={'每行一款，例如：\n1號餐 巨無霸餐\n2號餐 麥香雞餐\n炸雞餐'}/></label>
    <MenuItemManager title="已輸入菜式" items={dishes} value={newDish} setValue={setNewDish} addItem={addDish} removeItem={removeDish} renameItem={renameDish} placeholder="新增單一菜式" />

    <label className="wide-label">批量飲品<textarea value={form.drinkText} onChange={e=>setForm({...form,drinkText:e.target.value})} placeholder={'每行一款，例如：\n可樂\n凍檸茶\n熱奶茶'}/></label>
    <MenuItemManager title="已輸入飲品" items={drinks} value={newDrink} setValue={setNewDrink} addItem={addDrink} removeItem={removeDrink} renameItem={renameDrink} placeholder="新增單一飲品" />

    <label className="check"><input type="checkbox" checked={form.favorite} onChange={e=>setForm({...form,favorite:e.target.checked})}/> 最愛餐廳，提高抽中機率</label>
    <div className="action-row"><button type="submit">保存</button><button type="button" onClick={onCancel}>取消</button></div>
  </form>
}

function MenuItemManager({ title, items, value, setValue, addItem, removeItem, renameItem, placeholder }) {
  return <div className="menu-manager">
    <div className="panel-head"><h4>{title}</h4><span>{items.length} 項</span></div>
    <div className="input-row"><input value={value} onChange={e=>setValue(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); addItem()}}} placeholder={placeholder}/><button type="button" onClick={addItem}>加入</button></div>
    <div className="editable-list">
      {items.length ? items.map(name => <div className="editable-row" key={name}>
        <input defaultValue={name} onBlur={e=>renameItem(name, e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); e.currentTarget.blur()}}}/>
        <button type="button" className="danger" onClick={()=>removeItem(name)}>刪除</button>
      </div>) : <p className="empty-note">未有資料</p>}
    </div>
  </div>
}


function inferRestaurantFromText(text, filename = '') {
  const lower = `${text || ''} ${filename || ''}`.toLowerCase()
  const known = [
    ['麥當勞','快餐'], ['mcdonald','快餐'], ['mcdonalds','快餐'], ['kfc','快餐'], ['肯德基','快餐'],
    ['大家樂','茶餐廳'], ['café de coral','茶餐廳'], ['cafe de coral','茶餐廳'], ['大快活','茶餐廳'], ['fairwood','茶餐廳'],
    ['一蘭','日式'], ['ichiran','日式'], ['譚仔三哥','米線'], ['譚仔','米線'], ['tamjai','米線'], ['壽司郎','日式'], ['sushiro','日式']
  ]
  for (const [key, category] of known) {
    if (lower.includes(key.toLowerCase())) {
      const cleanName = key === 'mcdonald' || key === 'mcdonalds' ? '麥當勞' : key === 'café de coral' || key === 'cafe de coral' ? '大家樂' : key === 'fairwood' ? '大快活' : key === 'ichiran' ? '一蘭' : key === 'tamjai' ? '譚仔' : key === 'sushiro' ? '壽司郎' : key
      return { name: cleanName, category, district: '全港', note: '由 AI 餐牌分析生成，請保存前檢查。', favorite: false }
    }
  }
  const lines = String(text || '').split(/\n|\r/).map(x => x.trim()).filter(Boolean)
  const candidate = lines.find(line => line.length >= 2 && line.length <= 16 && !/[0-9$＄￥¥]|套餐|優惠|價格|價錢|menu/i.test(line))
  return { name: candidate || '', category: '其他', district: '', note: '由 AI 餐牌分析生成，請保存前檢查。', favorite: false }
}

async function analyzeMenuImageFile(file) {
  const { createWorker } = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js')
  const worker = await createWorker('chi_tra+eng')
  const { data } = await worker.recognize(file)
  await worker.terminate()
  const text = data?.text || ''
  return { text, dishes: extractDishNames(text) }
}

function extractDishNames(text) {
  const drinkWords = ['可樂','雪碧','七喜','咖啡','奶茶','檸茶','檸水','茶','水','果汁','豆漿','啤酒','汽水','飲品','凍飲','熱飲','朱古力','奶昔','烏龍','綠茶','百事','忌廉']
  const noiseWords = ['優惠','套餐','餐牌','menu','price','價錢','加一','服務費','供應','外賣','堂食','圖片','港幣','hkd','地址','電話','掃碼','付款','訂購']
  return [...new Set(text
    .split(/\n|\r|\t| {2,}|,|，|、|\|/)
    .map(line => line
      .replace(/[０-９]/g, d => String.fromCharCode(d.charCodeAt(0)-0xFEE0))
      .replace(/[$＄￥¥]?\s*\d+(?:\.\d+)?\s*(?:元|蚊|起|\/位)?/gi, '')
      .replace(/^[\s\-–—•●○▪▫*#]*(?:[A-Z]|\d+|[一二三四五六七八九十]+)[\).、．:：\-\s]*/i, '')
      .replace(/[|｜·•●★☆✓✔︎]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim())
    .filter(line => line.length >= 2 && line.length <= 28)
    .filter(line => !/^\d+$/.test(line))
    .filter(line => !drinkWords.some(w => line.includes(w)))
    .filter(line => !noiseWords.some(w => line.toLowerCase().includes(w.toLowerCase())))
  )].slice(0, 80)
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
