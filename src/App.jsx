import React, { useMemo, useState } from 'react'

const FOOD_CATEGORIES = ['中餐', '日式', '韓式', '西式', '快餐', '茶餐廳', '甜品', '飲品']
const STORAGE_KEYS = {
  foods: 'foodRoulette_foods_v1',
  restaurants: 'foodRoulette_restaurants_v1',
  history: 'foodRoulette_history_v1',
  settings: 'foodRoulette_settings_v1',
  exclusions: 'foodRoulette_exclusions_v1'
}

const defaultFoods = [
  { id: cryptoId(), name: '拉麵', emoji: '🍜', category: '日式', favorite: true },
  { id: cryptoId(), name: '壽司', emoji: '🍣', category: '日式', favorite: false },
  { id: cryptoId(), name: '漢堡', emoji: '🍔', category: '快餐', favorite: false },
  { id: cryptoId(), name: 'Pizza', emoji: '🍕', category: '西式', favorite: false },
  { id: cryptoId(), name: '燒味飯', emoji: '🍚', category: '茶餐廳', favorite: true },
  { id: cryptoId(), name: '火鍋', emoji: '🍲', category: '中餐', favorite: false },
  { id: cryptoId(), name: '炸雞', emoji: '🍗', category: '快餐', favorite: false },
  { id: cryptoId(), name: '甜品', emoji: '🍰', category: '甜品', favorite: false }
]

const defaultRestaurants = [
  { id: cryptoId(), name: '麥當勞', category: '快餐', district: '全港', note: '快靚正', favorite: false },
  { id: cryptoId(), name: '譚仔', category: '茶餐廳', district: '全港', note: '米線之神', favorite: true },
  { id: cryptoId(), name: '壽司郎', category: '日式', district: '全港', note: '想食魚就啱', favorite: false },
  { id: cryptoId(), name: '大家樂', category: '茶餐廳', district: '全港', note: '穩陣之選', favorite: false },
  { id: cryptoId(), name: '太興', category: '茶餐廳', district: '全港', note: '燒味好朋友', favorite: false },
  { id: cryptoId(), name: '一蘭', category: '日式', district: '尖沙咀', note: '拉麵儀式感', favorite: true },
  { id: cryptoId(), name: 'KFC', category: '快餐', district: '全港', note: '炸雞召喚', favorite: false },
  { id: cryptoId(), name: 'Pizza Hut', category: '西式', district: '全港', note: '芝士萬歲', favorite: false }
]

const defaultSettings = {
  mode: 'both',
  favoriteBoost: true
}

const chefLines = {
  idle: ['今日食咩？等本喵幫你抽！', '交俾喵主廚，選擇困難即刻退散！'],
  rolling: ['轉緊喵！轉緊喵！', '命運之鍋開始沸騰！', '今晚食咩，即將揭曉！'],
  result: ['喵！今日就食呢個啦！', '命運已經上菜喵！', '本喵宣布：呢個組合好掂！'],
  tap: ['唔好再諗啦，肚餓最大！', '本喵今日想食魚。', '選擇困難？交俾喵主廚！', '再唔食飯就變扁喵。', '今日卡路里由命運負責。']
}

const foodJokes = {
  拉麵: '熱辣辣一碗，治癒度爆燈。',
  漢堡: '減肥？聽日先講啦。',
  壽司: '壽司之神今日揀中咗你。',
  Pizza: '芝士永遠唔會背叛你。',
  火鍋: '一開爐，所有煩惱都熟晒。',
  炸雞: '脆皮聲係快樂嘅 BGM。'
}

function cryptoId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function weightedList(items, boost) {
  if (!boost) return items
  return items.flatMap(item => item.favorite ? [item, item, item] : [item])
}

function pickOne(items) {
  if (!items.length) return null
  return items[Math.floor(Math.random() * items.length)]
}

function isExcluded(item, exclusions) {
  const joined = Object.values(item).join(' ').toLowerCase()
  return exclusions.some(word => word.trim() && joined.includes(word.trim().toLowerCase()))
}

export default function App() {
  const [tab, setTab] = useState('home')
  const [foods, setFoods] = useStoredState(STORAGE_KEYS.foods, defaultFoods)
  const [restaurants, setRestaurants] = useStoredState(STORAGE_KEYS.restaurants, defaultRestaurants)
  const [history, setHistory] = useStoredState(STORAGE_KEYS.history, [])
  const [settings, setSettings] = useStoredState(STORAGE_KEYS.settings, defaultSettings)
  const [exclusions, setExclusions] = useStoredState(STORAGE_KEYS.exclusions, [])
  const [excludeInput, setExcludeInput] = useState('')
  const [status, setStatus] = useState('idle')
  const [chefLine, setChefLine] = useState(chefLines.idle[0])
  const [result, setResult] = useState(null)
  const [slots, setSlots] = useState(['🍜', '拉麵', '一蘭'])
  const [editing, setEditing] = useState(null)

  const filteredFoods = foods.filter(item => !isExcluded(item, exclusions))
  const filteredRestaurants = restaurants.filter(item => !isExcluded(item, exclusions))

  function startRoll() {
    const foodPool = weightedList(filteredFoods, settings.favoriteBoost)
    const restaurantPool = weightedList(filteredRestaurants, settings.favoriteBoost)
    if ((settings.mode !== 'restaurant' && !foodPool.length) || (settings.mode !== 'food' && !restaurantPool.length)) {
      setChefLine('喵？名單好似畀你排除晒，請加返啲選項！')
      return
    }

    setStatus('rolling')
    setResult(null)
    const line = pickOne(chefLines.rolling)
    setChefLine(line)

    let ticks = 0
    const timer = setInterval(() => {
      const f = pickOne(foodPool) || pickOne(defaultFoods)
      const r = pickOne(restaurantPool) || pickOne(defaultRestaurants)
      setSlots([
        f?.emoji || '🎲',
        settings.mode === 'restaurant' ? '餐廳命運' : f?.name || '神秘美食',
        settings.mode === 'food' ? '今日自己揀店' : r?.name || '神秘餐廳'
      ])
      ticks += 1
      if (ticks > 24) {
        clearInterval(timer)
        const finalFood = settings.mode === 'restaurant' ? null : pickOne(foodPool)
        const finalRestaurant = settings.mode === 'food' ? null : pickOne(restaurantPool)
        const finalResult = {
          id: cryptoId(),
          createdAt: new Date().toISOString(),
          food: finalFood,
          restaurant: finalRestaurant,
          mode: settings.mode
        }
        setSlots([
          finalFood?.emoji || '🏠',
          finalFood?.name || '只抽餐廳',
          finalRestaurant?.name || '只抽食物'
        ])
        setResult(finalResult)
        setStatus('result')
        setChefLine(buildResultLine(finalResult))
        const nextHistory = [finalResult, ...history].slice(0, 30)
        setHistory(nextHistory)
      }
    }, 90)
  }

  function buildResultLine(res) {
    if (res.food?.name) return `喵！今日食${res.food.name}，一定無錯！`
    if (res.restaurant?.name) return `喵！今日去${res.restaurant.name}，命運已經訂枱！`
    return pickOne(chefLines.result)
  }

  function addExclusion() {
    const word = excludeInput.trim()
    if (!word) return
    setExclusions([...new Set([...exclusions, word])])
    setExcludeInput('')
  }

  function tapChef() {
    setChefLine(pickOne(chefLines.tap))
    setStatus(prev => prev === 'rolling' ? 'rolling' : 'tap')
    setTimeout(() => setStatus(result ? 'result' : 'idle'), 650)
  }

  function toggleFavorite(type, id) {
    if (type === 'food') setFoods(foods.map(item => item.id === id ? { ...item, favorite: !item.favorite } : item))
    if (type === 'restaurant') setRestaurants(restaurants.map(item => item.id === id ? { ...item, favorite: !item.favorite } : item))
  }

  function shareResult() {
    if (!result) return
    const text = `Food Roulette｜今日食咩好\n${result.food ? `${result.food.emoji} ${result.food.name}` : ''}${result.restaurant ? `｜🏠 ${result.restaurant.name}` : ''}\n${chefLine}`
    if (navigator.share) navigator.share({ title: '今日食咩好', text }).catch(() => {})
    else navigator.clipboard?.writeText(text)
    setChefLine('結果已經準備好分享喵！')
  }

  return (
    <div className="app-shell">
      <main className="screen">
        <Header />
        {tab === 'home' && (
          <HomePage
            status={status}
            chefLine={chefLine}
            slots={slots}
            result={result}
            startRoll={startRoll}
            exclusions={exclusions}
            excludeInput={excludeInput}
            setExcludeInput={setExcludeInput}
            addExclusion={addExclusion}
            setExclusions={setExclusions}
            tapChef={tapChef}
            shareResult={shareResult}
            setTab={setTab}
          />
        )}
        {tab === 'foods' && <LibraryPage type="food" title="食物庫" items={foods} setItems={setFoods} editing={editing} setEditing={setEditing} toggleFavorite={toggleFavorite} />}
        {tab === 'restaurants' && <LibraryPage type="restaurant" title="餐廳庫" items={restaurants} setItems={setRestaurants} editing={editing} setEditing={setEditing} toggleFavorite={toggleFavorite} />}
        {tab === 'stats' && <StatsPage history={history} setHistory={setHistory} />}
        {tab === 'settings' && <SettingsPage settings={settings} setSettings={setSettings} foods={foods} restaurants={restaurants} setFoods={setFoods} setRestaurants={setRestaurants} />}
      </main>
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  )
}

function useStoredState(key, initialValue) {
  const [value, setValue] = useState(() => load(key, initialValue))
  const setter = next => {
    const resolved = typeof next === 'function' ? next(value) : next
    setValue(resolved)
    save(key, resolved)
  }
  return [value, setter]
}

function Header() {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Chef Meow presents</p>
        <h1>Food Roulette</h1>
        <p>今日食咩好</p>
      </div>
      <div className="logo-badge">🎰</div>
    </header>
  )
}

function CatChef({ status, line, onTap }) {
  return (
    <button className={`cat-chef ${status}`} onClick={onTap} aria-label="喵主廚">
      <div className="speech">{line}</div>
      <div className="cat-body">
        <div className="hat"><span></span></div>
        <div className="ears"><i></i><i></i></div>
        <div className="face">
          <b className="eye left"></b><b className="eye right"></b>
          <span className="nose">▽</span>
          <small>ω</small>
        </div>
        <div className="apron">MEOW</div>
        <div className="paw paw-left">🐾</div>
        <div className="spatula">🍳</div>
        <div className="tail"></div>
      </div>
    </button>
  )
}

function HomePage(props) {
  const { status, chefLine, slots, result, startRoll, exclusions, excludeInput, setExcludeInput, addExclusion, setExclusions, tapChef, shareResult, setTab } = props
  return (
    <section className="home-grid">
      <CatChef status={status} line={chefLine} onTap={tapChef} />
      <div className={`slot-machine ${status}`}>
        <div className="machine-lights"><span></span><span></span><span></span><span></span></div>
        <div className="slot-window">
          {slots.map((slot, idx) => <div className="slot-reel" key={`${slot}-${idx}`}>{slot}</div>)}
        </div>
        <button className="primary-btn" onClick={startRoll} disabled={status === 'rolling'}>{status === 'rolling' ? '抽緊喵...' : '🎰 開始抽獎'}</button>
      </div>

      <div className="quick-card">
        <h3>今日唔想食</h3>
        <div className="input-row">
          <input value={excludeInput} onChange={e => setExcludeInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addExclusion()} placeholder="例如：辣、火鍋、飯" />
          <button onClick={addExclusion}>加入</button>
        </div>
        <div className="chips">
          {exclusions.length === 0 && <span className="muted">未有排除字眼</span>}
          {exclusions.map(word => <button className="chip" key={word} onClick={() => setExclusions(exclusions.filter(x => x !== word))}>✕ {word}</button>)}
        </div>
      </div>

      {result && <ResultCard result={result} onRoll={startRoll} onShare={shareResult} setTab={setTab} />}
    </section>
  )
}

function ResultCard({ result, onRoll, onShare, setTab }) {
  const joke = result.food?.name ? (foodJokes[result.food.name] || '你個胃今日已經決定咗。') : '餐廳命運已經拍板。'
  return (
    <div className="result-card pop-in">
      <p className="eyebrow">🎉 今日推薦</p>
      <div className="result-main">
        {result.food && <div><span>{result.food.emoji}</span><strong>{result.food.name}</strong><small>{result.food.category}</small></div>}
        {result.restaurant && <div><span>🏠</span><strong>{result.restaurant.name}</strong><small>{result.restaurant.district || result.restaurant.category}</small></div>}
      </div>
      <p className="joke">{joke}</p>
      <div className="action-row">
        <button onClick={onRoll}>🔄 再抽一次</button>
        <button onClick={() => setTab('foods')}>❤️ 加入最愛</button>
        <button onClick={onShare}>📤 分享結果</button>
      </div>
    </div>
  )
}

function LibraryPage({ type, title, items, setItems, editing, setEditing, toggleFavorite }) {
  const empty = type === 'food'
    ? { name: '', emoji: '🍽️', category: '中餐', favorite: false }
    : { name: '', category: '茶餐廳', district: '', note: '', favorite: false }
  const [form, setForm] = useState(empty)
  const currentEdit = editing?.type === type ? editing.id : null

  function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    if (currentEdit) {
      setItems(items.map(item => item.id === currentEdit ? { ...item, ...form, name: form.name.trim() } : item))
      setEditing(null)
    } else {
      setItems([{ ...form, id: cryptoId(), name: form.name.trim() }, ...items])
    }
    setForm(empty)
  }

  function edit(item) {
    setEditing({ type, id: item.id })
    setForm({ ...empty, ...item })
  }

  return (
    <section className="page-stack">
      <div className="section-title"><h2>{title}</h2><p>{type === 'food' ? '管理今日食咩選項' : '管理餐廳名單'}</p></div>
      <form className="editor-card" onSubmit={submit}>
        {type === 'food' && <input value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })} placeholder="Emoji" />}
        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={type === 'food' ? '食物名稱' : '餐廳名稱'} />
        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{FOOD_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
        {type === 'restaurant' && <><input value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} placeholder="地區" /><input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="備註" /></>}
        <label className="check-line"><input type="checkbox" checked={form.favorite} onChange={e => setForm({ ...form, favorite: e.target.checked })} /> 設為最愛</label>
        <button className="primary-btn">{currentEdit ? '儲存修改' : '新增'}</button>
      </form>
      <div className="list-card">
        {items.map(item => (
          <article className="list-item" key={item.id}>
            <div className="item-icon">{type === 'food' ? item.emoji : '🏠'}</div>
            <div><strong>{item.name}</strong><small>{item.category}{item.district ? `｜${item.district}` : ''}{item.note ? `｜${item.note}` : ''}</small></div>
            <button className="ghost" onClick={() => toggleFavorite(type, item.id)}>{item.favorite ? '❤️' : '🤍'}</button>
            <button className="ghost" onClick={() => edit(item)}>改</button>
            <button className="ghost danger" onClick={() => setItems(items.filter(x => x.id !== item.id))}>刪</button>
          </article>
        ))}
      </div>
    </section>
  )
}

function SettingsPage({ settings, setSettings, foods, restaurants, setFoods, setRestaurants }) {
  return (
    <section className="page-stack">
      <div className="section-title"><h2>設定</h2><p>調整抽獎模式及機率</p></div>
      <div className="setting-card">
        <label>抽獎模式</label>
        <select value={settings.mode} onChange={e => setSettings({ ...settings, mode: e.target.value })}>
          <option value="both">食物＋餐廳模式</option>
          <option value="food">只抽食物模式</option>
          <option value="restaurant">只抽餐廳模式</option>
        </select>
        <label className="switch-line"><input type="checkbox" checked={settings.favoriteBoost} onChange={e => setSettings({ ...settings, favoriteBoost: e.target.checked })} /> 最愛優先，提高抽中機率</label>
      </div>
      <div className="setting-card danger-zone">
        <h3>資料管理</h3>
        <button onClick={() => setFoods(defaultFoods)}>重設食物庫</button>
        <button onClick={() => setRestaurants(defaultRestaurants)}>重設餐廳庫</button>
        <p>現有：{foods.length} 款食物、{restaurants.length} 間餐廳。</p>
      </div>
    </section>
  )
}

function StatsPage({ history, setHistory }) {
  const foodStats = useMemo(() => countBy(history.map(x => x.food?.name).filter(Boolean)), [history])
  const restaurantStats = useMemo(() => countBy(history.map(x => x.restaurant?.name).filter(Boolean)), [history])
  const categoryStats = useMemo(() => countBy(history.flatMap(x => [x.food?.category, x.restaurant?.category]).filter(Boolean)), [history])
  return (
    <section className="page-stack">
      <div className="section-title"><h2>統計</h2><p>最近 30 次抽獎紀錄</p></div>
      <div className="stats-grid">
        <StatBox title="最常抽中食物" data={foodStats} />
        <StatBox title="最常抽中餐廳" data={restaurantStats} />
        <StatBox title="最常抽中分類" data={categoryStats} />
      </div>
      <div className="list-card">
        <div className="history-head"><h3>最近紀錄</h3><button className="ghost danger" onClick={() => setHistory([])}>清空</button></div>
        {history.length === 0 && <p className="muted">未有抽獎紀錄</p>}
        {history.map(item => <article className="history-item" key={item.id}><b>{item.food?.emoji || '🏠'} {item.food?.name || '只抽餐廳'}</b><span>{item.restaurant?.name || '只抽食物'}</span><small>{new Date(item.createdAt).toLocaleString('zh-HK')}</small></article>)}
      </div>
    </section>
  )
}

function countBy(values) {
  const map = values.reduce((acc, v) => ({ ...acc, [v]: (acc[v] || 0) + 1 }), {})
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5)
}

function StatBox({ title, data }) {
  const max = Math.max(1, ...data.map(x => x[1]))
  return <div className="stat-box"><h3>{title}</h3>{data.length === 0 ? <p className="muted">未有資料</p> : data.map(([name, count]) => <div className="bar-row" key={name}><span>{name}</span><div><i style={{ width: `${count / max * 100}%` }}></i></div><b>{count}</b></div>)}</div>
}

function BottomNav({ tab, setTab }) {
  const tabs = [
    ['home', '🏠', '首頁'], ['foods', '🍜', '食物庫'], ['restaurants', '🏠', '餐廳庫'], ['stats', '📊', '統計'], ['settings', '⚙️', '設定']
  ]
  return <nav className="bottom-nav">{tabs.map(([id, icon, label]) => <button className={tab === id ? 'active' : ''} onClick={() => setTab(id)} key={id}><span>{icon}</span>{label}</button>)}</nav>
}
