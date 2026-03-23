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
};

export const dictTitles = {
  sales: 'Sales',
  pm: 'PM',
  reqType: 'Type',
  product: 'Cat.',
  stage: 'Stage',
};

// ===== Mock 商機資料 =====
export const mockData = [
  { enduser: '緯創資通', reqType: '新購', si: 'Ckmates (銓鍇)', product: 'Azure', sku: 'Azure Consumption', quantity: 1, amount: 450000, date: '2026-03-30', stage: 'L1', sales: 'NL', pm: 'RL', notes: '3/10 介紹 MSP 方案，等待確認架構...' },
  { enduser: '國泰世華銀行', reqType: '新購', si: '精誠資訊', product: 'MW', sku: 'Copilot for M365', quantity: 300, amount: 2700000, date: '2026-04-15', stage: 'L2', sales: 'AC', pm: 'TW', notes: '[更新] 正在進行資安合規審核...' },
  { enduser: '長榮海運', reqType: '新購', si: '大同世界科技', product: 'On-Prem', sku: 'Win Svr DataCtr 2022', quantity: 64, amount: 1350000, date: '2026-03-25', stage: 'L4', sales: 'JW', pm: 'RL', notes: '已下單，等待原廠發送金鑰...' },
  { enduser: '富邦金控', reqType: '增購', si: '凌群電腦', product: 'MW', sku: 'M365 E3 Step-up', quantity: 50, amount: 850000, date: '2026-05-10', stage: 'L3', sales: 'AC', pm: 'TW', notes: '提案階段，預計下週議價' },
  { enduser: '台灣大哥大', reqType: '新購', si: '台灣微軟直售', product: 'Azure', sku: 'Azure OpenAI Service', quantity: 1, amount: 1200000, date: '2026-04-20', stage: 'L2', sales: 'NL', pm: 'RL', notes: 'PoC 進行中，模型調校階段' },
  { enduser: '研華科技', reqType: '新購', si: '邁達特', product: 'MW', sku: 'M365 E5 Renewal', quantity: 1200, amount: 5600000, date: '2026-06-30', stage: 'L1', sales: 'JW', pm: 'TW', notes: '合約將於6月底到期，已啟動續約討論' },
  { enduser: '宏碁', reqType: '增購', si: '零壹科技', product: 'Azure', sku: 'Azure SQL Database', quantity: 5, amount: 320000, date: '2026-03-18', stage: 'L3', sales: 'NL', pm: 'RL', notes: '客戶要求額外折扣，待主管簽核' },
  { enduser: '仁寶電腦', reqType: '新購', si: '大同世界科技', product: 'On-Prem', sku: 'SQL Server 2022 Ent', quantity: 2, amount: 950000, date: '2026-04-05', stage: 'L2', sales: 'AC', pm: 'TW', notes: '地端廠房擴建需求' },
  { enduser: '遠傳電信', reqType: '增購', si: '精誠資訊', product: 'Azure', sku: 'Azure Reserved Instances', quantity: 1, amount: 3400000, date: '2026-05-25', stage: 'L3', sales: 'NL', pm: 'RL', notes: 'RI 續約評估中，提供三年期報價' },
  { enduser: '華南銀行', reqType: '增購', si: '凌群電腦', product: 'MW', sku: 'Power BI Pro', quantity: 100, amount: 180000, date: '2026-03-22', stage: 'L4', sales: 'JW', pm: 'TW', notes: 'POE 已通過，今日開通' },
  { enduser: '兆豐金控', reqType: '新購', si: '邁達特', product: 'MW', sku: 'Defender for Endpoint', quantity: 500, amount: 1500000, date: '2026-06-15', stage: 'L1', sales: 'AC', pm: 'RL', notes: '資安升級專案，初步接洽' },
  { enduser: '聯華電子', reqType: '新購', si: 'Ckmates (銓鍇)', product: 'Azure', sku: 'Azure ExpressRoute', quantity: 1, amount: 600000, date: '2026-04-10', stage: 'L2', sales: 'NL', pm: 'TW', notes: '合約確認中' },
  { enduser: '日月光', reqType: '增購', si: '零壹科技', product: 'On-Prem', sku: 'Windows Server CALs', quantity: 150, amount: 120000, date: '2026-03-28', stage: 'L4', sales: 'JW', pm: 'RL', notes: '廠區新增員工授權' },
  { enduser: '中華電信', reqType: '新購', si: '台灣微軟直售', product: 'Azure', sku: 'Azure Synapse Analytics', quantity: 1, amount: 2100000, date: '2026-05-01', stage: 'L2', sales: 'NL', pm: 'TW', notes: '大數據分析平台建置' },
  { enduser: '國泰人壽', reqType: '增購', si: '精誠資訊', product: 'MW', sku: 'M365 E3 Renewal', quantity: 800, amount: 4800000, date: '2026-06-01', stage: 'L3', sales: 'AC', pm: 'RL', notes: '預計與銀行端合併談判' },
  { enduser: '聯發科技', reqType: '新購', si: '精誠資訊', product: 'MW', sku: 'GitHub Copilot', quantity: 200, amount: 1500000, date: '2026-07-15', stage: 'L1', sales: 'JW', pm: 'TW', notes: '開發團隊 AI 輔助開發導入評估' },
  { enduser: '廣達電腦', reqType: '新購', si: '邁達特', product: 'Azure', sku: 'Azure Consumption', quantity: 1, amount: 880000, date: '2026-08-20', stage: 'L2', sales: 'NL', pm: 'RL', notes: '年度架構檢視與額度更新' },
  { enduser: '玉山銀行', reqType: '新購', si: '零壹科技', product: 'On-Prem', sku: 'SQL Server 2022 Std', quantity: 4, amount: 450000, date: '2026-05-12', stage: 'L3', sales: 'AC', pm: 'TW', notes: '新分行系統建置需求' },
  { enduser: '台達電子', reqType: '增購', si: 'Ckmates (銓鍇)', product: 'Azure', sku: 'Azure Virtual Desktop', quantity: 50, amount: 620000, date: '2026-04-30', stage: 'L2', sales: 'NL', pm: 'RL', notes: '遠端辦公環境擴容，議價中' },
  { enduser: '中信金控', reqType: '增購', si: '大同世界科技', product: 'MW', sku: 'M365 E5 Security', quantity: 600, amount: 3200000, date: '2026-09-01', stage: 'L1', sales: 'JW', pm: 'TW', notes: '手續已完成，待開立發票' },
  { enduser: '和碩聯合科技', reqType: '新購', si: '台灣微軟直售', product: 'MW', sku: 'Copilot for M365', quantity: 150, amount: 4500000, date: '2026-06-10', stage: 'L2', sales: 'AC', pm: 'RL', notes: '高階主管與研發部門 AI 導入專案' },
];
