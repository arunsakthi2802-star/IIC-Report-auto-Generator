
import React from 'react';
import type { ReportData } from '../types';

interface FormFieldProps {
  id: keyof ReportData;
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: 'text' | 'date' | 'time' | 'number' | 'textarea';
  placeholder?: string;
  required?: boolean;
  rows?: number;
  children?: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = true,
  rows,
  children,
}) => {
  const commonProps = {
    id,
    name: id,
    value: value,
    onChange,
    placeholder,
    required,
    className: "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none font-bold text-black"
  };

  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {type === 'textarea' ? (
          <textarea {...commonProps} rows={rows}></textarea>
        ) : (
          <input {...commonProps} type={type} />
        )}
        {children && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {children}
            </div>
        )}
      </div>
    </div>
  );
};

export default FormField;
