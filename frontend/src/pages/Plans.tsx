import React from 'react';
import { CheckCircle2, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Plans() {
  const { t } = useTranslation();

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-8">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-3xl font-bold text-zinc-900">{t('plans.title')}</h1>
        <p className="text-zinc-500 max-w-2xl mx-auto text-lg leading-relaxed">
          {t('plans.desc')}
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <div className="bg-white border-2 border-dashed border-zinc-200 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-zinc-900 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl">
            {t('plans.singlePlan')}
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
            <h2 className="text-xl font-bold text-zinc-900">Open Free</h2>
          </div>
          
          <div className="mb-6 flex items-baseline gap-2">
            <span className="text-5xl font-extrabold text-zinc-900">R$ 0</span>
            <span className="text-zinc-500 font-medium">{t('plans.forever')}</span>
          </div>
          
          <p className="text-zinc-600 mb-8 text-sm leading-relaxed">
            {t('plans.planDesc')}
          </p>
          
          <div className="space-y-4 mb-8">
            {[
              t('plans.feature1'),
              t('plans.feature2'),
              t('plans.feature3'),
              t('plans.feature4'),
              t('plans.feature5'),
              t('plans.feature6')
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-zinc-700 text-sm">{feature}</span>
              </div>
            ))}
          </div>
          
          <div className="w-full py-3 px-4 bg-zinc-100 text-zinc-500 rounded-xl text-center font-medium text-sm border border-zinc-200">
            {t('plans.activePlan')}
          </div>
        </div>
      </div>
    </div>
  );
}
