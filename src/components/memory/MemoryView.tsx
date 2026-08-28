import React, { useState } from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { GradientButton } from '../common/GradientButton';
import { MemoryEntry } from '../../types';
import {
  Brain,
  Plus,
  Search,
  Trash2,
  Lock,
  Database,
  Check,
  Sparkles,
} from 'lucide-react';

export const MemoryView: React.FC = () => {
  const [memories, setMemories] = useState<MemoryEntry[]>([
    {
      id: 'mem-1',
      category: 'project_rule',
      key: 'Project Tone & Voice',
      value: 'ใช้ภาษาไทยที่กระชับ สุภาพ ทันสมัย และให้เกียรติผู้ใช้งานเสมอ',
      importance: 'high',
      updatedAt: '28 ส.ค. 2026',
      isSynced: false,
    },
    {
      id: 'mem-2',
      category: 'preference',
      key: 'Design Color Palette',
      value: 'เน้นชุดสี Dark Navy Black (#070812) แซมเฉดนีออน ชมพู-ม่วง-น้ำเงิน',
      importance: 'high',
      updatedAt: '28 ส.ค. 2026',
      isSynced: false,
    },
    {
      id: 'mem-3',
      category: 'context_fact',
      key: 'Target Screen Constraint',
      value: 'Mobile First 393 x 852 พิกเซล และ Desktop ไม่เกิน 1200 พิกเซล',
      importance: 'medium',
      updatedAt: '28 ส.ค. 2026',
      isSynced: false,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState<'preference' | 'project_rule' | 'context_fact'>('project_rule');

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;

    const newEntry: MemoryEntry = {
      id: `mem-${Date.now()}`,
      category: newCategory,
      key: newKey.trim(),
      value: newValue.trim(),
      importance: 'medium',
      updatedAt: 'เมื่อสักครู่',
      isSynced: false,
    };

    setMemories([newEntry, ...memories]);
    setNewKey('');
    setNewValue('');
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    setMemories(memories.filter((m) => m.id !== id));
  };

  const filteredMemories = memories.filter(
    (m) =>
      m.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#131525] border border-[#312E81] rounded-2xl shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">หน่วยความจำ (Memory Vault)</h2>
              <StatusBadge type="coming_soon" text="Coming Soon" size="sm" />
            </div>
            <p className="text-xs sm:text-sm text-white/50">
              จัดเก็บบริบท กฎเกณฑ์ของโปรเจกต์ และการตัดสินใจที่สำคัญ
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF00FF] to-[#7B2CFE] hover:opacity-90 text-white text-xs font-bold shadow-md shadow-[#7B2CFE]/30 min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มความจำใหม่</span>
        </button>
      </div>

      {/* Supabase Authority Notice Banner */}
      <div className="p-4 rounded-2xl bg-[#131525]/90 border border-[#312E81] flex items-start sm:items-center justify-between gap-4 text-xs shadow-lg">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-[#00D1FF] shrink-0" />
          <div>
            <span className="font-bold text-white block">Supabase Authority Data Store</span>
            <span className="text-white/50">
              Supabase เป็นระบบหลักสำหรับ Authentication, Memory และ Audit Trail (ปัจจุบันทำงานในโหมด Local Cache)
            </span>
          </div>
        </div>
        <StatusBadge type="not_connected" text="UNSYNCED (NOT_CONNECTED)" size="sm" />
      </div>

      {/* Add Memory Modal/Card */}
      {showAddForm && (
        <form
          onSubmit={handleAddMemory}
          className="p-5 rounded-2xl bg-[#131525] border border-[#7B2CFE]/50 space-y-4 animate-in fade-in duration-200 shadow-xl"
        >
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FF00FF]" /> เพิ่มรายการความจำใหม่
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-white/50 mb-1">หัวข้อ/คีย์ความจำ</label>
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="เช่น กฎการเขียนโค้ด, สไตล์บทความที่ชอบ..."
                className="w-full h-11 px-3.5 rounded-xl bg-[#0C0D1A] border border-[#312E81] text-xs text-white outline-none focus:border-[#7B2CFE]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/50 mb-1">หมวดหมู่</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full h-11 px-3 rounded-xl bg-[#0C0D1A] border border-[#312E81] text-xs text-white outline-none focus:border-[#7B2CFE]"
              >
                <option value="project_rule">กฎของโปรเจกต์ (Project Rule)</option>
                <option value="preference">ความชอบส่วนตัว (Preference)</option>
                <option value="context_fact">ข้อเท็จจริงบริบท (Context Fact)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-white/50 mb-1">เนื้อหา/รายละเอียดความจำ</label>
            <textarea
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="ระบุข้อความที่ต้องการให้ระบบจดจำเพื่อนำไปใช้ในการตอบคำถามครั้งถัดไป..."
              rows={2}
              className="w-full p-3 rounded-xl bg-[#0C0D1A] border border-[#312E81] text-xs text-white outline-none focus:border-[#7B2CFE] resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-[#0C0D1A] border border-[#312E81] text-xs text-white/50 hover:text-white"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF00FF] to-[#7B2CFE] hover:opacity-90 text-white text-xs font-bold shadow-md"
            >
              บันทึกความจำ
            </button>
          </div>
        </form>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ค้นหาในหน่วยความจำ..."
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#131525] border border-[#312E81] text-xs text-white placeholder:text-white/30 outline-none focus:border-[#7B2CFE]"
        />
      </div>

      {/* Memory Items List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMemories.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-[#131525]/90 border border-[#312E81] hover:border-[#7B2CFE] transition-all space-y-3 relative group shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#FF00FF] block">
                  {item.category.replace('_', ' ')}
                </span>
                <h4 className="text-sm font-bold text-white mt-0.5">{item.key}</h4>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 p-1 transition-opacity min-h-[32px] min-w-[32px] flex items-center justify-center"
                title="ลบรายการความจำ"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-white/90 leading-relaxed bg-[#0C0D1A] p-3 rounded-xl border border-[#312E81]">
              {item.value}
            </p>

            <div className="flex items-center justify-between text-[10px] text-white/40 pt-1">
              <span>อัปเดต: {item.updatedAt}</span>
              <span className="flex items-center gap-1 text-white/60">
                <Lock className="w-3 h-3" /> เก็บในหน่วยความจำเฉพาะอุปกรณ์
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
