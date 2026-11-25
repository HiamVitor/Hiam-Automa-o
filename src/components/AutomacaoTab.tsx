import React from 'react';
import { Lightbulb } from 'lucide-react';
import type { SmartDevice } from '../types';

interface AutomacaoTabProps {
  devices: SmartDevice[];
  onToggleDevice: (id: string) => void;
}

export const AutomacaoTab: React.FC<AutomacaoTabProps> = ({ devices, onToggleDevice }) => {
  return (
    <section className="space-y-8">
      <header className="bg-slate-900/60 border border-slate-800/60 p-6 rounded-2xl backdrop-blur-md shadow-xl flex justify-between items-center">
        <div>
          <span className="text-xs uppercase tracking-widest text-blue-400 font-bold">
            Dispositivos Inteligentes
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-1">Painel de Automação</h2>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {devices.map((device) => (
          <div
            key={device.id}
            className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-6">
              <div
                className={`p-3 rounded-xl transition-colors ${
                  device.ativo
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                <Lightbulb className="w-6 h-6" />
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <span
                  className={`text-xs font-medium ${
                    device.ativo ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {device.ativo ? 'Ligado' : 'Desligado'}
                </span>
                <input
                  type="checkbox"
                  checked={device.ativo}
                  onChange={() => onToggleDevice(device.id)}
                  className="w-5 h-5 accent-blue-600 cursor-pointer"
                />
              </label>
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">{device.nome}</h3>
              <p className="text-xs text-slate-400 mt-1">{device.descricao}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
