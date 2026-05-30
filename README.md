# Food Roulette｜今日食咩好 v2

喵主廚三段式抽獎版：先抽餐廳，再抽菜式，再抽飲品。

## 本機測試
```bash
npm install
npm run dev
```

## Vercel
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

## 更新內容
- 資料庫改為以餐廳為主單位
- 每間餐廳可批量輸入菜式及飲品
- 抽獎流程改為：餐廳 → 菜式 → 飲品
- 預設加入麥當勞 1-10 號餐、KFC、大家樂、大快活、一蘭、譚仔等
- 保留喵主廚主持、排除清單、最愛加權、最近 30 次統計
