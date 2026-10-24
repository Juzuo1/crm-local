'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { LEVEL_LABELS, LEVEL_BADGE, LEVEL_DOT, STAGE_LABELS, STAGE_BADGE, CHANNEL_LABELS, METHOD_LABELS, badgeClass, avatarColor } from '@/lib/ui';

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
  assigned_to: number | null;
  created_by: number;
  followups: Followup[];
  canEdit?: boolean;
  canEditLevel?: boolean;
  canEditInterests?: boolean;
  canEditTags?: boolean;
  canDelete?: boolean;
  canAssign?: boolean;
  canPushToSea?: boolean;
  sea_pool_entered_at: string | null;
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

// 跟进方式 → 图标映射
const METHOD_ICON: Record<string, string> = {
  phone: 'phone', whatsapp: 'chat', email: 'mail', wechat: 'chat', meeting: 'users',
};

const inputCls = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35] outline-none transition';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown>>({});

  const [followupMethod, setFollowupMethod] = useState('whatsapp');
  const [followupContent, setFollowupContent] = useState('');
  const [followupNextTime, setFollowupNextTime] = useState('');
  const [savingFollowup, setSavingFollowup] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [pushingToSea, setPushingToSea] = useState(false);

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

  async function pushToSea() {
    setPushingToSea(true);
    const res = await fetch('/api/sea-pool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_ids: [parseInt(id)] }),
    });
    const json = await res.json();
    setPushingToSea(false);
    if (json.success) {
      router.push('/sea-pool');
    } else {
      alert(json.error || '操作失败');
    }
  }

  async function deleteCustomer() {
    await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    router.push('/customers');
  }

  if (loading) return <div className="flex items-center justify-center h-full text-slate-400">加载中…</div>;
  if (!customer) return <div className="text-center py-12 text-slate-400">客户不存在</div>;

  let productInterests: string[] = [];
  let tags: string[] = [];
  try { productInterests = JSON.parse(customer.product_interests || '[]'); } catch { /* */ }
  try { tags = JSON.parse(customer.tags || '[]'); } catch { /* */ }

  const isOverdue = customer.next_followup_at && new Date(customer.next_followup_at) < new Date();

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* 名片抬头 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <Link href="/customers" className="mt-1 text-slate-400 hover:text-[#0A2540] transition" title="返回列表">
              <Icon name="chevron-right" className="w-5 h-5 rotate-180" />
            </Link>
            <div className={`w-14 h-14 rounded-xl ${avatarColor(customer.contact_name || '?')} flex items-center justify-center text-xl font-bold text-white shadow-sm`}>
              {(customer.contact_name || '?').slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-[#0A2540]">{customer.contact_name}</h2>
                {customer.position && <span className="text-sm text-slate-400">{customer.position}</span>}
              </div>
              <div className="text-sm text-slate-500 mt-0.5">
                {[customer.company_name, customer.country].filter(Boolean).join(' · ') || '—'}
              </div>
              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                <span className={badgeClass(LEVEL_BADGE, customer.customer_level)}>
                  <span className={`w-1.5 h-1.5 rounded-full ${LEVEL_DOT[customer.customer_level] || 'bg-slate-400'}`} />
                  {LEVEL_LABELS[customer.customer_level] || customer.customer_level}
                </span>
                <span className={badgeClass(STAGE_BADGE, customer.stage || 'new_lead')}>
                  {STAGE_LABELS[customer.stage || 'new_lead']}
                </span>
                {customer.source_channel && (
                  <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                    {CHANNEL_LABELS[customer.source_channel] || customer.source_channel}
                  </span>
                )}
                {isOverdue && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-medium ring-1 ring-inset ring-red-200">
                    <Icon name="warning" className="w-3.5 h-3.5" />跟进已逾期
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {!editing && (customer.canEdit !== false) && (
              <button onClick={() => { setEditData({ ...customer }); setEditing(true); }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer transition text-slate-600">
                <Icon name="pencil" className="w-4 h-4" />编辑
              </button>
            )}
            {customer.canPushToSea && customer.assigned_to && (
              <button onClick={() => pushToSea()} disabled={pushingToSea}
                className="px-3.5 py-2 text-sm border border-orange-200 text-[#FF6B35] rounded-lg hover:bg-orange-50 cursor-pointer transition disabled:opacity-50">
                推入公海
              </button>
            )}
            {customer.canDelete && (
              <button onClick={() => setShowDelete(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 cursor-pointer transition">
                <Icon name="trash" className="w-4 h-4" />删除
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 客户基本信息 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/80">
        <h3 className="font-semibold text-[#0A2540] mb-4">基本信息</h3>

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
                  <label className="block text-xs text-slate-500 mb-1">{f.label}</label>
                  <input value={(editData[f.key] as string) || ''}
                    onChange={e => setEditData({ ...editData, [f.key]: e.target.value })}
                    className={inputCls} />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">备注</label>
              <textarea value={(editData.notes as string) || ''}
                onChange={e => setEditData({ ...editData, notes: e.target.value })}
                rows={3} className={inputCls} />
            </div>
            <div className="flex gap-3">
              <button onClick={saveEdit}
                className="px-4 py-2 bg-[#0A2540] text-white text-sm font-medium rounded-lg hover:bg-[#123455] cursor-pointer transition">
                保存
              </button>
              <button onClick={() => setEditing(false)}
                className="px-4 py-2 border border-slate-300 text-sm rounded-lg hover:bg-slate-50 cursor-pointer transition">
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
            <InfoItem label="手机/WhatsApp" value={customer.phone} />
            <InfoItem label="邮箱" value={customer.email} />
            <InfoItem label="来源渠道" value={CHANNEL_LABELS[customer.source_channel] || customer.source_channel} />
            <InfoItem label="最后跟进" value={customer.last_followup_at?.slice(0, 10)} />
            <InfoItem label="下次跟进" value={
              isOverdue
                ? <span className="text-red-600 font-medium inline-flex items-center gap-1"><Icon name="warning" className="w-3.5 h-3.5" />已逾期：{customer.next_followup_at.slice(0, 10)}</span>
                : customer.next_followup_at?.slice(0, 10) || '-'
            } />
            <InfoItem label="建档时间" value={customer.created_at?.slice(0, 10)} />
          </div>
        )}

        {/* 产品兴趣和标签 */}
        <div className="mt-5 pt-4 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 w-16 shrink-0">产品兴趣</span>
            {productInterests.length > 0
              ? productInterests.map(p => (
                  <span key={p} className="px-2.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full ring-1 ring-inset ring-blue-100">{p}</span>
                ))
              : <span className="text-xs text-slate-300">未设置</span>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 w-16 shrink-0">标签</span>
            {tags.length > 0
              ? tags.map(t => (
                  <span key={t} className="px-2.5 py-0.5 bg-orange-50 text-[#FF6B35] text-xs rounded-full ring-1 ring-inset ring-orange-100">{t}</span>
                ))
              : <span className="text-xs text-slate-300">未设置</span>}
          </div>
          {customer.notes && (
            <div className="flex gap-2">
              <span className="text-xs text-slate-400 w-16 shrink-0 pt-0.5">备注</span>
              <p className="text-sm text-slate-600 whitespace-pre-wrap flex-1">{customer.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* 新增跟进 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/80">
        <h3 className="font-semibold text-[#0A2540] mb-4">添加跟进记录</h3>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {Object.entries(METHOD_LABELS).map(([k, v]) => (
              <button key={k} type="button" onClick={() => setFollowupMethod(k)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm rounded-lg border transition cursor-pointer ${
                  followupMethod === k
                    ? 'bg-[#0A2540] text-white border-[#0A2540] shadow-sm'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-[#FF6B35]/50'
                }`}>
                <Icon name={METHOD_ICON[k] || 'chat'} className="w-4 h-4" />
                {v}
              </button>
            ))}
          </div>
          <textarea value={followupContent} onChange={e => setFollowupContent(e.target.value)}
            rows={3} placeholder="记录跟进内容…"
            className={`${inputCls} resize-none`} />
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <label className="text-xs text-slate-500 block mb-1">下次跟进时间</label>
              <input type="datetime-local" value={followupNextTime}
                onChange={e => setFollowupNextTime(e.target.value)}
                className={inputCls} />
            </div>
            <button onClick={addFollowup} disabled={savingFollowup || !followupContent.trim()}
              className="px-5 py-2 bg-[#FF6B35] text-white text-sm font-medium rounded-lg hover:bg-[#e55a2b] disabled:opacity-40 transition cursor-pointer disabled:cursor-not-allowed shadow-sm">
              {savingFollowup ? '保存中…' : '添加跟进'}
            </button>
          </div>
        </div>
      </div>

      {/* 跟进记录时间线 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/80">
        <h3 className="font-semibold text-[#0A2540] mb-4">
          跟进记录
          <span className="ml-2 text-sm font-normal text-slate-400">（{customer.followups?.length || 0} 条）</span>
        </h3>
        {customer.followups && customer.followups.length > 0 ? (
          <>
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
                      const isLast = showAllFollowups
                        ? i === totalCount - 1
                        : i === displayList.length - 1 && !hiddenCount;

                      return (
                        <div key={f.id} className="flex gap-4 pb-5 relative">
                          {!isLast && (
                            <div className="absolute left-[17px] top-10 bottom-0 w-px bg-slate-200" />
                          )}
                          <div className="shrink-0 w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center z-10 ring-4 ring-white">
                            <Icon name={METHOD_ICON[f.method] || 'chat'} className="w-4 h-4 text-slate-500" />
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-sm font-medium text-[#0A2540]">{f.user_name}</span>
                              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">{METHOD_LABELS[f.method] || f.method}</span>
                              <span className="text-xs text-slate-400">{f.created_at?.slice(0, 16)}</span>
                              {i === 0 && (
                                <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-medium">最新</span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{f.content}</p>
                            {f.next_followup_at && (
                              <p className="text-xs text-[#FF6B35] mt-1.5 inline-flex items-center gap-1">
                                <Icon name="calendar" className="w-3.5 h-3.5" />下次跟进：{f.next_followup_at.slice(0, 16)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {hiddenCount > 0 && !showAllFollowups && (
                    <button onClick={() => setShowAllFollowups(true)}
                      className="w-full py-2.5 text-sm text-[#FF6B35] hover:bg-orange-50 rounded-lg transition cursor-pointer mt-1 inline-flex items-center justify-center gap-1">
                      <Icon name="chevron-down" className="w-4 h-4" />查看全部 {totalCount} 条记录（还有 {hiddenCount} 条）
                    </button>
                  )}
                  {showAllFollowups && totalCount > FOLLOWUP_PREVIEW_COUNT && (
                    <button onClick={() => setShowAllFollowups(false)}
                      className="w-full py-2.5 text-sm text-slate-400 hover:bg-slate-50 rounded-lg transition cursor-pointer mt-1 inline-flex items-center justify-center gap-1">
                      <Icon name="chevron-down" className="w-4 h-4 rotate-180" />收起，只显示最近 {FOLLOWUP_PREVIEW_COUNT} 条
                    </button>
                  )}
                </>
              );
            })()}
          </>
        ) : (
          <div className="text-center py-10">
            <Icon name="chat" className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">暂无跟进记录，从上方添加第一条</p>
          </div>
        )}
      </div>

      {/* 删除确认弹窗 */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4">
            <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center mb-3">
              <Icon name="trash" className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-[#0A2540] mb-2">确认删除</h3>
            <p className="text-sm text-slate-500 mb-5">
              确定要删除客户「{customer.contact_name}」吗？此操作可撤销（软删除）。
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDelete(false)}
                className="px-4 py-2 border border-slate-300 text-sm rounded-lg hover:bg-slate-50 cursor-pointer transition">
                取消
              </button>
              <button onClick={deleteCustomer}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 cursor-pointer transition">
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-400 mb-0.5">{label}</div>
      <div className="text-sm text-slate-800">{value || <span className="text-slate-300">-</span>}</div>
    </div>
  );
}
