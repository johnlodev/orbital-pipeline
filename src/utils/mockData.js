// ===== 字典資料 (Dictionary Engine) =====
export const dictData = {
  sales: [
    { label: 'Alex Chen', code: 'AC' },
    { label: 'Jane Wu', code: 'JW' },
    { label: 'Neogene Lee', code: 'NL' },
  ],
  pm: [
    { label: 'Rachel Lee', code: 'RL' },
    { label: 'Tim Wu', code: 'TW' },
  ],
  reqType: [
    { label: '新購', code: '新購' },
    { label: '增購', code: '增購' },
  ],
  product: [
    { label: 'Azure', code: 'Azure' },
    { label: 'Modern Work', code: 'MW' },
    { label: 'On-Premise', code: 'On-Prem' },
  ],
  stage: [
    { label: 'L1', code: 'L1' },
    { label: 'L2', code: 'L2' },
    { label: 'L3', code: 'L3' },
    { label: 'L4', code: 'L4' },
  ],
  segment: [
    { label: 'Enterprise', code: 'Enterprise' },
    { label: 'SMB', code: 'SMB' },
    { label: 'Government', code: 'Government' },
    { label: 'Education', code: 'Education' },
  ],
};

export const dictTitles = {
  sales: 'Sales',
  pm: 'PM',
  reqType: 'Type',
  product: 'Cat.',
  stage: 'Stage',
  segment: 'Segment',
};

// ===== Mock 商機資料 (50 筆，涵蓋 2026 全年 1–12 月) =====
export const mockData = [
  // ── Q1 (Jan–Mar) ────────────────────────────────────────
  { id: 'rec_1',  enduser: '台積電',         reqType: '新購', si: '精誠資訊',         product: 'Azure',   sku: 'Azure Reserved VM',        quantity: 20,   amount: 7800000, date: '2026-01-08', stage: 'L1', sales: 'AC', pm: 'RL', notes: '初次接觸，評估雲端遷移方案' },
  { id: 'rec_2',  enduser: '國泰世華銀行',   reqType: '新購', si: '精誠資訊',         product: 'MW',      sku: 'Copilot for M365',         quantity: 300,  amount: 2700000, date: '2026-01-15', stage: 'L2', sales: 'AC', pm: 'TW', notes: '正在進行資安合規審核' },
  { id: 'rec_3',  enduser: '鴻海精密',       reqType: '新購', si: '大同世界科技',     product: 'Azure',   sku: 'Azure Arc',                quantity: 1,    amount: 980000,  date: '2026-01-22', stage: 'L2', sales: 'NL', pm: 'RL', notes: '混合雲管理需求，Demo 安排中' },
  { id: 'rec_4',  enduser: '中華電信',       reqType: '增購', si: 'Ckmates (銓鍇)',  product: 'MW',      sku: 'M365 E5 Security',         quantity: 500,  amount: 4500000, date: '2026-02-03', stage: 'L3', sales: 'JW', pm: 'TW', notes: '安全方案評估完成，議價中' },
  { id: 'rec_5',  enduser: '長榮海運',       reqType: '增購', si: '大同世界科技',     product: 'On-Prem', sku: 'Win Svr DataCtr 2022',     quantity: 64,   amount: 1350000, date: '2026-02-10', stage: 'L4', sales: 'JW', pm: 'RL', notes: '已下單，等待原廠發送金鑰' },
  { id: 'rec_6',  enduser: '聯發科技',       reqType: '增購', si: '台灣微軟直售',     product: 'Azure',   sku: 'Azure DevOps Services',    quantity: 100,  amount: 620000,  date: '2026-02-18', stage: 'L4', sales: 'JW', pm: 'RL', notes: '續約完成，等候出貨' },
  { id: 'rec_7',  enduser: '緯創資通',       reqType: '新購', si: 'Ckmates (銓鍇)',  product: 'Azure',   sku: 'Azure Consumption',        quantity: 1,    amount: 450000,  date: '2026-02-25', stage: 'L1', sales: 'NL', pm: 'RL', notes: '3/10 介紹 MSP 方案，等待確認架構' },
  { id: 'rec_8',  enduser: '富邦金控',       reqType: '增購', si: '凌群電腦',         product: 'MW',      sku: 'M365 E3 Step-up',          quantity: 50,   amount: 850000,  date: '2026-03-05', stage: 'L3', sales: 'AC', pm: 'TW', notes: '提案階段，預計下週議價' },
  { id: 'rec_9',  enduser: '台灣大哥大',     reqType: '新購', si: '台灣微軟直售',     product: 'Azure',   sku: 'Azure OpenAI Service',     quantity: 1,    amount: 1200000, date: '2026-03-12', stage: 'L2', sales: 'NL', pm: 'RL', notes: 'PoC 進行中，模型調校階段' },
  { id: 'rec_10', enduser: '玉山銀行',       reqType: '新購', si: '精誠資訊',         product: 'MW',      sku: 'Copilot for M365',         quantity: 200,  amount: 1800000, date: '2026-03-20', stage: 'L1', sales: 'AC', pm: 'TW', notes: '內部評估 AI 生產力工具' },
  { id: 'rec_11', enduser: '日月光半導體',   reqType: '增購', si: '大同世界科技',     product: 'On-Prem', sku: 'System Center Standard',   quantity: 16,   amount: 480000,  date: '2026-03-28', stage: 'L4', sales: 'NL', pm: 'RL', notes: '管理工具續約，已完成簽核' },

  // ── Q2 (Apr–Jun) ────────────────────────────────────────
  { id: 'rec_12', enduser: '統一企業',       reqType: '新購', si: '凌群電腦',         product: 'On-Prem', sku: 'SQL Server Enterprise',    quantity: 8,    amount: 1600000, date: '2026-04-02', stage: 'L1', sales: 'NL', pm: 'TW', notes: '資料庫升級需求，待提案' },
  { id: 'rec_13', enduser: '華碩電腦',       reqType: '增購', si: 'Ckmates (銓鍇)',  product: 'MW',      sku: 'Power BI Pro',             quantity: 150,  amount: 720000,  date: '2026-04-08', stage: 'L2', sales: 'AC', pm: 'RL', notes: '分析平台擴充，POC 進行中' },
  { id: 'rec_14', enduser: '兆豐金控',       reqType: '新購', si: '精誠資訊',         product: 'Azure',   sku: 'Azure Sentinel',           quantity: 1,    amount: 2100000, date: '2026-04-15', stage: 'L3', sales: 'JW', pm: 'TW', notes: 'SIEM 方案競標中，下週報價' },
  { id: 'rec_15', enduser: '台塑集團',       reqType: '增購', si: '凌群電腦',         product: 'On-Prem', sku: 'Windows Server CAL',       quantity: 500,  amount: 890000,  date: '2026-04-20', stage: 'L4', sales: 'AC', pm: 'TW', notes: '下單完成，準備出貨' },
  { id: 'rec_16', enduser: '宏碁集團',       reqType: '新購', si: '大同世界科技',     product: 'MW',      sku: 'Teams Phone System',       quantity: 300,  amount: 540000,  date: '2026-04-28', stage: 'L1', sales: 'NL', pm: 'RL', notes: '統一通訊方案，初始評估' },
  { id: 'rec_17', enduser: '友達光電',       reqType: '新購', si: 'Ckmates (銓鍇)',  product: 'Azure',   sku: 'Azure IoT Hub',            quantity: 1,    amount: 780000,  date: '2026-05-03', stage: 'L1', sales: 'AC', pm: 'RL', notes: 'IoT 智慧工廠方案研究中' },
  { id: 'rec_18', enduser: '元大金控',       reqType: '新購', si: '精誠資訊',         product: 'Azure',   sku: 'Azure Kubernetes Service', quantity: 1,    amount: 1500000, date: '2026-05-10', stage: 'L2', sales: 'JW', pm: 'RL', notes: '容器化遷移 POC 啟動' },
  { id: 'rec_19', enduser: '遠傳電信',       reqType: '增購', si: '台灣微軟直售',     product: 'MW',      sku: 'M365 E3 Add-on',           quantity: 1000, amount: 3200000, date: '2026-05-18', stage: 'L3', sales: 'NL', pm: 'TW', notes: '大量授權續約，議價最終階段' },
  { id: 'rec_20', enduser: '第一金控',       reqType: '新購', si: '精誠資訊',         product: 'MW',      sku: 'Intune Device Mgmt',       quantity: 800,  amount: 1120000, date: '2026-05-25', stage: 'L2', sales: 'JW', pm: 'TW', notes: '裝置管理方案 Demo 完成' },
  { id: 'rec_21', enduser: '廣達電腦',       reqType: '增購', si: '大同世界科技',     product: 'On-Prem', sku: 'Visual Studio Enterprise', quantity: 30,   amount: 1950000, date: '2026-06-02', stage: 'L3', sales: 'JW', pm: 'TW', notes: '開發工具增購，採購流程中' },
  { id: 'rec_22', enduser: '瑞昱半導體',     reqType: '新購', si: 'Ckmates (銓鍇)',  product: 'Azure',   sku: 'Azure Machine Learning',   quantity: 1,    amount: 2400000, date: '2026-06-10', stage: 'L2', sales: 'NL', pm: 'TW', notes: 'ML 平台建置 POC 排程中' },
  { id: 'rec_23', enduser: '台新金控',       reqType: '新購', si: '台灣微軟直售',     product: 'MW',      sku: 'Defender for Endpoint',    quantity: 600,  amount: 1680000, date: '2026-06-18', stage: 'L1', sales: 'AC', pm: 'RL', notes: '端點安全方案初始評估' },
  { id: 'rec_24', enduser: '彰化銀行',       reqType: '增購', si: '精誠資訊',         product: 'MW',      sku: 'Exchange Online Plan 2',   quantity: 400,  amount: 960000,  date: '2026-06-25', stage: 'L3', sales: 'JW', pm: 'RL', notes: '郵件系統升級，合約確認中' },

  // ── Q3 (Jul–Sep) ────────────────────────────────────────
  { id: 'rec_25', enduser: '台積電',         reqType: '增購', si: '精誠資訊',         product: 'Azure',   sku: 'Azure OpenAI Service',     quantity: 1,    amount: 5200000, date: '2026-07-05', stage: 'L2', sales: 'AC', pm: 'RL', notes: 'GPT-4o 大規模部署，二期需求' },
  { id: 'rec_26', enduser: '國泰人壽',       reqType: '新購', si: '精誠資訊',         product: 'Azure',   sku: 'Azure Front Door',         quantity: 1,    amount: 420000,  date: '2026-07-12', stage: 'L2', sales: 'NL', pm: 'RL', notes: 'CDN + WAF 方案評估中' },
  { id: 'rec_27', enduser: '仁寶電腦',       reqType: '增購', si: '凌群電腦',         product: 'MW',      sku: 'SharePoint Online',        quantity: 250,  amount: 575000,  date: '2026-07-20', stage: 'L4', sales: 'AC', pm: 'TW', notes: '授權啟用完成' },
  { id: 'rec_28', enduser: '南亞科技',       reqType: '新購', si: '凌群電腦',         product: 'Azure',   sku: 'Azure Backup',             quantity: 1,    amount: 360000,  date: '2026-07-28', stage: 'L1', sales: 'AC', pm: 'TW', notes: '災備方案初期需求討論' },
  { id: 'rec_29', enduser: '華南金控',       reqType: '新購', si: 'Ckmates (銓鍇)',  product: 'Azure',   sku: 'Azure SQL Managed',        quantity: 4,    amount: 1380000, date: '2026-08-03', stage: 'L1', sales: 'JW', pm: 'RL', notes: '資料庫雲端化初始討論' },
  { id: 'rec_30', enduser: '大立光電',       reqType: '增購', si: '台灣微軟直售',     product: 'On-Prem', sku: 'Office LTSC Standard',     quantity: 200,  amount: 680000,  date: '2026-08-10', stage: 'L3', sales: 'NL', pm: 'TW', notes: '永久授權增購議價中' },
  { id: 'rec_31', enduser: '合庫金控',       reqType: '新購', si: '精誠資訊',         product: 'MW',      sku: 'Microsoft Viva Suite',     quantity: 350,  amount: 1050000, date: '2026-08-18', stage: 'L2', sales: 'AC', pm: 'RL', notes: '員工體驗平台 Demo 安排中' },
  { id: 'rec_32', enduser: '中華電信',       reqType: '新購', si: 'Ckmates (銓鍇)',  product: 'Azure',   sku: 'Azure Cosmos DB',          quantity: 1,    amount: 3100000, date: '2026-08-25', stage: 'L2', sales: 'JW', pm: 'TW', notes: '全球分散式資料庫 POC 進行中' },
  { id: 'rec_33', enduser: '緯穎科技',       reqType: '新購', si: '大同世界科技',     product: 'Azure',   sku: 'Azure HPC',               quantity: 1,    amount: 4200000, date: '2026-09-02', stage: 'L1', sales: 'NL', pm: 'RL', notes: '高效能運算叢集需求，初步接洽' },
  { id: 'rec_34', enduser: '鴻海精密',       reqType: '增購', si: '大同世界科技',     product: 'MW',      sku: 'Copilot for M365',         quantity: 2000, amount: 6400000, date: '2026-09-08', stage: 'L3', sales: 'NL', pm: 'RL', notes: '全集團 Copilot 擴張，董事會已核准' },
  { id: 'rec_35', enduser: '玉山銀行',       reqType: '增購', si: '精誠資訊',         product: 'Azure',   sku: 'Azure Sentinel',           quantity: 1,    amount: 1650000, date: '2026-09-15', stage: 'L3', sales: 'AC', pm: 'TW', notes: 'SIEM 增加新 Log 源，報價中' },
  { id: 'rec_36', enduser: '富邦金控',       reqType: '新購', si: '凌群電腦',         product: 'On-Prem', sku: 'SQL Server Enterprise',    quantity: 12,   amount: 2350000, date: '2026-09-22', stage: 'L1', sales: 'AC', pm: 'TW', notes: '新資料倉儲專案，初始規格討論' },
  { id: 'rec_37', enduser: '遠傳電信',       reqType: '新購', si: '台灣微軟直售',     product: 'Azure',   sku: 'Azure AI Search',          quantity: 1,    amount: 890000,  date: '2026-09-28', stage: 'L2', sales: 'NL', pm: 'TW', notes: 'RAG 架構搜尋引擎，Demo 安排' },

  // ── Q4 (Oct–Dec) ────────────────────────────────────────
  { id: 'rec_38', enduser: '台灣大哥大',     reqType: '增購', si: '台灣微軟直售',     product: 'MW',      sku: 'M365 E5 Security',         quantity: 800,  amount: 3600000, date: '2026-10-05', stage: 'L3', sales: 'NL', pm: 'RL', notes: '年度擴充案，資安處已簽核' },
  { id: 'rec_39', enduser: '聯發科技',       reqType: '新購', si: '台灣微軟直售',     product: 'Azure',   sku: 'Azure Machine Learning',   quantity: 1,    amount: 2800000, date: '2026-10-12', stage: 'L2', sales: 'JW', pm: 'RL', notes: 'AI Chip 設計模擬平台建置' },
  { id: 'rec_40', enduser: '台塑集團',       reqType: '新購', si: '凌群電腦',         product: 'Azure',   sku: 'Azure IoT Hub',            quantity: 1,    amount: 1450000, date: '2026-10-20', stage: 'L1', sales: 'AC', pm: 'TW', notes: '六輕智慧工廠 IoT 平台需求' },
  { id: 'rec_41', enduser: '兆豐金控',       reqType: '增購', si: '精誠資訊',         product: 'MW',      sku: 'Copilot for M365',         quantity: 500,  amount: 4500000, date: '2026-10-28', stage: 'L4', sales: 'JW', pm: 'TW', notes: '已完成合約簽訂，等候啟用' },
  { id: 'rec_42', enduser: '華碩電腦',       reqType: '新購', si: 'Ckmates (銓鍇)',  product: 'Azure',   sku: 'Azure Consumption',        quantity: 1,    amount: 1200000, date: '2026-11-03', stage: 'L2', sales: 'AC', pm: 'RL', notes: '全球研發雲資源彈性需求' },
  { id: 'rec_43', enduser: '廣達電腦',       reqType: '新購', si: '大同世界科技',     product: 'MW',      sku: 'Defender for Endpoint',    quantity: 1500, amount: 4200000, date: '2026-11-10', stage: 'L1', sales: 'JW', pm: 'TW', notes: '端點安全全面升級，初始評估' },
  { id: 'rec_44', enduser: '台新金控',       reqType: '增購', si: '台灣微軟直售',     product: 'Azure',   sku: 'Azure Kubernetes Service', quantity: 1,    amount: 2150000, date: '2026-11-18', stage: 'L3', sales: 'AC', pm: 'RL', notes: '微服務架構擴展，報價最終確認' },
  { id: 'rec_45', enduser: '統一企業',       reqType: '增購', si: '凌群電腦',         product: 'On-Prem', sku: 'Windows Server CAL',       quantity: 800,  amount: 1420000, date: '2026-11-25', stage: 'L4', sales: 'NL', pm: 'TW', notes: '增購完成，授權已啟用' },
  { id: 'rec_46', enduser: '元大金控',       reqType: '增購', si: '精誠資訊',         product: 'MW',      sku: 'Power BI Pro',             quantity: 300,  amount: 1440000, date: '2026-12-02', stage: 'L3', sales: 'JW', pm: 'RL', notes: '分析平台擴展，年底前結案' },
  { id: 'rec_47', enduser: '日月光半導體',   reqType: '新購', si: '大同世界科技',     product: 'Azure',   sku: 'Azure Reserved VM',        quantity: 10,   amount: 3500000, date: '2026-12-08', stage: 'L2', sales: 'NL', pm: 'RL', notes: '海外廠區雲端 VM 規劃' },
  { id: 'rec_48', enduser: '國泰世華銀行',   reqType: '增購', si: '精誠資訊',         product: 'MW',      sku: 'Intune Device Mgmt',       quantity: 1200, amount: 1680000, date: '2026-12-15', stage: 'L4', sales: 'AC', pm: 'TW', notes: '裝置管理續約已簽核完成' },
  { id: 'rec_49', enduser: '瑞昱半導體',     reqType: '增購', si: 'Ckmates (銓鍇)',  product: 'Azure',   sku: 'Azure OpenAI Service',     quantity: 1,    amount: 1850000, date: '2026-12-20', stage: 'L3', sales: 'NL', pm: 'TW', notes: 'AI 驗證轉正式環境，增購算力' },
  { id: 'rec_50', enduser: '宏碁集團',       reqType: '新購', si: '大同世界科技',     product: 'On-Prem', sku: 'Visual Studio Enterprise', quantity: 50,   amount: 3250000, date: '2026-12-28', stage: 'L1', sales: 'JW', pm: 'RL', notes: '全球研發授權整併計畫，初期需求' },
];
