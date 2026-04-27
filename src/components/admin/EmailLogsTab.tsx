import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Mail, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface EmailLog {
  id: string;
  created_at: string;
  order_id: string | null;
  recipient_email: string;
  recipient_type: 'owner' | 'buyer';
  subject: string | null;
  status: 'sent' | 'failed' | 'skipped';
  resend_id: string | null;
  error_message: string | null;
  source: string | null;
}

const EmailLogsTab = () => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'buyer' | 'owner' | 'failed'>('all');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) {
      toast.error('Error al cargar logs: ' + error.message);
    } else {
      setLogs((data || []) as EmailLog[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = logs.filter(l => {
    if (filter === 'all') return true;
    if (filter === 'failed') return l.status !== 'sent';
    return l.recipient_type === filter;
  });

  const stats = {
    total: logs.length,
    sentBuyer: logs.filter(l => l.recipient_type === 'buyer' && l.status === 'sent').length,
    failedBuyer: logs.filter(l => l.recipient_type === 'buyer' && l.status !== 'sent').length,
    sentOwner: logs.filter(l => l.recipient_type === 'owner' && l.status === 'sent').length,
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { bg: string; icon: any; label: string }> = {
      sent: { bg: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'ENVIADO' },
      failed: { bg: 'bg-red-100 text-red-700', icon: XCircle, label: 'FALLÓ' },
      skipped: { bg: 'bg-yellow-100 text-yellow-700', icon: AlertCircle, label: 'OMITIDO' },
    };
    const cfg = map[status] || map.failed;
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase ${cfg.bg}`}>
        <Icon size={10} /> {cfg.label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black italic uppercase">Logs de Emails</h2>
          <p className="text-sm text-zinc-500">Últimos 200 envíos a comprador y vendedor</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-black uppercase hover:bg-zinc-800"
        >
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} color="bg-zinc-100 text-zinc-900" />
        <StatCard label="✅ Comprador OK" value={stats.sentBuyer} color="bg-green-100 text-green-700" />
        <StatCard label="❌ Comprador falló" value={stats.failedBuyer} color="bg-red-100 text-red-700" />
        <StatCard label="✅ Vendedor OK" value={stats.sentOwner} color="bg-green-100 text-green-700" />
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'buyer', 'owner', 'failed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
              filter === f ? 'bg-orange-500 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'buyer' ? 'Compradores' : f === 'owner' ? 'Vendedor' : 'Fallidos'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-zinc-400">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-zinc-400 bg-zinc-50 rounded-lg">
          <Mail className="mx-auto mb-2 opacity-30" size={40} />
          No hay registros todavía
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(log => (
            <div key={log.id} className="bg-white border border-zinc-200 rounded-lg p-3 text-sm">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <StatusBadge status={log.status} />
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      log.recipient_type === 'buyer' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {log.recipient_type === 'buyer' ? 'COMPRADOR' : 'VENDEDOR'}
                    </span>
                    {log.source && (
                      <span className="text-[10px] text-zinc-400 uppercase">{log.source}</span>
                    )}
                  </div>
                  <div className="font-mono text-xs text-zinc-900 break-all">
                    📧 {log.recipient_email}
                  </div>
                  {log.subject && (
                    <div className="text-xs text-zinc-600 mt-1 truncate">{log.subject}</div>
                  )}
                  {log.order_id && (
                    <div className="text-[10px] text-zinc-400 mt-1 font-mono">
                      Orden: {log.order_id.slice(0, 8).toUpperCase()}
                    </div>
                  )}
                  {log.resend_id && (
                    <div className="text-[10px] text-zinc-400 font-mono">Resend ID: {log.resend_id}</div>
                  )}
                  {log.error_message && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-mono break-all">
                      {log.error_message}
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-zinc-400 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString('es-AR')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className={`rounded-lg p-3 ${color}`}>
    <div className="text-[10px] font-black uppercase tracking-wider opacity-70">{label}</div>
    <div className="text-2xl font-black">{value}</div>
  </div>
);

export default EmailLogsTab;
