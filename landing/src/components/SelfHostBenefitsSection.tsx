import React from "react";
import { DollarSign, Shield, Zap, Cpu } from "lucide-react";

export const SelfHostBenefitsSection: React.FC = () => {
  return (
    <section id="why-self-host" className="space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 text-xs font-mono">
          <Cpu className="w-3.5 h-3.5" />
          <span>Autohospedaje Inteligente</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
          Por qué autohospedar tu propio Banky
        </h2>
        <p className="text-sm text-muted max-w-xl mx-auto">
          Tus finanzas no deberían depender de servidores de terceros ni de suscripciones mensuales innecesarias.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col justify-between space-y-4 hover:border-accent/30 transition-colors">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-text">100% Gratuito y Perpetuo</h3>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Corre íntegramente dentro del Free Tier de Cloudflare: 100.000 requests/día en Workers, 5 GB y 5M lecturas/día en D1, y ancho de banda ilimitado en Pages.
            </p>
          </div>
          <div className="pt-3 border-t border-border/60 text-xs font-mono text-accent">
            Coste mensual estimado: 0,00 €
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col justify-between space-y-4 hover:border-accent/30 transition-colors">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-text">Soberanía de Datos</h3>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Tus IBANs, transacciones y balances se almacenan en tu propia base de datos D1. Nadie más tiene acceso ni puede rastrear tus finanzas.
            </p>
          </div>
          <div className="pt-3 border-t border-border/60 text-xs font-mono text-accent">
            Cero telemetría externa
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col justify-between space-y-4 hover:border-accent/30 transition-colors">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-text">Cero Mantenimiento</h3>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Sin contenedores Docker que reiniciar, sin parches de seguridad de Linux, y sin discos que se llenen. Todo administrado serverless a escala global.
            </p>
          </div>
          <div className="pt-3 border-t border-border/60 text-xs font-mono text-accent">
            Actualizaciones con un git pull
          </div>
        </div>
      </div>
    </section>
  );
};
