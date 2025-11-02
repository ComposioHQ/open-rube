'use client';

import { useState } from 'react';

interface OAuthField {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}

interface OAuthInputModalProps {
  onSubmit: (values: Record<string, string>) => void;
  provider: string;
  fields: OAuthField[];
  logoUrl?: string;
}

export function OAuthInputModal({
  onSubmit,
  provider,
  fields,
  logoUrl,
}: OAuthInputModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  const handleChange = (fieldName: string, value: string) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white my-4 max-w-lg">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          {logoUrl && (
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <img
                src={logoUrl}
                alt={provider}
                className="w-7 h-7 object-contain"
              />
            </div>
          )}
          <h2 className="text-xl font-semibold text-gray-900 capitalize">
            {provider}
          </h2>
        </div>
        <p className="text-sm text-gray-600">
          Enter connection parameters for {provider}:
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 bg-gray-50">
        <div className="space-y-4">
          {fields.map(field => (
            <div key={field.name}>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {field.label}
                {field.required !== false && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type={field.type || 'text'}
                id={field.name}
                name={field.name}
                required={field.required !== false}
                placeholder={field.placeholder || field.label}
                value={values[field.name] || ''}
                onChange={e => handleChange(field.name, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm bg-white"
              />
            </div>
          ))}
        </div>

        {/* Submit button */}
        <div className="mt-6">
          <button
            type="submit"
            className="w-full px-4 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            Connect
          </button>
        </div>
      </form>
    </div>
  );
}
