import React from 'react';
import { UnderConstruction } from '@/components/UnderConstruction';
import { useTranslation } from 'react-i18next';

export function Settings() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold text-zinc-900">{t('settings.title')}</h1>
      <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
        <UnderConstruction title={t('settings.accountSettings')} />
      </div>
    </div>
  );
}
