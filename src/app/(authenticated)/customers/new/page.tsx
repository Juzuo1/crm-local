'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomerForm from '../CustomerForm';

export default function NewCustomerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(formData: Record<string, unknown>) {
    setSaving(true);
    setError('');

    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const json = await res.json();
    if (json.error) {
      setError(json.error);
      setSaving(false);
      return;
    }

    // 如果有跟进内容，自动创建第一条跟进记录
    const customerId = json.id;
    const followupContent = formData.followup_content as string;
    if (followupContent && followupContent.trim()) {
      await fetch('/api/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          method: formData.followup_method || 'whatsapp',
          content: followupContent,
          next_followup_at: formData.next_followup_at || null,
        }),
      });
    }

    router.push('/customers');
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h2 className="text-xl font-bold text-gray-900">新增客户</h2>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <div className="px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 flex items-center gap-2">
        <span>💡</span> 业务员创建的客户自动归属于自己，管理员创建的客户可在客户列表中分配负责人
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <CustomerForm onSubmit={handleSubmit}>
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition cursor-pointer">
              取消
            </button>
            <button type="submit" disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition cursor-pointer disabled:cursor-not-allowed">
              {saving ? '保存中...' : '保存客户'}
            </button>
          </div>
        </CustomerForm>
      </div>
    </div>
  );
}
