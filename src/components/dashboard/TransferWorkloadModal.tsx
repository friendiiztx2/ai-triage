import React, { useState } from 'react';
import SelectDropdown from '@/components/ui/SelectDropdown';

export interface TransferWorkloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceAgent: any;
  teamMembers: any[];
  onConfirmTransfer: (sourceAgentId: string, targetAgentId: string, count: number) => void;
}

export default function TransferWorkloadModal({
  isOpen,
  onClose,
  sourceAgent,
  teamMembers,
  onConfirmTransfer,
}: TransferWorkloadModalProps) {
  const [targetAgentId, setTargetAgentId] = useState('');
  const [count, setCount] = useState(1);

  if (!isOpen || !sourceAgent) return null;

  const handleConfirm = () => {
    if (!targetAgentId) {
      alert('กรุณาเลือกเจ้าหน้าที่รับโอนปลายทาง');
      return;
    }
    onConfirmTransfer(sourceAgent.id, targetAgentId, count);
    onClose();
  };

  const agentOptions = teamMembers
    .filter((m) => m.id !== sourceAgent.id)
    .map((m) => ({
      value: m.id,
      label: `${m.name} (${m.activeCases}/${m.maxCapacity} เคส) - ${m.status === 'online' ? '🟢 พร้อมรับ' : '🟡 งานแน่น'}`,
    }));

  return (
    <div 
      className="fixed inset-0 bg-transparent z-[9999] flex items-center justify-center p-4 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-3xl max-w-md w-full p-6 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.35)] space-y-5 animate-scale-in">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <h3 className="font-extrabold text-neutral-800 dark:text-neutral-100 text-sm flex items-center gap-2">
            🔄 โอนย้ายกระจายภาระงาน (Transfer Workload)
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 font-extrabold text-sm"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="bg-amber-50 dark:bg-amber-955/30 border border-amber-200 dark:border-amber-900/50 p-3 rounded-2xl text-amber-800 dark:text-amber-300 font-bold">
            👤 ผู้ส่งเคส:{' '}
            <span className="text-neutral-900 dark:text-neutral-100 font-extrabold">
              {sourceAgent.name}
            </span>{' '}
            (ปัจจุบันดูแลอยู่ {sourceAgent.activeCases} เคส)
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
              เลือกเจ้าหน้าที่รับโอนเคสปลายทาง:
            </label>
            <SelectDropdown
              value={targetAgentId}
              onChange={setTargetAgentId}
              options={agentOptions}
              placeholder="-- เลือกเจ้าหน้าที่ที่มี Capacity ว่าง --"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
              จำนวนเคสที่ต้องการโอนย้าย:
            </label>
            <input
              type="number"
              min={1}
              max={sourceAgent.activeCases}
              value={count}
              onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 font-bold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-indigo-600"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-xs transition cursor-pointer"
          >
            ยืนยันการโอนย้ายเคส
          </button>
        </div>
      </div>
    </div>
  );
}
