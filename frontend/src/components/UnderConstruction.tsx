import React from 'react';
import { useTranslation } from 'react-i18next';

export function UnderConstruction({ title }: { title: string }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="mb-8">
        <img 
          src="/cute-cat-element-free-png.webp" 
          alt="Cute Cat Construction" 
          className="w-40 h-40 object-contain drop-shadow-md mx-auto"
          referrerPolicy="no-referrer"
        />
      </div>
      <h2 className="text-2xl font-bold text-zinc-900 mb-3">{title}</h2>
      <p className="text-zinc-500 max-w-md mx-auto leading-relaxed">
        {t('underConstruction.oops')}
      </p>
    </div>
  );
}
