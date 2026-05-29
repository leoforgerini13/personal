export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-brand-600/20 border border-brand-600/30 mb-2">
        <span className="text-4xl">💰</span>
      </div>
      <h1 className="text-2xl font-bold text-white">Fase 1 completa</h1>
      <p className="text-slate-400 max-w-xs leading-relaxed">
        Conecte o Supabase adicionando suas credenciais no arquivo{' '}
        <code className="text-brand-400 font-mono text-sm bg-slate-800 px-1.5 py-0.5 rounded">
          .env.local
        </code>{' '}
        para começar a usar o app.
      </p>
      <div className="mt-4 w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left space-y-2">
        <p className="text-slate-300 text-sm font-semibold">Próximos passos:</p>
        <ol className="text-slate-400 text-sm space-y-1.5 list-decimal list-inside">
          <li>Copie <code className="text-brand-400 font-mono">.env.local.example</code> para <code className="text-brand-400 font-mono">.env.local</code></li>
          <li>Preencha as credenciais do Supabase</li>
          <li>Execute a migration em <code className="text-brand-400 font-mono">supabase/migrations/001_initial.sql</code></li>
          <li>Execute o seed em <code className="text-brand-400 font-mono">supabase/seed.sql</code> substituindo o UUID</li>
        </ol>
      </div>
    </div>
  );
}
