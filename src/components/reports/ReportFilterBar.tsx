import React from 'react';
import { Calendar, Filter, Building } from 'lucide-react';
import { getCategoryLabel } from '@/lib/categories';
import SelectDropdown from '@/components/ui/SelectDropdown';
import DatePicker from '@/components/ui/DatePicker';

export interface ReportFilterBarProps {
  dateRange: string;
  onDateRangeChange: (val: string) => void;
  startDate: string;
  onStartDateChange: (val: string) => void;
  endDate: string;
  onEndDateChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (val: string) => void;
  selectedPriority: string;
  onPriorityChange: (val: string) => void;
  selectedStatus: string;
  onStatusChange: (val: string) => void;
  selectedCompany: string;
  onCompanyChange: (val: string) => void;
  categories: any[];
  companies: any[];
  isSystemAdmin: boolean;
  language?: 'th' | 'en';
}

export default function ReportFilterBar({
  dateRange,
  onDateRangeChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  selectedCategory,
  onCategoryChange,
  selectedPriority,
  onPriorityChange,
  selectedStatus,
  onStatusChange,
  selectedCompany,
  onCompanyChange,
  categories,
  companies,
  isSystemAdmin,
  language = 'th',
}: ReportFilterBarProps) {
  return (
    <div className="relative z-30 backdrop-blur-xl bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/80 dark:border-neutral-800/80 p-5 rounded-[22px] shadow-xs space-y-4">
      <div className="flex items-center gap-2 font-semibold text-neutral-800 dark:text-neutral-100 text-xs uppercase tracking-wider">
        <Filter size={13} className="text-[#1a73e8]" />
        <span>{language === 'th' ? 'เงื่อนไขการคัดกรองข้อมูลรายงาน' : 'Report Filters'}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Date Presets */}
        <div className="space-y-1">
          <label className="block text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
            {language === 'th' ? 'ช่วงเวลา' : 'Date Range'}
          </label>
          <SelectDropdown
            value={dateRange}
            onChange={onDateRangeChange}
            icon={<Calendar size={14} />}
            size="md"
            options={[
              { value: 'today', label: language === 'th' ? 'วันนี้' : 'Today' },
              { value: '7days', label: language === 'th' ? 'ย้อนหลัง 7 วัน' : 'Past 7 days' },
              { value: '30days', label: language === 'th' ? 'ย้อนหลัง 30 วัน' : 'Past 30 days' },
              { value: 'custom', label: language === 'th' ? 'กำหนดช่วงเวลาเอง' : 'Custom Range' },
            ]}
          />
        </div>

        {/* Categories */}
        <div className="space-y-1">
          <label className="block text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
            {language === 'th' ? 'หมวดหมู่ปัญหา' : 'Category'}
          </label>
          <SelectDropdown
            value={selectedCategory}
            onChange={onCategoryChange}
            size="md"
            options={[
              { value: 'all', label: language === 'th' ? 'ทุกหมวดหมู่' : 'All Categories' },
              ...categories.map((c) => ({
                value: c.id || c.name,
                label: getCategoryLabel(c.id || c.name, language),
              })),
            ]}
          />
        </div>

        {/* Priority */}
        <div className="space-y-1">
          <label className="block text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
            {language === 'th' ? 'ระดับความด่วน' : 'Priority'}
          </label>
          <SelectDropdown
            value={selectedPriority}
            onChange={onPriorityChange}
            size="md"
            options={[
              { value: 'all', label: language === 'th' ? 'ทุกระดับความด่วน' : 'All Priorities' },
              { value: 'urgent', label: language === 'th' ? 'ด่วนมาก (Urgent)' : 'Urgent' },
              { value: 'high', label: language === 'th' ? 'ด่วน (High)' : 'High' },
              { value: 'medium', label: language === 'th' ? 'ปานกลาง (Medium)' : 'Medium' },
              { value: 'low', label: language === 'th' ? 'ทั่วไป (Low)' : 'Low' },
            ]}
          />
        </div>

        {/* Company Filter (for System Admin) */}
        {isSystemAdmin ? (
          <div className="space-y-1">
            <label className="block text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
              {language === 'th' ? 'บริษัทที่สังกัด' : 'Company'}
            </label>
            <SelectDropdown
              value={selectedCompany}
              onChange={onCompanyChange}
              size="md"
              options={[
                { value: 'all', label: language === 'th' ? 'ทุกบริษัท' : 'All Companies' },
                ...companies.map((c) => ({
                  value: c.id,
                  label: c.name,
                })),
              ]}
            />
          </div>
        ) : (
          <div className="space-y-1">
            <label className="block text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
              {language === 'th' ? 'สถานะการดูแล' : 'Status'}
            </label>
            <SelectDropdown
              value={selectedStatus}
              onChange={onStatusChange}
              size="md"
              options={[
                { value: 'all', label: language === 'th' ? 'ทุกสถานะ' : 'All Status' },
                { value: 'pending', label: language === 'th' ? 'รอดำเนินการ' : 'Pending' },
                { value: 'completed', label: language === 'th' ? 'เสร็จสิ้น' : 'Completed' },
              ]}
            />
          </div>
        )}
      </div>

      {/* Custom Date Pickers */}
      {dateRange === 'custom' && (
        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-500 font-medium">{language === 'th' ? 'ตั้งแต่วันที่:' : 'From:'}</span>
            <DatePicker
              value={startDate}
              onChange={onStartDateChange}
              language={language as 'th' | 'en'}
              placeholder={language === 'th' ? 'วันที่เริ่มต้น' : 'Start date'}
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-500 font-medium">{language === 'th' ? 'ถึงวันที่:' : 'To:'}</span>
            <DatePicker
              value={endDate}
              onChange={onEndDateChange}
              language={language as 'th' | 'en'}
              placeholder={language === 'th' ? 'วันที่สิ้นสุด' : 'End date'}
            />
          </div>
        </div>
      )}
    </div>
  );
}
