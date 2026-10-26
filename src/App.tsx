/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { ForcePasswordChangeModal } from './components/ForcePasswordChangeModal';
import { ProposalUploader } from './components/ProposalUploader';
import { ClientProfileForm } from './components/ClientProfileForm';
import { ComparisonTable } from './components/ComparisonTable';
import { ActionCards } from './components/ActionCards';
import { Footer } from './components/Footer';
import { UploadedProposal, ClientProfile, ComparisonResponse, AppUser } from './types';
import { 
  Sparkles, 
  ArrowRight, 
  Loader2, 
  FileSearch, 
  AlertCircle, 
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

const INITIAL_PROFILE: ClientProfile = {
  name: 'Laura Solís Vargas',
  vehicleAndUse: 'Toyota Corolla XEi 2022 · Particular',
  maxBudget: 400000,
  mandatoryCoverages: ['colision', 'robo', 'asistencia_vial'],
  priorities: 'Prioridad a buen respaldo en grúa y asistencia vial 24/7 en todo el país. Valora contar con vehículo sustituto y menor deducible si la diferencia de prima lo amerita.',
  preferredPayment: 'Anual de contado',
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [proposals, setProposals] = useState<UploadedProposal[]>([]);
  const [profile, setProfile] = useState<ClientProfile>(INITIAL_PROFILE);
  const [isComparing, setIsComparing] = useState(false);
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const resultRef = useRef<HTMLDivElement>(null);

  // Check active session on startup via GET /api/yo (Rule 4)
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      setIsCheckingAuth(true);
      const res = await fetch('/api/yo');
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.user) {
          setCurrentUser(data.user);
          // If password doesn't need to be changed, load sample proposals
          if (!data.user.debeCambiarClave) {
            loadSampleProposals();
          }
        }
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Error verificando sesión:', err);
      setCurrentUser(null);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);
    if (!user.debeCambiarClave) {
      loadSampleProposals();
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    } finally {
      setCurrentUser(null);
      setComparisonResult(null);
      setProposals([]);
    }
  };

  const handlePasswordChanged = (updatedUser: AppUser) => {
    setCurrentUser(updatedUser);
    loadSampleProposals();
  };

  const loadSampleProposals = async () => {
    try {
      setIsLoadingSamples(true);
      setErrorMessage(null);
      const res = await fetch('/api/sample-proposals');
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (!res.ok) throw new Error('No se pudieron obtener las propuestas de ejemplo');
      const data = await res.json();
      if (data.samples && Array.isArray(data.samples)) {
        setProposals(data.samples);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingSamples(false);
    }
  };

  const resetToDemoValues = () => {
    setProfile(INITIAL_PROFILE);
  };

  const handleStartComparison = async () => {
    if (proposals.length === 0) {
      setErrorMessage('Por favor suba al menos 1 propuesta en PDF antes de comparar.');
      return;
    }

    setErrorMessage(null);
    setIsComparing(true);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 1800);

    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposals,
          profile,
        }),
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al procesar las cotizaciones.');
      }

      const data: ComparisonResponse = await response.json();
      setComparisonResult(data);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 250);
    } catch (err: any) {
      console.error('Error during comparison:', err);
      setErrorMessage(err.message || 'No se pudo completar el análisis con Gemini.');
    } finally {
      clearInterval(stepInterval);
      setIsComparing(false);
    }
  };

  const handleNewComparison = () => {
    setComparisonResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadingStepsLabels = [
    'Leyendo documentos PDF con Gemini 3.8...',
    'Extrayendo primas, coberturas y deducibles...',
    'Contrastando contra presupuesto y coberturas obligatorias...',
    'Generando recomendación preliminar y mensaje para WhatsApp...',
  ];

  // Initial loading state while checking session cookie
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-[#002244] text-amber-300 flex items-center justify-center shadow-lg mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Loader2 className="w-4 h-4 animate-spin text-blue-900" />
          <span>Verificando credenciales seguras...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, render LoginScreen (Rule 1 & Rule 6)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
        <Header />
        <main className="flex-1">
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      <Header user={currentUser} onLogout={handleLogout} />

      {/* Force Password Change Modal (Rule 7) */}
      {currentUser.debeCambiarClave && (
        <ForcePasswordChangeModal
          user={currentUser}
          onPasswordChanged={handlePasswordChanged}
          onLogout={handleLogout}
        />
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Intro banner with advisor welcome */}
        <div className="bg-gradient-to-r from-blue-900 via-[#0A2540] to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold mb-2 border border-blue-400/20">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              Sesión iniciada como {currentUser.nombreCompleto} ({currentUser.rol})
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Análisis comparativo técnico y objetivo
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Cargue las cotizaciones de las aseguradoras, configure el perfil del asegurado y obtenga la matriz comparativa normalizada con semáforo y borrador para el cliente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="text-xs text-blue-200 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              {proposals.length} de 3 propuestas listas
            </span>
            {proposals.length > 0 && (
              <button
                type="button"
                onClick={handleStartComparison}
                disabled={isComparing}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isComparing ? 'Analizando...' : 'Comparar ahora'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Atención al procesar:</p>
              <p className="mt-0.5 text-xs sm:text-sm">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Sección 1: Propuestas */}
        <section aria-labelledby="section-propuestas">
          <ProposalUploader
            proposals={proposals}
            onProposalsChange={setProposals}
            onLoadSamples={loadSampleProposals}
            isLoadingSamples={isLoadingSamples}
          />
        </section>

        {/* Sección 2: Perfil del cliente */}
        <section aria-labelledby="section-perfil">
          <ClientProfileForm
            profile={profile}
            onChange={setProfile}
            onResetToDemo={resetToDemoValues}
          />
        </section>

        {/* Botón grande "Comparar propuestas" */}
        <div className="pt-2 flex flex-col items-center justify-center">
          <button
            type="button"
            onClick={handleStartComparison}
            disabled={isComparing || proposals.length === 0}
            className={`w-full sm:w-auto min-w-[320px] px-8 py-4 rounded-2xl font-extrabold text-base sm:text-lg tracking-tight text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer ${
              isComparing || proposals.length === 0
                ? 'bg-slate-400 cursor-not-allowed shadow-none opacity-70'
                : 'bg-gradient-to-r from-[#002244] via-[#0A2540] to-[#0A3663] hover:from-[#001730] hover:to-[#082a4d] hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] ring-2 ring-blue-900/20'
            }`}
          >
            {isComparing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                <span>Analizando propuestas...</span>
              </>
            ) : (
              <>
                <FileSearch className="w-6 h-6 text-amber-400" />
                <span>Comparar propuestas</span>
                <span className="text-xs bg-white/20 font-bold px-2 py-0.5 rounded-full text-blue-100">
                  {proposals.length} {proposals.length === 1 ? 'PDF' : 'PDFs'}
                </span>
              </>
            )}
          </button>

          {proposals.length === 0 && (
            <p className="text-xs text-slate-500 mt-2 text-center">
              Cargue al menos un archivo PDF arriba o haga clic en "Cargar 3 cotizaciones de prueba".
            </p>
          )}
        </div>

        {/* Indicador de "Analizando propuestas..." mientras Gemini responde */}
        {isComparing && (
          <div className="p-8 bg-white rounded-2xl border border-blue-200 shadow-md text-center max-w-xl mx-auto space-y-4 animate-fade-in">
            <div className="relative flex items-center justify-center mx-auto w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-ping opacity-75"></div>
              <div className="relative w-14 h-14 rounded-full bg-[#002244] text-white flex items-center justify-center shadow-md">
                <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Analizando propuestas con Gemini 3.8...
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Extrayendo cláusulas, validando presupuesto y aplicando reglas de negocio.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-left space-y-2">
              {loadingStepsLabels.map((lbl, idx) => {
                const isDone = idx < loadingStep;
                const isCurrent = idx === loadingStep;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2.5 text-xs transition-colors ${
                      isDone
                        ? 'text-emerald-700 font-medium'
                        : isCurrent
                        ? 'text-blue-900 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-700 shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] text-slate-400 shrink-0">
                        {idx + 1}
                      </span>
                    )}
                    <span>{lbl}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sección 3: Resultado */}
        {comparisonResult && (
          <section
            ref={resultRef}
            aria-labelledby="section-resultado"
            className="space-y-8 pt-4 scroll-mt-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#002244]">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#002244] text-white text-sm font-bold">
                  3
                </span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    Resultado del Análisis Comparativo
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Propuestas contrastadas para {profile.name || 'el cliente'} · Presupuesto: ₡ {profile.maxBudget.toLocaleString('es-CR')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNewComparison}
                className="text-xs font-semibold text-blue-900 hover:text-blue-950 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
              >
                Volver a configurar
              </button>
            </div>

            {/* Tabla Comparativa */}
            <ComparisonTable comparisons={comparisonResult.comparisons} />

            {/* Cuadros de Recomendación y Mensaje de WhatsApp */}
            <ActionCards
              recomendacion={comparisonResult.recomendacion_preliminar}
              mensajeWhatsapp={comparisonResult.mensaje_whatsapp}
              onReset={handleNewComparison}
            />
          </section>
        )}
      </main>

      {/* Texto fijo al pie */}
      <Footer />
    </div>
  );
}
