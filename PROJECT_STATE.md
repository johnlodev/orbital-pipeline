# Orbital Pipeline — 專案狀態規格文件

> **最後更新**：2026-04-07  
> **版本**：0.0.0 (MVP)  
> **維護者**：開發團隊 + AI 助手協作

---

## 1. 專案總覽與目的

**Orbital Pipeline** 是一套為 **MetaAge（邁達特）** 打造的 **Microsoft CSP 授權商機管理系統（CRM Pipeline）**，用於追蹤、管理和分析微軟雲端與地端產品的銷售商機。系統採用 **AIBS / CAIP 雙軌模式**，分別管理一般授權商機與 Azure CAIP 商機。

### 核心價值

| 面向 | 說明 |
|------|------|
| 雙軌管理 | **AIBS List**（一般授權）與 **CAIP List**（Azure CAIP）雙軌分流 |
| 商機管理 | 追蹤商機從 L1 (初始接觸) → L4 (成交) 的完整生命週期 |
| 產品分類 | 涵蓋 Azure、Modern Work (M365)、On-Premise 三大產品線 |
| 角色分權 | Sales / PM / SuperAdmin / Guest 四層 RBAC 權限 |
| 數據儀表板 | 9 種圖表 + Azure 進階篩選 + 情境動態切換的智慧 Dashboard |
| 字典驅動 | 所有選項（人員、產品、階段、Segment…）皆由 Supabase 字典表驅動，支援動態擴充 |

---

## 2. 技術棧 (Tech Stack)

### 前端

| 技術 | 版本 | 用途 |
|------|------|------|
| **React** | 19.2.4 | UI 框架 |
| **Vite** | 8.0.1 | 建置工具 + Dev Server |
| **Tailwind CSS** | 4.2.2 | Utility-first CSS 框架（使用 `@theme` 指令） |
| **Framer Motion** | — | Spring 動畫引擎（Drawer / Modal / AuthScreen） |
| **Chart.js** | 4.5.1 | 圖表引擎 |
| **react-chartjs-2** | 5.3.1 | Chart.js React 包裝器 |
| **chartjs-plugin-datalabels** | 2.2.0 | 圖表數據標籤 |
| **@phosphor-icons/react** | 2.1.10 | Icon 圖示庫 |
| **clsx + tailwind-merge** | — | `cn()` 工具函式（`src/utils/cn.js`） |

### 後端 / BaaS

| 技術 | 用途 |
|------|------|
| **Supabase** (supabase-js 2.99.3) | 認證(Auth)、PostgreSQL 資料庫、RLS |

### 字型

- **Inter** (400/500/600/700) — 英文主字型
- **Noto Sans TC** (400/500/600/700) — 中文字型
- 透過 Google Fonts CDN 載入 (`index.html`)

### 開發工具

| 工具 | 版本 |
|------|------|
| ESLint | 9.39.4 |
| @vitejs/plugin-react | 6.0.1 |
| eslint-plugin-react-hooks | 7.0.1 |

---

## 3. 系統架構與資料夾結構

```
orbital-pipeline/
├── index.html                  # SPA 入口，載入 Google Fonts + Favicon
├── package.json                # 依賴與 scripts
├── vite.config.js              # Vite 設定（React + Tailwind 插件）
├── tailwind.config.js          # Tailwind 擴展（Fluent 色系 + 字型）
├── eslint.config.js            # ESLint 9 flat config
├── backup_index.html           # 舊版單檔 HTML 原型（保留備份）
├── PROJECT_STATE.md            # 本文件
│
├── public/                     # 靜態資源
│   ├── favicon.ico / .svg / .png  # 多格式 Favicon
│   ├── mtglogo.png             # MetaAge 品牌 Logo
│   ├── site.webmanifest        # PWA manifest
│   └── _redirects              # Netlify SPA 重導規則
│
└── src/
    ├── main.jsx                # React 19 掛載點（StrictMode）
    ├── App.jsx                 # 根元件：Auth Gate + 資料層 + 路由 (388 行)
    ├── index.css               # Tailwind @theme 主題定義 + 全域樣式 (.glass/.dot-pattern/.shimmer)
    ├── App.css                 # （目前未使用）
    │
    ├── assets/
    │   ├── hero.png            # 登入畫面 Hero 圖片
    │   ├── react.svg           # React logo
    │   └── vite.svg            # Vite logo
    │
    ├── components/
    │   ├── AuthScreen.jsx      # 登入 / 註冊 / 忘記密碼 (247 行)
    │   ├── Sidebar.jsx         # 側邊欄導航 — AIBS/CAIP/Dashboard (215 行)
    │   ├── Header.jsx          # 頁首元件（目前由 PipelineTable 自含 header）(84 行)
    │   ├── PipelineTable.jsx   # 主資料表格（核心元件）(1147 行)
    │   ├── RecordDrawer.jsx    # 右側抽屜表單（新增/編輯，CAIP Q1-Q4 auto-sum）(628 行)
    │   ├── Dashboard.jsx       # 儀表板 9 圖表 + Azure 情境篩選 (653 行)
    │   ├── SettingsModal.jsx   # 字典管理 Modal (402 行)
    │   ├── ImportWizardModal.jsx  # 資料匯入精靈 (407 行)
    │   ├── AdminPanel.jsx      # 權限管理面板 (245 行)
    │   └── Badges.jsx          # Badge 元件系統 (101 行)
    │
    └── utils/
        ├── supabaseClient.js   # Supabase 連線（讀 env 變數）(4 行)
        ├── mockData.js         # 字典預設值 + 50 筆 Mock 商機資料 (98 行)
        ├── constants.js        # 全域常數（USD_EXCHANGE_RATE = 30）(3 行)
        └── cn.js               # clsx + tailwind-merge 的 cn() 工具 (5 行)
```

---

## 4. 核心元件詳細說明

### 4.1 `App.jsx` — 應用根元件 (388 行)

**職責**：Auth Gate、全域狀態管理、資料 CRUD、Supabase 互動中樞、AIBS/CAIP 雙軌路由。

```
App (Auth Gate)
 └─ AuthenticatedApp
     ├── State: dbData, dictionary, session, permissions, customColumns, currentView
     ├── Supabase CRUD: fetchData, handleSaveRecord, handleDeleteRecord...
     ├── Dictionary: fetchDictionary, seedDefaultDictionary
     ├── builtinKeys: ['sales','pm','reqType','product','stage','segment']
     ├── viewMode: currentView → 'aibs' | 'caip'（由 Sidebar 切換）
     ├── RBAC: userRole 推算 (pm/sales/guest)
     └── 子元件渲染 (Sidebar, PipelineTable, Dashboard, AdminPanel, Drawers, Modals)
```

**關鍵機制**：

- **DB ↔ Frontend 欄位映射**：`fromDbRecord()` / `toDbRecord()` — DB 用 `reqtype` (小寫)，前端用 `reqType` (camelCase)
- **RBAC 角色推算**：比對 `session.user.email` 與 `dictionary.pm` / `dictionary.sales` 的 `email` 欄位
- **字典自動 Seed**：首次啟動若 `dictionaries` 表為空，自動寫入 `mockData.js` 的預設值
- **viewMode 導向**：CAIP 模式下 product 欄位強制為 `'Azure'`，RecordDrawer 顯示 CAIP 專屬欄位

### 4.2 `PipelineTable.jsx` — 主資料表格 (1147 行)

**職責**：商機資料的完整表格檢視、操作介面。AIBS / CAIP 雙軌動態欄位。

| 功能 | 說明 |
|------|------|
| 雙軌模式 | 標題動態顯示 `AIBS List` / `CAIP List`，CAIP 有額外欄位 |
| 欄位拖曳排序 | Drag & Drop 調整欄位順序 |
| 欄位寬度調整 | 拖曳 resize + 雙擊自動 auto-fit |
| 分頁籤 (Tabs) | 可新增/刪除/重新命名/拖曳排序（localStorage 持久化） |
| 欄位顯示切換 | 勾選控制哪些欄位可見 |
| 搜尋與篩選 | 文字搜尋 + 多維度 filter (Type/Product/Stage/PM/Date/Segment/ACR months) |
| Double-click 編輯 | 子行雙擊自動開啟 RecordDrawer |
| Smart Expand/Collapse | 有勾選時僅展開/收合選取群組，否則全部 |
| Inline 編輯 | reqType 欄位直接用 `<select>` 切換 |
| 批次操作 | 全選 / 批次刪除 |
| 匯出 | CSV / 剪貼簿匯出 |
| 自訂欄位 | 動態新增自訂 column |
| RBAC | Sales 僅看自己的資料、Guest 唯讀 |
| Sticky Columns | EU / Partner 欄位固定不捲動（opaque 背景防鬼影） |

**CAIP 專屬欄位**：segment, disti_name, sales_stage, referral_id, acr_start_month, acr_mom, jul~jun（12 個月）, q1~q4

**篩選維度**：Type, Product (Cat.), Stage, PM, Date Range, Segment（CAIP）, ACR months/quarters 正值過濾（CAIP）

**欄位預設寬度**：EU/Partner 180, Type 100, Cat. 130, SKU 260, QTY 90, NTM 140, POD 120

**關鍵函式**：
- `getNameFromDict(dictKey, code)` — 字典 code → label 查詢
- `renderCell(row, colKey)` — 各欄位的渲染策略（包含 Badge 元件呼叫）
- Cat. filter 動態依 viewMode 過濾：AIBS 排除 Azure，CAIP 僅 Azure

### 4.3 `Badges.jsx` — Badge 元件系統 (101 行)

**職責**：統一的色彩標記元件，用於 Type / Product / Stage 等欄位的視覺化呈現。

**設計模式 — Code-Based Case-Insensitive 色彩匹配**：

```
1. 每個 Badge 接受 { code, label } 兩個 prop
2. 顏色透過 code.toString().trim().toLowerCase() 在 colorMap 中查找
3. 若 code 不在已知 colorMap → 自動 Hash 分配色彩（BADGE_PALETTE，8 色）
4. 顯示的文字優先用 label，fallback 到 code
```

**已定義的色彩對應表**：

| 類別 | Code → 色彩 |
|------|-------------|
| **TYPE** | 新購 → teal、增購 → rose、移轉/轉移/transfer → amber |
| **PRODUCT** | azure → blue、mw/modern work → indigo、on-prem/on-premise → cyan |
| **STAGE** | l1 → zinc、l2 → amber、l3 → orange、l4 → emerald |

**Hash 色彩分配**：`hashCode(text.toLowerCase()) % BADGE_PALETTE.length`，確保同一個 code 無論字典怎麼改，顏色都固定一致。

**匯出元件**：

| 元件 | props | 用途 |
|------|-------|------|
| `TypeBadge` | `{ code, label }` | 類型欄位 |
| `ProductBadge` | `{ code, label, text }` | 產品欄位（text 為 legacy 向後相容） |
| `DynamicBadge` | `{ code, label, text }` | 通用動態 Badge |
| `StageBadge` | `{ stage, label }` | 階段欄位 |

### 4.4 `Dashboard.jsx` — 儀表板 (653 行)

**職責**：商機數據的多維度視覺化分析，含 Azure 情境智慧篩選與動態圖表切換。

**KPI 數字卡片（4 個）**：

| 指標 | 說明 |
|------|------|
| 預估總商機 (NTM) | 篩選後的金額加總 |
| 符合條件案件數 | 篩選後的筆數 |
| 授權總數量 (QTY) | 篩選後的數量加總 |
| 平均案件金額 | NTM ÷ 案件數 |

**圖表清單（9 個）**：

| # | ID | 標題 | 圖表類型 | 說明 |
|---|-----|------|----------|------|
| 1 | trend | Weekly Pipeline Trend | Line | 預估結單週趨勢 |
| 2 | type | 需求類型占比 (Type) | Doughnut | 新購/增購/移轉分布 |
| 3 | product | 產品金額占比 (Cat.) | Doughnut | 產品線金額佔比 → Azure 篩選時動態切換為 **Azure 類型佔比 (Segment)** |
| 4 | stage | 階段金額占比 (Stage) | Bar | L1~L4 各階段金額分布 |
| 5 | eu | Top 5 (EU) | Bar (水平) | 金額貢獻最高的 5 家客戶 |
| 6 | partner | Top 5 (Partner) | Bar (水平) | 金額貢獻最高的 5 家代理商 |
| 7 | sales | Forecast (Sales) | Bar (垂直) | 各業務人員預估業績 |
| 8 | pm | 專案負責總額 (PM) | Bar (垂直) | 各 PM 負責總額分布 |
| 9 | sku | Top 10 (SKU) | Bar (水平) | 熱門 SKU 金額排名 |

**篩選系統**：

| 維度 | 類型 | 說明 |
|------|------|------|
| 文字搜尋 | text | 全欄位搜尋 |
| 日期區間 | date range | 起始/結束日期 |
| Type | checkbox multi | 需求類型 |
| Product (Cat.) | checkbox multi | 產品線 |
| Stage | checkbox multi | 階段 |
| Sales | checkbox multi | 業務人員 |
| PM | checkbox multi | PM |

**Azure 進階篩選條件**（僅當 Product 包含 Azure 時出現）：

| 維度 | 類型 | 說明 |
|------|------|------|
| Segment | checkbox multi | Enterprise / SMB / Government / Education（從字典載入） |
| Quarters | checkbox (Q1-Q4) | 篩選該季度金額 > 0 的記錄 |
| Months | checkbox (Jul-Jun) | 篩選該月份金額 > 0 的記錄 |

**情境動態圖表切換**：當 `filterProducts` 包含 `'Azure'` 時，`isAzureFiltered = true`，第 3 號 Doughnut 圖自動從「產品金額占比」切換為「Azure 類型佔比 (Segment)」，以 Segment 維度分析 Azure 營收。

**特性**：
- 圖表可動態隱藏/顯示（CHART_DEFS 勾選菜單）
- 支援獨立篩選條件（不影響 PipelineTable）
- RBAC 權限控制圖表可見性
- 使用字典 label 作為圖表標籤
- `DashFilterGroup` 可複用篩選元件（label + items + checkbox）

### 4.5 `RecordDrawer.jsx` — 右側抽屜表單 (628 行)

**職責**：新增與編輯商機紀錄的滑出面板，支援 AIBS / CAIP 雙軌模式。

| 功能 | 說明 |
|------|------|
| 新增模式 | 空白表單，必填欄位驗證 |
| 編輯模式 | 預填現有資料，白色卡片包裹 |
| 字典下拉 | 所有 select 使用 `dictionary` prop |
| 自訂欄位 | 動態載入 `customColumns` |
| 刪除 | 編輯模式下可刪除此筆 |
| CAIP 專屬區塊 | Text Keys + Num Keys 獨立區段 |
| Q1-Q4 自動加總 | 月度數值 → 季度自動累計 |
| NTM 自動計算 | Q1+Q2+Q3+Q4 → NTM |

**CAIP 欄位定義**：

| 常數 | 包含欄位 |
|------|---------|
| `CAIP_TEXT_KEYS` | segment, disti_name, sales_stage, referral_id, acr_start_month |
| `CAIP_NUM_KEYS` | acr_mom, jul~jun（12 月）, q1~q4 |

**Segment 欄位**：以 `<select required>` 呈現（從 `dictionary.segment` 載入選項），非文字輸入。

**視覺風格**：面板 `bg-slate-50`，表單 `bg-slate-50`，編輯模式欄位以白色卡片包裹。輸入框 `text-[15px] py-2.5`。Section titles `text-sm font-semibold`。

### 4.6 `SettingsModal.jsx` — 字典管理 (402 行)

**職責**：管理系統字典的 CRUD 介面，所有操作同步至 Supabase。

| 功能 | 說明 |
|------|------|
| 內建分類 | Sales / PM / Type / Cat. / Stage / **Segment**（6 個 BUILTIN_TITLES） |
| 新增項目 | 寫入 Supabase `dictionaries` 表 |
| 編輯項目 | 修改 label / code / email |
| 刪除項目 | 從 DB 中移除 |
| 拖曳排序 | 拖曳行項目調整 `sort_order` |
| 自訂類別 | 新增/刪除自訂字典分類 |

**BUILTIN_TITLES**：
```js
{ sales: 'Sales', pm: 'PM', reqType: 'Type', product: 'Cat.', stage: 'Stage', segment: 'Segment' }
```

**`__meta__` 機制**：自訂類別的顯示名稱存放在 `dictionaries` 表中 `code = '__meta__'` 的特殊行，`label` 存放中文標題。

### 4.7 `AuthScreen.jsx` — 認證畫面 (247 行)

| 功能 | 說明 |
|------|------|
| 登入 | Supabase `signInWithPassword` |
| 註冊 | 限 `@metaage.com.tw` 網域 |
| 忘記密碼 | `resetPasswordForEmail` |
| 記住帳號 | localStorage 儲存 email |

**視覺風格**：dot-pattern 背景 + 玻璃態 (glassmorphism) 卡片 + Framer Motion AnimatePresence 動畫。

### 4.8 `Sidebar.jsx` — 側邊欄 (215 行)

| 功能 | 說明 |
|------|------|
| 導航 | **AIBS List** / **CAIP List** / **Dashboard** 三項 |
| 權限管理 | SuperAdmin 限定的入口 |
| 密碼變更 | 3 步驟 Modal（原密碼驗證 → 新密碼輸入 → Supabase 更新）|
| 登出 | Supabase `signOut` |

**視覺風格**：Fluent Design 淺色主題 — `bg-white border-r border-slate-200`，Active 狀態 `bg-blue-50`。字重 `font-medium` 鎖定。所有狀態過渡使用 `transition-colors`（非 `transition-all`，防抖動）。

### 4.9 `AdminPanel.jsx` — 權限管理 (245 行)

**職責**：SuperAdmin 專屬的使用者權限管理面板。

| 功能 | 說明 |
|------|------|
| 使用者列表 | 從 `user_permissions` 表載入 |
| 權限修改 | 角色指派與權限切換 |
| 新增/刪除使用者 | 寫入 `user_permissions` 表 |

### 4.10 `ImportWizardModal.jsx` — 匯入精靈 (360 行)

| 功能 | 說明 |
|------|------|
| 資料來源 | 支援貼上 CSV / TSV 文字 |
| 欄位對應 | 自動偵測 + 手動修正 |
| 驗證 | 檢查字典合法性 |
| 匯入 | 批次寫入 Supabase |
| 範本下載 | 提供 CSV 格式範本 |

---

## 5. 資料流向 (Data Flow) 與狀態管理

### 5.1 架構概觀

本專案使用 **React useState + Props Drilling** 模式，所有全域狀態集中在 `App.jsx` 的 `AuthenticatedApp` 元件。

```
                      ┌──────────────────────────────────────┐
                      │          Supabase (PostgreSQL)        │
                      │  ┌────────────┐  ┌──────────────────┐│
                      │  │  pipeline   │  │  dictionaries    ││
                      │  │  (商機資料)  │  │  (字典資料)      ││
                      │  └──────┬─────┘  └────────┬─────────┘│
                      │         │                  │          │
                      │  ┌──────┴──────────────────┴────┐    │
                      │  │     user_permissions          │    │
                      │  │     (使用者權限)              │    │
                      │  └───────────────┬──────────────┘    │
                      └─────────────────┼────────────────────┘
                                        │
                      ┌─────────────────▼────────────────────┐
                      │            App.jsx                    │
                      │  ┌─────────────────────────────────┐ │
                      │  │ State:                           │ │
                      │  │  - dbData[]          (商機陣列)  │ │
                      │  │  - dictionary{}      (字典物件)  │ │
                      │  │  - session           (Auth 狀態) │ │
                      │  │  - userRole          (角色推算)  │ │
                      │  │  - currentUserPermissions        │ │
                      │  │  - customColumns[]   (自訂欄位)  │ │
                      │  └─────────────────────────────────┘ │
                      └──┬──────┬──────┬──────┬──────┬───────┘
                         │      │      │      │      │
              ┌──────────┘  ┌───┘  ┌───┘  ┌───┘  ┌───┘
              ▼             ▼      ▼      ▼      ▼
         Sidebar     Pipeline  Dashboard Record  Settings
                      Table              Drawer   Modal
```

### 5.2 資料 CRUD 流程

```
[新增商機]
  RecordDrawer → onSave(record)
    → App.handleSaveRecord()
    → toDbRecord()    (reqType → reqtype)
    → supabase.insert()
    → fetchData()     (refetch all)
    → fromDbRecord()  (reqtype → reqType)
    → setDbData()

[Inline 更新]
  PipelineTable → onUpdateRecord(id, field, value)
    → App.handleUpdateRecord()
    → Optimistic UI update (setDbData)
    → supabase.update()
    → 失敗時 rollback (fetchData)

[刪除]
  PipelineTable/RecordDrawer → onDelete(id)
    → App.handleDeleteRecord()
    → supabase.delete()
    → fetchData()

[批次刪除]
  PipelineTable → onBatchDelete([ids])
    → App.handleBatchDeleteRecords()
    → 逐筆 supabase.delete()
    → 統計成功/失敗 → 單次 alert
    → fetchData()
```

### 5.3 字典資料流

```
[啟動載入]
  App.useEffect → fetchDictionary()
    → supabase.from('dictionaries').select('*')
    → 若表為空 → seedDefaultDictionary() (從 mockData 寫入)
    → flat rows → grouped object:
        {
          sales:   [{ label, code, email, _dbId }, ...],
          pm:      [{ label, code, email, _dbId }, ...],
          reqType: [...],
          product: [...],
          stage:   [...],
          segment: [{ label:'Enterprise', code:'Enterprise' }, ...],
          myCustomCat: [...]   ← 自訂類別
        }
    → __meta__ 行 → array._title = "自訂類別中文名"
    → setDictionary()

[字典使用]
  dictionary prop 向下傳遞至：
    → PipelineTable (篩選、renderCell、getNameFromDict)
    → RecordDrawer  (下拉選單，含 segment <select>)
    → Dashboard     (圖表標籤 + Azure 情境 Segment 圖)
    → SettingsModal (CRUD，含 Segment 內建分頁)
    → ImportWizardModal (驗證)
```

### 5.4 RBAC 權限模型

```
角色推算 (App.jsx):
  session.user.email
    → match dictionary.pm[].email     → role: 'pm'     (看全部)
    → match dictionary.sales[].email  → role: 'sales'  (看自己)
    → 都不匹配                         → role: 'guest'  (唯讀)

權限細控 (user_permissions 表):
  currentUserPermissions.role === 'SuperAdmin'
    → 可進入 AdminPanel
    → 可管理其他使用者權限

PipelineTable 中:
  - Sales: 僅看到 row.sales === userRole.code 的資料
  - PM: 看到所有資料
  - Guest: 看到所有資料但無法操作
```

---

## 6. Supabase 資料庫結構

### 6.1 `pipeline` 表

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | UUID (PK) | 自動產生 |
| `enduser` | text | 客戶名稱 |
| `reqtype` | text | 類型 (注意: DB 小寫，前端 camelCase) |
| `si` | text | 系統整合商 |
| `product` | text | 產品分類 code |
| `sku` | text | 產品 SKU |
| `quantity` | integer | 數量 |
| `amount` | numeric | 金額 (NTD) |
| `date` | date | 預計成交日 |
| `stage` | text | 階段 (L1-L4) |
| `sales` | text | 業務 code |
| `pm` | text | PM code |
| `notes` | text | 備註 |
| `created_at` | timestamptz | 建立時間 |
| `created_by_email` | text | 建立者 email |

### 6.2 `dictionaries` 表

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | UUID (PK) | 自動產生 |
| `category` | text | 類別 key (sales/pm/reqtype/product/stage/自訂) |
| `label` | text | 顯示名稱（`__meta__` 行存類別標題） |
| `code` | text | 程式代碼（`__meta__` 為特殊標記） |
| `email` | text | 人員 email (僅 sales/pm 有值) |
| `sort_order` | integer | 排序順序 |

**特殊機制**：`code = '__meta__'` 的行不作為選項，而是儲存自訂類別的中文顯示名稱。

### 6.3 `user_permissions` 表

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | UUID (PK) | 自動產生 |
| `email` | text | 使用者 email |
| `role` | text | 角色 (SuperAdmin / 其他) |
| *(其他權限欄位)* | boolean | 各功能權限旗標 |

---

## 7. 設計系統與 UI 規範

### 7.1 色彩系統

**基底**：Microsoft Fluent Design 淺色主題

| Token | 色碼 | 用途 |
|-------|------|------|
| `fluent-bg` | `#F8FAFC` | 頁面背景 |
| `fluent-hover` | `#f3f2f1` | Hover 背景 |
| `fluent-border` | `#e1dfdd` | 邊框 |
| `fluent-text` | `#323130` | 主要文字 |
| `fluent-muted` | `#605e5c` | 次要文字 |
| `brand-500` | `#0078d4` | Microsoft 品牌藍 |
| `brand-600` | `#005a9e` | 深品牌藍 |
| `surface` / `surface-raised` / `surface-overlay` | — | 層級面 |

**Shadow Token 系統**：

| Token | 用途 |
|-------|------|
| `--shadow-soft-xs` | 最淡陰影 |
| `--shadow-soft-sm` | 卡片預設 |
| `--shadow-soft` | Hover 提升 |
| `--shadow-soft-md` | 彈出層 |
| `--shadow-soft-lg` | Modal/Drawer |
| `--shadow-glow-brand` | 品牌色光暈 |

**圓角 Token**：`--radius-card (1rem)`, `--radius-button`, `--radius-badge`, `--radius-full`

**自訂 CSS Classes**：

| Class | 說明 |
|-------|------|
| `.glass` | 玻璃態毛玻璃背景效果 |
| `.dot-pattern` | 圓點背景圖 |
| `.shimmer` | 按鈕光掃動畫 |

### 7.2 Badge 色彩配置

參見 [第 4.3 節](#43-badgesjsx--badge-元件系統-91-行)。

### 7.3 版面結構

```
┌─────────────────────────────────────────────────┐
│ Browser Viewport (h-screen)                      │
│ ┌────────┬──────────────────────────────────────┐│
│ │Sidebar │  Main Content Area                    ││
│ │(可收合) │  ┌────────────────────────────────┐  ││
│ │        │  │ Header (inline in PipelineTable)│  ││
│ │ Nav    │  ├────────────────────────────────┤  ││
│ │        │  │                                │  ││
│ │ ─ 總表 │  │  PipelineTable / Dashboard     │  ││
│ │ ─ Dashboard│  / AdminPanel                  │  ││
│ │ ─ 設定 │  │                                │  ││
│ │        │  │                                │  ││
│ │ ───── │  └────────────────────────────────┘  ││
│ │ 用戶區 │                                      ││
│ └────────┴──────────────────────────────────────┘│
│            ┌─────────────────┐                    │
│            │ RecordDrawer    │ (Slide-in from R)  │
│            │ SettingsModal   │ (Overlay)          │
│            │ ImportWizardModal│ (Overlay)         │
│            └─────────────────┘                    │
└─────────────────────────────────────────────────┘
```

---

## 8. 程式碼撰寫風格 (Coding Conventions)

### 8.1 一般規範

| 項目 | 規範 |
|------|------|
| 語言 | JavaScript (JSX)，無 TypeScript |
| 模組系統 | ES Modules (`import`/`export`) |
| 元件 | Function Components + Hooks |
| 狀態管理 | `useState` + Props Drilling（無 Context/Redux） |
| CSS | Tailwind CSS utility classes（不寫自訂 CSS） |
| 命名 | camelCase 變數/函式、PascalCase 元件 |
| 資料夾 | `components/` 扁平結構、`utils/` 共用工具 |

### 8.2 Tailwind 使用規範

- 使用 Tailwind CSS v4 的 `@theme` 指令定義 design token（`src/index.css`）
- 自訂色彩使用語意化名稱：`fluent-*`、`brand-*`
- 間距、字級、圓角等皆用 Tailwind utility，不寫 `style={}`
- 響應式使用 `lg:`、`md:` prefix

### 8.3 Supabase 互動模式

- 所有 DB 操作集中在 `App.jsx`
- 寫入後一律 `await fetchData()` 重新拉取（非 optimistic-only）
- 錯誤處理：`try/catch` + `alert()` 通知使用者 + `console.error`
- Optimistic UI：`handleUpdateRecord` 先更新本地，失敗時 rollback

### 8.4 字典 Prop 傳遞模式

```jsx
// App.jsx 傳出
<PipelineTable dictionary={dictionary} ... />

// 子元件接收並設定 fallback
const dictData = dictionary || defaultDictData;

// 使用時安全存取
(dictData.product || []).map(opt => ...)
```

---

## 9. 環境變數

需在專案根目錄建立 `.env` 檔（或 `.env.local`），包含：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...
```

---

## 10. 開發指令

```bash
npm install          # 安裝依賴
npm run dev          # 啟動開發伺服器 (Vite)
npm run build        # 生產環境建置
npm run preview      # 預覽建置結果
npm run lint         # ESLint 檢查
```

---

## 11. 已完成功能清單

| # | 功能 | 狀態 |
|---|------|------|
| 1 | Supabase Auth (登入/註冊/登出) | ✅ 完成 |
| 2 | 忘記密碼 Modal | ✅ 完成 |
| 3 | 密碼變更 Modal (Sidebar) | ✅ 完成 |
| 4 | 限定 @metaage.com.tw 註冊 | ✅ 完成 |
| 5 | 記住 Email (localStorage) | ✅ 完成 |
| 6 | Pipeline CRUD (新增/編輯/刪除) | ✅ 完成 |
| 7 | Inline 欄位更新 (reqType) | ✅ 完成 |
| 8 | 批次刪除（單次 alert） | ✅ 完成 |
| 9 | CSV/TSV 匯入精靈 | ✅ 完成 |
| 10 | CSV / 剪貼簿匯出 | ✅ 完成 |
| 11 | 欄位拖曳排序 | ✅ 完成 |
| 12 | 欄位寬度調整 + 雙擊 auto-fit | ✅ 完成 |
| 13 | 分頁籤 (Tabs) 管理 + localStorage 持久化 | ✅ 完成 |
| 14 | 多維度篩選 (Type/Product/Stage/PM/Date/Segment/ACR) | ✅ 完成 |
| 15 | 全文搜尋 | ✅ 完成 |
| 16 | 自訂欄位 | ✅ 完成 |
| 17 | 字典 Supabase 持久化 | ✅ 完成 |
| 18 | 字典首次自動 Seed | ✅ 完成 |
| 19 | 自訂字典類別 (__meta__ 機制) | ✅ 完成 |
| 20 | 字典項目拖曳排序 | ✅ 完成 |
| 21 | Badge code-based 色彩匹配 (含移轉/轉移/transfer alias) | ✅ 完成 |
| 22 | Dashboard 9 圖表 + Azure 情境篩選 + 動態圖表切換 | ✅ 完成 |
| 23 | RBAC 權限 (Sales/PM/Guest/SuperAdmin) | ✅ 完成 |
| 24 | AdminPanel 使用者權限管理 | ✅ 完成 |
| 25 | Fluent Design 淺色主題 + 設計 Token 系統 | ✅ 完成 |
| 26 | Google Fonts (Inter + Noto Sans TC) | ✅ 完成 |
| 27 | PWA Manifest + Favicon | ✅ 完成 |
| 28 | AIBS / CAIP 雙軌系統（DB 欄位 + Sidebar + Table + Drawer） | ✅ 完成 |
| 29 | CAIP Q1-Q4 自動加總 + NTM 自動計算 | ✅ 完成 |
| 30 | Modern UI 大改造（所有元件現代化 + Framer Motion 動畫） | ✅ 完成 |
| 31 | Anti-Jitter（全域 transition-all → transition-colors 替換） | ✅ 完成 |
| 32 | Anti-Snowblind（bg-slate-50 + 白色卡片層次） | ✅ 完成 |
| 33 | Sticky Column 防鬼影（opaque 背景） | ✅ 完成 |
| 34 | Double-click 編輯 + Smart Expand/Collapse | ✅ 完成 |
| 35 | Segment 字典整合（SettingsModal 分頁 + RecordDrawer select + 篩選） | ✅ 完成 |
| 36 | Dashboard Azure 進階篩選（Segment/Quarters/Months） | ✅ 完成 |
| 37 | Dashboard 情境動態圖表切換（Cat. ↔ Segment Doughnut） | ✅ 完成 |
| 38 | Dashboard 全域文案精煉 | ✅ 完成 |

---

## 12. 已知待辦事項 (TODOs)

| # | 項目 | 優先度 | 說明 |
|---|------|--------|------|
| 1 | `custom_fields` JSONB 欄位 | 高 | 需執行 SQL: `ALTER TABLE pipeline ADD COLUMN custom_fields JSONB DEFAULT '{}'::jsonb;`，讓自訂欄位能持久化到 DB |
| 2 | 自訂欄位 DB 持久化 | 高 | 目前 `customColumns` 僅存在前端 state，重新整理後消失；需搭配 #1 實作寫入/讀取 |
| 3 | Chunk size 警告 | 低 | Build 後 JS bundle ~969KB，超過 500KB 建議值；可考慮 dynamic import 拆分 |
| 4 | Header.jsx 冗餘 | 低 | 目前 Header 功能內嵌在 PipelineTable 中，`Header.jsx` 元件幾乎未被實際使用 |
| 5 | App.css 清理 | 低 | 檔案存在但未被使用 |
| 6 | 錯誤處理強化 | 中 | 目前使用 `alert()` 通知錯誤，可改為 Toast/Snackbar |
| 7 | RLS (Row Level Security) | 高 | 需在 Supabase 設定 RLS 政策，確保資料安全 |

---

## 13. 歷史重大變更記錄

| 日期 | 變更 |
|------|------|
| 2026-03 | 字典系統從 mockData 硬編碼遷移至 Supabase `dictionaries` 表 |
| 2026-03 | RecordDrawer 修復：移除 mockData 直接 import，改用 `dictionary` prop |
| 2026-03 | Badge 元件系統重寫：code-based case-insensitive 匹配 + hash 自動分色 |
| 2026-03 | 側邊欄從深色主題改為 Fluent 淺色主題 |
| 2026-03 | 新增忘記密碼 / 密碼變更功能 |
| 2026-03 | 批次刪除改為單次 alert |
| 2026-03 | 新增 AdminPanel + SuperAdmin 權限管理 |
| 2026-03 | 自訂字典類別 + `__meta__` 持久化機制 |
| 2026-04 | **AIBS / CAIP 雙軌系統**（4 階段）— DB 欄位 + Sidebar + PipelineTable + RecordDrawer + ImportWizard 完整分流 |
| 2026-04 | Tabs localStorage 持久化、Sticky Column 防鬼影、CAIP Q1-Q4 自動加總 |
| 2026-04 | **Modern UI/UX 大改造** — 所有 7 元件現代化、Framer Motion 動畫、設計 Token 系統、Dynamic Color Engine |
| 2026-04 | **Anti-Jitter + Anti-Snowblind** — 全域 `transition-all` → `transition-colors` 替換、bg-slate-50 + 白色卡片層次 |
| 2026-04 | Table UX 進化：Double-click 編輯、Smart Expand/Collapse、欄寬 auto-fit |
| 2026-04 | Badge 色彩正規化：`.toString().trim().toLowerCase()` + 移轉/轉移/transfer alias |
| 2026-04 | Cat. filter 動態依 viewMode 過濾；CAIP month/quarter checkbox filter |
| 2026-04 | **Segment 字典整合** — SettingsModal 內建分頁 + RecordDrawer `<select required>` + PipelineTable/Dashboard 篩選 |
| 2026-04 | **Dashboard Azure 智慧分析** — 進階篩選條件面板（Segment/Quarters/Months）+ 情境動態圖表切換（Cat. ↔ Segment Doughnut） |
| 2026-04-07 | **Dashboard 全域文案精煉** — 12 處標題字串精簡（移除冗餘中文前綴，統一格式） |

---

## 14. 快速上手指南（交接用）

### 對新開發者 / AI 助手

1. **先讀 `App.jsx`** — 理解全域狀態、資料流和 AIBS/CAIP 雙軌路由
2. **再讀 `PipelineTable.jsx`** — 最大最複雜的元件（1147 行）
3. **查看 `mockData.js`** — 理解字典和資料結構（含 segment 預設）
4. **注意 `reqType` ↔ `reqtype` 映射** — 前端 camelCase、DB 全小寫
5. **字典 fallback 模式** — 所有元件都有 `dictionary || defaultDictData` 的 fallback
6. **Badge 系統** — 傳 `code` + `label`，不要只傳 `text`；顏色透過 `.toString().trim().toLowerCase()` 正規化
7. **CAIP 欄位** — RecordDrawer 的 `CAIP_TEXT_KEYS` / `CAIP_NUM_KEYS` 常數定義 CAIP 專屬欄位
8. **Segment** — 字典驅動的 `<select required>`，非自由文字輸入
9. **transition 規範** — 全域禁止 `transition-all`，只用 `transition-colors` / `transition-shadow` / `transition-[specific-props]`

### 常見問題

**Q: Badge 顏色全灰？**  
A: 檢查傳給 Badge 的 `code` prop 是否為空或 undefined。確認 `getNameFromDict` 是否正確解析。也檢查是否有多餘空白（現已用 `.trim()` 處理）。

**Q: 新增字典項目後表格沒反映？**  
A: 確認 `onDictionaryChanged` callback 有被呼叫（會觸發 `fetchDictionary`）。

**Q: 表格看不到某些商機？**  
A: 檢查登入帳號是否為 Sales 角色 — Sales 只能看到自己的商機。

**Q: CAIP 模式看不到 Segment 欄位？**  
A: 確認目前的 viewMode 是 `'caip'`（由 Sidebar 導航切換），Segment 欄位僅在 CAIP 模式下的 RecordDrawer 中出現。

**Q: Dashboard 的 Segment 圓餅圖沒出現？**  
A: 需在 Dashboard 的 Product (Cat.) 篩選中勾選 `Azure`，`isAzureFiltered` 才會為 true，觸發圖表切換至 Segment 維度。

---

*此文件由 AI 助手根據 codebase 掃描自動產生，最後更新於 2026-04-07。建議在每次重大變更後更新。*
