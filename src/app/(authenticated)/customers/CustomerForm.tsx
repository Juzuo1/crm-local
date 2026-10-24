'use client';

import { useState, useRef } from 'react';
import Icon from '@/components/Icon';
import { METHOD_LABELS } from '@/lib/ui';

const countries = [
  '美国', '德国', '英国', '法国', '意大利', '西班牙', '荷兰', '波兰', '土耳其',
  '巴西', '墨西哥', '南非', '尼日利亚', '肯尼亚', '埃及', '沙特阿拉伯', '阿联酋',
  '印度', '巴基斯坦', '孟加拉', '越南', '泰国', '印度尼西亚', '菲律宾', '马来西亚',
  '澳大利亚', '日本', '韩国', '加拿大', '俄罗斯', '其他'
];

const channels = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'alibaba', label: '阿里国际站' },
  { value: 'website', label: '独立站' },
  { value: 'exhibition', label: '展会' },
  { value: 'referral', label: '转介绍' },
  { value: 'other', label: '其他' },
];

const levels = [
  { value: 'A', label: 'A级 - 高价值' },
  { value: 'B', label: 'B级 - 意向强' },
  { value: 'C', label: 'C级 - 待培育' },
  { value: 'D', label: 'D级 - 无效' },
];

const productOptions = ['立式', '壁挂式', '机架式', '堆叠式', '一体机', '卧式', '储能柜', '移动电源', '其他'];

const stages = [
  { value: 'new_lead', label: '新线索', desc: '刚拿到联系方式' },
  { value: 'initial_contact', label: '初步联系', desc: '已发公司介绍/目录' },
  { value: 'needs_confirmed', label: '需求确认', desc: '确认产品需求' },
  { value: 'quoted', label: '已报价', desc: '已发报价/PI' },
  { value: 'sample_testing', label: '样品测试', desc: '寄样测试中' },
  { value: 'negotiation', label: '商务谈判', desc: '价格/条款谈判' },
  { value: 'order_confirmed', label: '确认订单', desc: '订单已确认' },
  { value: 'production_shipping', label: '生产发货', desc: '生产/发货中' },
  { value: 'completed', label: '已成交客户', desc: '已成交收款' },
  { value: 'lost', label: '已流失', desc: '丢单' },
];

const tagOptions = ['VIP', '价格敏感', 'OEM需求', '已验厂', '样品', '急需', '招投标', '重要'];

const METHOD_ICON: Record<string, string> = {
  phone: 'phone', whatsapp: 'chat', email: 'mail', wechat: 'chat', meeting: 'users',
};

interface Props {
  defaultValues?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  children?: React.ReactNode;
}

export default function CustomerForm({ defaultValues = {}, onSubmit, children }: Props) {
  const [productInterests, setProductInterests] = useState<string[]>(
    (defaultValues.product_interests as string[]) || []
  );
  const [tags, setTags] = useState<string[]>((defaultValues.tags as string[]) || []);
  const [customTag, setCustomTag] = useState('');
  const [followupMethod, setFollowupMethod] = useState((defaultValues.followup_method as string) || 'whatsapp');
  const formRef = useRef<HTMLFormElement>(null);

  const toggleItem = (list: string[], setter: (v: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setter(list.filter(i => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const addCustomTag = () => {
    const t = customTag.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setCustomTag('');
    }
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const data: Record<string, unknown> = {
      contact_name: fd.get('contact_name'),
      position: fd.get('position'),
      phone: fd.get('phone'),
      email: fd.get('email'),
      company_name: fd.get('company_name'),
      country: fd.get('country'),
      source_channel: fd.get('source_channel'),
      customer_level: fd.get('customer_level'),
      stage: fd.get('stage') || 'new_lead',
      product_interests: productInterests,
      tags: tags,
      notes: fd.get('notes'),
      next_followup_at: fd.get('next_followup_at') || null,
      followup_method: followupMethod,
      followup_content: fd.get('followup_content') || '',
    };
    onSubmit(data);
  }

  const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35] outline-none transition";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";
  const legendClass = "text-sm font-semibold text-[#0A2540] mb-3 pb-2 border-b border-slate-100 w-full";

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      {/* 联系人信息 */}
      <fieldset>
        <legend className={legendClass}>联系人信息</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>联系人姓名 <span className="text-red-500">*</span></label>
            <input name="contact_name" required defaultValue={(defaultValues.contact_name as string) || ''}
              className={inputClass} placeholder="必填" />
          </div>
          <div>
            <label className={labelClass}>职位</label>
            <input name="position" defaultValue={(defaultValues.position as string) || ''}
              className={inputClass} placeholder="如：采购经理" />
          </div>
          <div>
            <label className={labelClass}>手机 / WhatsApp</label>
            <input name="phone" defaultValue={(defaultValues.phone as string) || ''}
              className={inputClass} placeholder="含国际区号" />
          </div>
          <div>
            <label className={labelClass}>邮箱</label>
            <input name="email" type="email" defaultValue={(defaultValues.email as string) || ''}
              className={inputClass} placeholder="email@example.com" />
          </div>
        </div>
      </fieldset>

      {/* 公司信息 */}
      <fieldset>
        <legend className={legendClass}>公司信息</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>公司名称</label>
            <input name="company_name" defaultValue={(defaultValues.company_name as string) || ''}
              className={inputClass} placeholder="客户公司名称" />
          </div>
          <div>
            <label className={labelClass}>国家</label>
            <select name="country" defaultValue={(defaultValues.country as string) || ''} className={inputClass}>
              <option value="">请选择国家</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </fieldset>

      {/* 业务属性 */}
      <fieldset>
        <legend className={legendClass}>业务属性</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>来源渠道</label>
            <select name="source_channel" defaultValue={(defaultValues.source_channel as string) || ''} className={inputClass}>
              <option value="">请选择渠道</option>
              {channels.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>客户等级</label>
            <select name="customer_level" defaultValue={(defaultValues.customer_level as string) || 'C'} className={inputClass}>
              {levels.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>客户阶段</label>
            <select name="stage" defaultValue={(defaultValues.stage as string) || 'new_lead'} className={inputClass}>
              {stages.map(s => <option key={s.value} value={s.value}>{s.label} - {s.desc}</option>)}
            </select>
          </div>
        </div>
      </fieldset>

      {/* 产品兴趣 */}
      <fieldset>
        <legend className={legendClass}>产品兴趣（可多选）</legend>
        <div className="flex flex-wrap gap-2">
          {productOptions.map(p => (
            <button key={p} type="button" onClick={() => toggleItem(productInterests, setProductInterests, p)}
              className={`px-3.5 py-1.5 text-sm rounded-lg border transition cursor-pointer ${
                productInterests.includes(p)
                  ? 'bg-[#0A2540] text-white border-[#0A2540] shadow-sm'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-[#FF6B35]/50'
              }`}>
              {p}
            </button>
          ))}
        </div>
      </fieldset>

      {/* 标签 */}
      <fieldset>
        <legend className={legendClass}>客户标签（可多选 + 自定义）</legend>
        <div className="flex flex-wrap gap-2 mb-3">
          {tagOptions.map(t => (
            <button key={t} type="button" onClick={() => toggleItem(tags, setTags, t)}
              className={`px-3.5 py-1.5 text-sm rounded-lg border transition cursor-pointer ${
                tags.includes(t)
                  ? 'bg-[#FF6B35] text-white border-[#FF6B35] shadow-sm'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-[#FF6B35]/50'
              }`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={customTag} onChange={e => setCustomTag(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); } }}
            className={`${inputClass} flex-1`} placeholder="输入自定义标签后点添加" />
          <button type="button" onClick={addCustomTag}
            className="px-4 py-2 bg-slate-100 text-slate-600 text-sm rounded-lg hover:bg-slate-200 transition cursor-pointer">
            添加
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map(t => (
              <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-[#FF6B35] text-xs rounded-full ring-1 ring-inset ring-orange-100">
                {t}
                <button type="button" onClick={() => setTags(tags.filter(i => i !== t))}
                  className="text-orange-300 hover:text-[#FF6B35] cursor-pointer">
                  <Icon name="x" className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </fieldset>

      {/* 备注 */}
      <fieldset>
        <legend className={legendClass}>备注</legend>
        <textarea name="notes" defaultValue={(defaultValues.notes as string) || ''} rows={3}
          className={inputClass} placeholder="客户备注信息…" />
      </fieldset>

      {/* 跟进记录（建档时可写） */}
      <fieldset>
        <legend className={legendClass}>首次跟进记录</legend>
        <div className="space-y-3">
          <div>
            <label className={labelClass}>跟进方式</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(METHOD_LABELS).map(([value, label]) => (
                <label key={value} className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm rounded-lg border cursor-pointer transition ${
                  followupMethod === value
                    ? 'bg-[#0A2540] text-white border-[#0A2540] shadow-sm'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-[#FF6B35]/50'
                }`}>
                  <input type="radio" name="followup_method" value={value}
                    checked={followupMethod === value}
                    onChange={() => setFollowupMethod(value)}
                    className="sr-only" />
                  <Icon name={METHOD_ICON[value] || 'chat'} className="w-4 h-4" />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass}>跟进内容</label>
            <textarea name="followup_content" defaultValue={(defaultValues.followup_content as string) || ''}
              rows={3} className={inputClass}
              placeholder="记录首次沟通内容，如：客户通过 WhatsApp 咨询了 XX 产品，对价格和 MOQ 比较关心…" />
          </div>
          <div className="w-full md:w-1/2">
            <label className={labelClass}>下次跟进时间</label>
            <input name="next_followup_at" type="datetime-local"
              defaultValue={(defaultValues.next_followup_at as string) || ''} className={inputClass} />
          </div>
        </div>
      </fieldset>

      {children}
    </form>
  );
}
