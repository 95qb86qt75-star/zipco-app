import * as React from 'react';
import { useState } from 'react';
import type { RequestedSchedule } from '../../domain/expiredProposalSchedule';
import './expired-proposal-schedule.css';

export default function ExpiredProposalSchedule({ busy, onSelect }: {
  busy: boolean; onSelect: (schedule: RequestedSchedule) => void;
}) {
  const [mode, setMode] = useState<'IMMEDIATE' | 'SCHEDULED' | null>(null);
  const [date, setDate] = useState(''), [time, setTime] = useState('');
  return <fieldset className="zipco-schedule-request" disabled={busy}>
    <legend>Solicitar otro horario</legend>
    <p>El negocio debe confirmar el nuevo horario. Tu reserva aún no está confirmada.</p>
    <p>Usarás tu única contrapropuesta. Si el negocio la rechaza, la negociación finalizará.</p>
    <div className="zipco-schedule-choices">
      <button type="button" aria-pressed={mode === 'IMMEDIATE'} onClick={() => setMode('IMMEDIATE')}>Lo antes posible</button>
      <button type="button" aria-pressed={mode === 'SCHEDULED'} onClick={() => setMode('SCHEDULED')}>Agendar nueva fecha</button>
    </div>
    {mode === 'SCHEDULED' && <div className="zipco-schedule-choices">
      <label>Fecha de Chile<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
      <label>Hora de Chile<input type="time" value={time} onChange={e => setTime(e.target.value)} /></label>
    </div>}
    {mode === 'IMMEDIATE' && <small>Es una solicitud de horario; no garantiza atención inmediata.</small>}
    <button type="button" disabled={!mode || mode === 'SCHEDULED' && (!date || !time)}
      onClick={() => mode && onSelect(mode === 'IMMEDIATE' ? { mode } : { mode, date, time })}>
      Revisar nuevo horario
    </button>
  </fieldset>;
}
