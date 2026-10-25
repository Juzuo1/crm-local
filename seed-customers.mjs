import fs from 'fs';
import path from 'path';

const DB_FILE = path.resolve('./data/crm.json');
const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));

const now = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
const daysAgo = (d) => { const t = new Date(); t.setDate(t.getDate() - d); t.setHours(10, 0, 0, 0); return t.toISOString().replace('T', ' ').slice(0, 19); };
const daysAfter = (d) => { const t = new Date(); t.setDate(t.getDate() + d); t.setHours(10, 0, 0, 0); return t.toISOString().replace('T', ' ').slice(0, 19); };

let cid = 1;
const make = (o) => ({
  id: cid++,
  position: '', phone: '', email: '', company_name: '', country: '',
  source_channel: 'other', customer_level: 'C', stage: 'new_lead',
  stage_updated_at: null, product_interests: '', tags: '', notes: '',
  assigned_to: 1, last_followup_at: null, next_followup_at: null,
  created_by: 1, created_at: now(), updated_at: now(), deleted_at: null,
  sea_pool_entered_at: null, sea_pool_claimed_at: null, ...o,
});

const newCustomers = [
  make({
    contact_name: 'John Carter', position: 'Procurement Manager',
    phone: '+1 415-555-0182', email: 'john.carter@sunwave-energy.com',
    company_name: 'SunWave Energy LLC', country: '美国',
    source_channel: 'tiktok', customer_level: 'A', stage: 'quoted',
    stage_updated_at: daysAgo(3),
    product_interests: '堆叠式,机架式', tags: 'OEM需求,VIP',
    notes: '美国加州分销商，年采购量预计 500+ 套，已发 10kWh/15kWh 报价，等客户内部比价。',
    created_at: daysAgo(20), last_followup_at: daysAgo(3), next_followup_at: daysAfter(2),
  }),
  make({
    contact_name: 'Anna Schmidt', position: 'CEO',
    phone: '+49 30 555 0123', email: 'anna.schmidt@bavaria-solar.de',
    company_name: 'Bavaria Solar GmbH', country: '德国',
    source_channel: 'alibaba', customer_level: 'A', stage: 'negotiation',
    stage_updated_at: daysAgo(5),
    product_interests: '壁挂式,一体机', tags: 'OEM需求,已验厂',
    notes: '德国安装商，看重 CE 认证与本地合规，正在谈独家代理条款。',
    created_at: daysAgo(45), last_followup_at: daysAgo(2), next_followup_at: daysAfter(1),
  }),
  make({
    contact_name: 'Liam O’Brien', position: 'Owner',
    phone: '+61 2 5550 0144', email: 'liam@outbackpower.com.au',
    company_name: 'Outback Power AU', country: '澳大利亚',
    source_channel: 'exhibition', customer_level: 'B', stage: 'sample_testing',
    stage_updated_at: daysAgo(8),
    product_interests: '立式,移动电源', tags: '样品',
    notes: '悉尼展会见面，已寄 5kWh 样品，预计两周内出测试报告。',
    created_at: daysAgo(12), last_followup_at: daysAgo(4), next_followup_at: daysAfter(3),
  }),
  make({
    contact_name: 'Sipho Mokoena', position: 'Sales Director',
    phone: '+27 11 555 0199', email: 'sipho@capeenergysa.co.za',
    company_name: 'Cape Energy SA', country: '南非',
    source_channel: 'facebook', customer_level: 'B', stage: 'initial_contact',
    stage_updated_at: daysAgo(6),
    product_interests: '机架式,储能柜', tags: '价格敏感',
    notes: 'Facebook 主页询盘，关注离网家用方案，已发公司介绍与目录。',
    created_at: daysAgo(9), last_followup_at: daysAgo(6), next_followup_at: daysAgo(1),
  }),
  make({
    contact_name: 'Mohammed Al Farsi', position: 'General Manager',
    phone: '+971 4 555 0177', email: 'mohammed@desertec.ae',
    company_name: 'Desertec Trading LLC', country: '阿联酋',
    source_channel: 'website', customer_level: 'C', stage: 'needs_confirmed',
    stage_updated_at: daysAgo(4),
    product_interests: '壁挂式,堆叠式', tags: '',
    notes: '独立站留言，别墅储能需求，待确认安装容量与并网方式。',
    created_at: daysAgo(7), last_followup_at: daysAgo(4), next_followup_at: daysAfter(2),
  }),
  make({
    contact_name: 'Emma Wilson', position: 'Buyer',
    phone: '+44 20 5555 0166', email: 'emma@thamesrenew.co.uk',
    company_name: 'Thames Renewable Ltd', country: '英国',
    source_channel: 'referral', customer_level: 'A', stage: 'order_confirmed',
    stage_updated_at: daysAgo(10),
    product_interests: '堆叠式,机架式', tags: 'VIP,招投标',
    notes: '老客户转介绍，英国政府项目订单已确认，200 套，生产中。',
    created_at: daysAgo(60), last_followup_at: daysAgo(10), next_followup_at: daysAfter(5),
  }),
  make({
    contact_name: 'Carlos Mendez', position: 'Import Manager',
    phone: '+34 91 555 0155', email: 'carlos@iberiasol.es',
    company_name: 'Iberia Solar SL', country: '西班牙',
    source_channel: 'alibaba', customer_level: 'C', stage: 'new_lead',
    stage_updated_at: null,
    product_interests: '立式', tags: '',
    notes: '阿里国际站新询盘，尚未回复。',
    created_at: daysAgo(2), last_followup_at: null, next_followup_at: daysAfter(1),
  }),
  make({
    contact_name: 'Priya Nair', position: 'Founder',
    phone: '+91 22 5550 0133', email: 'priya@mumbaisolar.in',
    company_name: 'Mumbai Solar Pvt Ltd', country: '印度',
    source_channel: 'tiktok', customer_level: 'D', stage: 'lost',
    stage_updated_at: daysAgo(15),
    product_interests: '移动电源', tags: '价格敏感',
    notes: '预算过低，转向本地低价供应商，标记流失。',
    created_at: daysAgo(35), last_followup_at: daysAgo(15), next_followup_at: null,
  }),
  make({
    contact_name: 'Robert Brown', position: 'Operations Head',
    phone: '+1 646-555-0177', email: 'robert@eastcoastess.us',
    company_name: 'East Coast ESS Inc', country: '美国',
    source_channel: 'exhibition', customer_level: 'B', stage: 'completed',
    stage_updated_at: daysAgo(40),
    product_interests: '储能柜,堆叠式', tags: 'VIP',
    notes: '已完成首单 80 套，回款正常，维护中。',
    created_at: daysAgo(90), last_followup_at: daysAgo(12), next_followup_at: daysAfter(15),
  }),
  make({
    contact_name: 'Daniel Kim', position: 'Sales Lead',
    phone: '+82 2 555 0122', email: 'daniel@seoulpower.kr',
    company_name: 'Seoul Power Co', country: '韩国',
    source_channel: 'website', customer_level: 'C', stage: 'negotiation',
    stage_updated_at: daysAgo(6),
    product_interests: '壁挂式,一体机', tags: 'OEM需求',
    notes: '韩国首尔，谈判 OEM 贴牌价格，希望 MOQ 降低。',
    created_at: daysAgo(18), last_followup_at: daysAgo(3), next_followup_at: daysAfter(4),
  }),
];

// 公海客户（无负责人、进入公海）
const poolCustomer = make({
  contact_name: 'Hans Berger', position: 'Engineer',
  phone: '+41 44 555 0111', email: 'hans@alpineess.ch',
  company_name: 'Alpine ESS AG', country: '瑞士',
  source_channel: 'referral', customer_level: 'B', stage: 'initial_contact',
  stage_updated_at: daysAgo(20),
  product_interests: '机架式', tags: '',
  notes: '原业务员 30 天未跟进，已自动掉入公海，等待认领。',
  created_at: daysAgo(50), last_followup_at: daysAgo(30), next_followup_at: null,
  assigned_to: null, sea_pool_entered_at: daysAgo(8), sea_pool_claimed_at: null,
});
newCustomers.push(poolCustomer);

db.customers.push(...newCustomers);

// 跟进记录
const followups = [
  { customer_id: 1, user_id: 1, method: 'email', content: '发送 10kWh / 15kWh 堆叠式报价单，等待客户内部比价。', created_at: daysAgo(3), next_followup_at: daysAfter(2) },
  { customer_id: 1, user_id: 1, method: 'whatsapp', content: 'WhatsApp 确认收到报价，表示下周三内部会议讨论。', created_at: daysAgo(1) },
  { customer_id: 2, user_id: 1, method: 'meeting', content: '视频会议谈独家代理条款，对方要求 12 个月区域保护。', created_at: daysAgo(2), next_followup_at: daysAfter(1) },
  { customer_id: 3, user_id: 1, method: 'email', content: '寄出 5kWh 立式样品，运单号 SF1234567890。', created_at: daysAgo(4), next_followup_at: daysAfter(3) },
  { customer_id: 4, user_id: 1, method: 'phone', content: '电话沟通离网方案，客户关注价格，报价偏高需申请折扣。', created_at: daysAgo(6), next_followup_at: daysAgo(1) },
  { customer_id: 6, user_id: 1, method: 'email', content: '英国政府项目 200 套订单确认，已签 PI，安排生产。', created_at: daysAgo(10), next_followup_at: daysAfter(5) },
  { customer_id: 9, user_id: 1, method: 'phone', content: '首单 80 套已发货，跟进安装反馈良好。', created_at: daysAgo(12), next_followup_at: daysAfter(15) },
  { customer_id: 10, user_id: 1, method: 'email', content: '谈判 OEM 贴牌价格，韩方希望 MOQ 降至 50 套。', created_at: daysAgo(3), next_followup_at: daysAfter(4) },
];
let fid = 1;
for (const f of followups) {
  db.followups.push({ id: fid++, ...f });
}

// 同步更新客户的 last_followup_at / next_followup_at
for (const f of followups) {
  const c = db.customers.find(x => x.id === f.customer_id);
  if (c && (c.last_followup_at === null || f.created_at > c.last_followup_at)) c.last_followup_at = f.created_at;
}

fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
console.log(`已写入 ${newCustomers.length} 个客户、${followups.length} 条跟进记录`);
