'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Customer {
  id: number;
  contact_name: string;
  position: string;
  phone: string;
  email: string;
  company_name: string;
  country: string;
  source_channel: string;
  customer_level: string;
  stage: string;
  product_interests: string;
  tags: string;
  notes: string;
  next_followup_at: string;
  last_followup_at: string;
  created_at: string;
  assigned_to: number;
  created_by: number;
  followups: Followup[];
  canEdit?: boolean;
  canEditLevel?: boolean;
  canEditInterests?: boolean;
  canEditTags?: boolean;
  canDelete?: boolean;
  canAssign?: boolean;
}

interface Followup {
  id: number;
  customer_id: number;
  user_id: number;
  user_name: string;
  method: string;
  content: string;
  next_followup_at: string;
  created_at: string;
}

const channelLabels: Record<string, string> = {
  facebook: 'Facebook', tiktok: 'TikTok', alibaba: '阿里国际站',
  website: '独立站', exhibition: '展会', referral: '转介绍', other: '其他'
};

const methodLabels: Record<string, string> = {
  phone: '📞 电话', whatsapp: '💬 WhatsApp', email: '📧 邮件',
  wechat: '🟢 微信', meeting: '🤝 见面'
};

const levelLabels: Record<string, string> = { A: 'A级 - 高价值', B: 'B级 - 意向强', C: 'C级 - 待培育', D: 'D级 - 无效' };
const levelColors: Record<string, string> = { A: 'bg-green-100 text-green-800', B: 'bg-blue-100 text-blue-800', C: 'bg-yellow-100 text-yellow-800', D: 'bg-red-100 text-red-800' };

const stageLabels: Record<string, string> = {
  new_lead: '新线索', initial_contact: '初步联系', needs_confirmed: '需求确认',
  quoted: '已报价', sample_testing: '样品测试', negotiation: '商务谈判',
  order_confirmed: '确认订单', production_shipping: '生产发货',
  completed: '已成交客户', lost: '已流失'
};
const stageColors: Record<string, string> = {
  new_lead: 'bg-gray-100 text-gray-700', initial_contact: 'bg-blue-100 text-blue-700',
  needs_confirmed: 'bg-indigo-100 text-indigo-700', quoted: 'bg-yellow-100 text-yellow-700',
  sample_testing: 'bg-orange-100 text-orange-700', negotiation: 'bg-purple-100 text-purple-700',
  order_confirmed: 'bg-green-100 text-green-700', production_shipping: 'bg-teal-100 text-teal-700',
  completed: 'bg-emerald-100 text-emerald-700', lost: 'bg-red-100 text-red-700'
};

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  // 编辑模式
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown>>({});

  // 新增跟进
  const [followupMethod, setFollowupMethod] = useState('whatsapp');
  const [followupContent, setFollowupContent] = useState('');
  const [followupNextTime, setFollowupNextTime] = useState('');
  const [savingFollowup, setSavingFollowup] = useState(false);

  // 删除确认
  const [showDelete, setShowDelete] = useState(false);

  // 跟进记录展开/收起
  const [showAllFollowups, setShowAllFollowups] = useState(false);
  const FOLLOWUP_PREVIEW_COUNT = 5;

  useEffect(() => {
    fetch(`/api/customers/${id}`).then(r => r.json()).then(data => {
      setCustomer(data);
      setLoading(false);
    });
  }, [id]);

  async function addFollowup() {
    if (!followupContent.trim()) return;
    setSavingFollowup(true);
    const res = await fetch('/api/followups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: parseInt(id),
        method: followupMethod,
        content: followupContent,
        next_followup_at: followupNextTime || null,
      }),
    });
    if (res.ok) {
      setFollowupContent('');
      setFollowupNextTime('');
      // 重新加载
      const r = await fetch(`/api/customers/${id}`);
      setCustomer(await r.json());
    }
    setSavingFollowup(false);
  }

  async function saveEdit() {
    const res = await fetch(`/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData),
    });
    if (res.ok) {
      setEditing(false);
      const r = await fetch(`/api/customers/${id}`);
      setCustomer(await r.json());
    }
  }

  async function deleteCustomer() {
    await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    router.push('/customers');
  }

  if (loading) return <div className="flex items-center justify-center h-full text-gray-400">加载中...</div>;
  if (!customer) return <div className="text-center py-12 text-gray-400">客户不存在</div>;

  let productInterests: string[] = [];
  let tags: string[] = [];
  try { productInterests = JSON.parse(customer.product_interests || '[]'); } catch { /* */ }
  try { tags = JSON.parse(customer.tags || '[]'); } catch { /* */ }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/customers" className="text-gray-400 hover:text-gray-600 transition">&larr; 返回</Link>
          <h2 className="text-xl font-bold text-gray-900">{customer.contact_name}</h2>
          {customer.company_name && (
            <span className="text-sm text-gray-400">| {customer.company_name}</span>
          )}
        </div>
        <div className="flex gap-2">
          {!editing && (customer.canEdit !== false) && (
            <button onClick={() => { setEditData({ ...customer }); setEditing(true); }}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
              编辑
            </button>
          )}
          {customer.canDelete && (
            <button onClick={() => setShowDelete(true)}
              className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 cursor-pointer">
              删除
            </button>
          )}
        </div>
      </div>

      {/* 客户基本信息 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">基本信息</h3>

        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'contact_name', label: '联系人姓名' },
                { key: 'position', label: '职位' },
                { key: 'phone', label: '手机/WhatsApp' },
                { key: 'email', label: '邮箱' },
                { key: 'company_name', label: '公司名称' },
                { key: 'country', label: '国家' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                  <input value={(editData[f.key] as string) || ''}
                    onChange={e => setEditData({ ...editData, [f.key]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">备注</label>
              <textarea value={(editData.notes as string) || ''}
                onChange={e => setEditData({ ...editData, notes: e.target.value })}
                rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={saveEdit}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 cursor-pointer">
                保存
              </button>
              <button onClick={() => setEditing(false)}
                className="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 cursor-pointer">
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <InfoItem label="联系人" value={customer.contact_name} />
            <InfoItem label="职位" value={customer.position} />
            <InfoItem label="手机/WhatsApp" value={customer.phone} />
            <InfoItem label="邮箱" value={customer.email} />
            <InfoItem label="公司名称" value={customer.company_name} />
            <InfoItem label="国家" value={customer.country} />
            <InfoItem label="来源渠道" value={channelLabels[customer.source_channel] || customer.source_channel} />
            <InfoItem label="客户等级" value={
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${levelColors[customer.customer_level] || ''}`}>
                {levelLabels[customer.customer_level] || customer.customer_level}
              </span>
            } />
            <InfoItem label="客户阶段" value={
              <StageBadge stage={customer.stage} />
            } />
            <InfoItem label="最后跟进" value={customer.last_followup_at?.slice(0, 10)} />
            <InfoItem label="下次跟进" value={
              customer.next_followup_at && new Date(customer.next_followup_at) < new Date()
                ? <span className="text-red-600 font-medium">⚠ 已逾期: {customer.next_followup_at.slice(0, 10)}</span>
                : customer.next_followup_at?.slice(0, 10) || '-'
            } />
          </div>
        )}

        {/* 产品兴趣和标签 */}
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400">产品兴趣:</span>
            {productInterests.length > 0
              ? productInterests.map(p => (
                  <span key={p} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">{p}</span>
                ))
              : <span className="text-xs text-gray-300">未设置</span>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400">标签:</span>
            {tags.length > 0
              ? tags.map(t => (
                  <span key={t} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full">{t}</span>
                ))
              : <span className="text-xs text-gray-300">未设置</span>}
          </div>
          {customer.notes && (
            <div>
              <span className="text-xs text-gray-400">备注:</span>
              <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* 新增跟进 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">添加跟进记录</h3>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {Object.entries(methodLabels).map(([k, v]) => (
              <button key={k} type="button" onClick={() => setFollowupMethod(k)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition cursor-pointer ${
                  followupMethod === k
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}>
                {v}
              </button>
            ))}
          </div>
          <textarea value={followupContent} onChange={e => setFollowupContent(e.target.value)}
            rows={3} placeholder="记录跟进内容..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
          <div className="flex items-center gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">下次跟进时间</label>
              <input type="datetime-local" value={followupNextTime}
                onChange={e => setFollowupNextTime(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <button onClick={addFollowup} disabled={savingFollowup || !followupContent.trim()}
              className="mt-5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition cursor-pointer disabled:cursor-not-allowed">
              {savingFollowup ? '保存中...' : '添加跟进'}
            </button>
          </div>
        </div>
      </div>

      {/* 跟进记录时间线 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">
          跟进记录
          <span className="ml-2 text-sm font-normal text-gray-400">({customer.followups?.length || 0}条)</span>
        </h3>
        {customer.followups && customer.followups.length > 0 ? (
          <>
            {/* 显示最近N条还是全部 */}
            {(() => {
              const totalCount = customer.followups.length;
              const displayList = showAllFollowups
                ? customer.followups
                : customer.followups.slice(0, FOLLOWUP_PREVIEW_COUNT);
              const hiddenCount = totalCount - FOLLOWUP_PREVIEW_COUNT;

              return (
                <>
                  <div className="space-y-0">
                    {displayList.map((f, i) => {
                      const realIndex = showAllFollowups ? i : i;
                      const isLast = showAllFollowups
                        ? realIndex === totalCount - 1
                        : realIndex === displayList.length - 1 && !hiddenCount;

                      return (
                        <div key={f.id} className="flex gap-4 pb-4 relative">
                          {!isLast && (
                            <div className="absolute left-[17px] top-10 bottom-0 w-0.5 bg-gray-100" />
                          )}
                          <div className="shrink-0 w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm z-10">
                            {methodLabels[f.method]?.split(' ')[0] || '📝'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">{f.user_name}</span>
                              <span className="text-xs text-gray-400">{methodLabels[f.method] || f.method}</span>
                              <span className="text-xs text-gray-400">{f.created_at?.slice(0, 16)}</span>
                              {f === displayList[0] && (
                                <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">最新</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{f.content}</p>
                            {f.next_followup_at && (
                              <p className="text-xs text-blue-500 mt-1">
                                📅 下次跟进: {f.next_followup_at.slice(0, 16)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 展开/收起按钮 */}
                  {hiddenCount > 0 && !showAllFollowups && (
                    <button onClick={() => setShowAllFollowups(true)}
                      className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer mt-1">
                      ▼ 查看全部 {totalCount} 条记录（还有 {hiddenCount} 条）
                    </button>
                  )}
                  {showAllFollowups && totalCount > FOLLOWUP_PREVIEW_COUNT && (
                    <button onClick={() => setShowAllFollowups(false)}
                      className="w-full py-2 text-sm text-gray-400 hover:bg-gray-50 rounded-lg transition cursor-pointer mt-1">
                      ▲ 收起，只显示最近 {FOLLOWUP_PREVIEW_COUNT} 条
                    </button>
                  )}
                </>
              );
            })()}
          </>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">暂无跟进记录</p>
        )}
      </div>

      {/* 删除确认弹窗 */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">确认删除</h3>
            <p className="text-sm text-gray-500 mb-4">
              确定要删除客户「{customer.contact_name}」吗？此操作可撤销（软删除）。
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDelete(false)}
                className="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 cursor-pointer">
                取消
              </button>
              <button onClick={deleteCustomer}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 cursor-pointer">
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StageBadge({ stage }: { stage?: string }) {
  const s = stage || 'new_lead';
  return (
    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${stageColors[s] || 'bg-gray-100 text-gray-600'}`}>
      {stageLabels[s] || s}
    </span>
  );
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
      <div className="text-sm text-gray-800">{value || <span className="text-gray-300">-</span>}</div>
    </div>
  );
}
