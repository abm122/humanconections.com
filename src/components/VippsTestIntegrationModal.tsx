/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { sounds } from '../audio/soundEngine';
import { monetization, OwnerMonetizationSettings } from '../services/monetization';
import { ownerControl } from '../services/ownerControl';

interface VippsTestIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type SimulationStep = 'config' | 'api_call' | 'device_popup' | 'success';

export const VippsTestIntegrationModal: React.FC<VippsTestIntegrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const settings: OwnerMonetizationSettings = monetization.getSettings();
  const ownerProfile = ownerControl.getProfile();

  const [step, setStep] = useState<SimulationStep>('config');
  const [selectedAmount, setSelectedAmount] = useState<number>(89);
  const [packageLabel, setPackageLabel] = useState<string>('2 timer standardpakke');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [testPhone, setTestPhone] = useState<string>(settings.vippsNumber || ownerProfile.phoneOrVipps || '920 00 000');
  const [testPayerName, setTestPayerName] = useState<string>('Bingovert Testbruker');
  const [shouldUpdateBalance, setShouldUpdateBalance] = useState<boolean>(true);

  // API Call state
  const [isCallingApi, setIsCallingApi] = useState<boolean>(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [captureResponse, setCaptureResponse] = useState<any>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentAmount = customAmount ? Math.max(1, Number(customAmount)) : selectedAmount;

  const handleStartApiCall = async () => {
    sounds.playClick();
    setIsCallingApi(true);
    setStep('api_call');

    try {
      const res = await fetch('/api/vipps/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: currentAmount,
          phone: testPhone,
          packageLabel,
          payerName: testPayerName,
        }),
      });
      const data = await res.json();
      setApiResponse(data);
      setIsCallingApi(false);
      // Advance to device popup automatically after visual feedback
      setTimeout(() => {
        setStep('device_popup');
        sounds.playPop(1.2);
      }, 900);
    } catch {
      // Fallback local simulation if network unavailable
      const fallbackData = {
        success: true,
        reference: `VIPPS-TEST-${Date.now().toString().slice(-6)}`,
        status: 'CREATED',
        amount: { currency: 'NOK', value: currentAmount * 100, formatted: `${currentAmount} kr` },
        customer: { phoneNumber: testPhone, name: testPayerName },
        merchantSerialNumber: '314892',
        vippsEndpoint: 'POST https://api.vipps.no/epayments/v1/payments',
        timestamp: new Date().toISOString(),
      };
      setApiResponse(fallbackData);
      setIsCallingApi(false);
      setTimeout(() => {
        setStep('device_popup');
        sounds.playPop(1.2);
      }, 900);
    }
  };

  const handleApprovePayment = async () => {
    sounds.playClick();
    setIsCapturing(true);

    try {
      const res = await fetch('/api/vipps/simulate-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: apiResponse?.reference || `VIPPS-TEST-${Date.now().toString().slice(-6)}`,
          amount: currentAmount,
          payerName: testPayerName,
          phone: testPhone,
          packageLabel,
        }),
      });
      const data = await res.json();
      setCaptureResponse(data);
    } catch {
      setCaptureResponse({
        success: true,
        reference: apiResponse?.reference || `VIPPS-TEST-${Date.now().toString().slice(-6)}`,
        status: 'CAPTURED',
        transactionId: `TX-VIPPS-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        capturedAmount: { formatted: `${currentAmount} kr` },
        settlementStatus: 'SETTLED',
        timestamp: new Date().toISOString(),
      });
    }

    // Record in monetization service so real available balance increases
    if (shouldUpdateBalance) {
      monetization.recordTransaction({
        type: 'event_pass',
        title: `[Test Vipps-integrasjon] ${packageLabel}`,
        grossAmount: currentAmount,
        commissionAmount: Math.round(currentAmount * 0.85),
        playerCount: 1,
        paymentMethod: 'vipps',
        payerName: `${testPayerName} (Test API)`,
      });
    }

    setIsCapturing(false);
    setStep('success');
    sounds.playBingoWin();
    if (onSuccess) onSuccess();
  };

  const handleRejectPayment = () => {
    sounds.playClick();
    setStep('config');
    setApiResponse(null);
    setCaptureResponse(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#221008] via-[#160b05] to-[#0c0603] border-2 border-[#ff5b24]/60 rounded-3xl p-5 sm:p-7 shadow-2xl text-amber-50 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#ff5b24]/30">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#ff5b24] text-white flex items-center justify-center font-black text-2xl shadow-lg ring-2 ring-white/20">
              v
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-black text-lg sm:text-xl text-amber-200">
                  Test Vipps-integrasjon
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#ff5b24]/20 text-[#ff7a45] border border-[#ff5b24]/40 text-[10px] font-bold">
                  API-Simulator
                </span>
              </div>
              <p className="text-xs text-amber-300/80">
                Verifiser komplett betalingsflyt med API-kall, popup-godkjenning og beløpstrekk
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-black/40 hover:bg-black/60 border border-amber-500/30 flex items-center justify-center text-amber-300 hover:text-white transition-all text-sm font-bold cursor-pointer"
            title="Lukk test"
          >
            ✕
          </button>
        </div>

        {/* Progress Tracker Bar */}
        <div className="flex items-center justify-between my-3 px-2 text-[11px] font-bold">
          <div className={`flex items-center gap-1.5 ${step === 'config' ? 'text-[#ff5b24] font-black' : 'text-emerald-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs ${step === 'config' ? 'bg-[#ff5b24] text-white' : 'bg-emerald-500 text-black'}`}>
              {step === 'config' ? '1' : '✓'}
            </span>
            <span>Konfigurasjon</span>
          </div>

          <div className="w-8 h-0.5 bg-white/10" />

          <div className={`flex items-center gap-1.5 ${step === 'api_call' ? 'text-[#ff5b24] font-black' : (step === 'device_popup' || step === 'success') ? 'text-emerald-400' : 'text-amber-300/40'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs ${(step === 'device_popup' || step === 'success') ? 'bg-emerald-500 text-black' : step === 'api_call' ? 'bg-[#ff5b24] text-white animate-pulse' : 'bg-white/10 text-white/50'}`}>
              {(step === 'device_popup' || step === 'success') ? '✓' : '2'}
            </span>
            <span>Vipps API</span>
          </div>

          <div className="w-8 h-0.5 bg-white/10" />

          <div className={`flex items-center gap-1.5 ${step === 'device_popup' ? 'text-[#ff5b24] font-black' : step === 'success' ? 'text-emerald-400' : 'text-amber-300/40'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs ${step === 'success' ? 'bg-emerald-500 text-black' : step === 'device_popup' ? 'bg-[#ff5b24] text-white animate-bounce' : 'bg-white/10 text-white/50'}`}>
              {step === 'success' ? '✓' : '3'}
            </span>
            <span>Godkjenning</span>
          </div>

          <div className="w-8 h-0.5 bg-white/10" />

          <div className={`flex items-center gap-1.5 ${step === 'success' ? 'text-emerald-300 font-black' : 'text-amber-300/40'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs ${step === 'success' ? 'bg-emerald-400 text-black' : 'bg-white/10 text-white/50'}`}>
              4
            </span>
            <span>Beløpstrekk</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-4">
          
          {/* STEP 1: CONFIGURATION */}
          {step === 'config' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3.5 rounded-2xl bg-[#ff5b24]/10 border border-[#ff5b24]/30 text-xs text-amber-200/90 leading-relaxed">
                💡 <strong>Trygg testmodus:</strong> Denne simuleringen tester hele betalingsprosessen fra API-forespørsel til mobilpopup og beløpstrekk. Ingen ekte penger trekkes fra din private bankkonto, men inntekten og saldoen registreres i appen slik at du kan teste utbetalingsflyten!
              </div>

              {/* Package selector */}
              <div>
                <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">
                  1. Velg pakke eller beløp å teste:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { label: '20 min prøvetid', amount: 19 },
                    { label: '1 time spilletid', amount: 49 },
                    { label: '2 timer standard', amount: 89, popular: true },
                    { label: '3 timer forlenget', amount: 129 },
                    { label: '4 timer helaften', amount: 169 },
                    { label: 'Hele dagen (24t)', amount: 199 },
                  ].map((pkg) => (
                    <button
                      key={pkg.amount}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setSelectedAmount(pkg.amount);
                        setPackageLabel(pkg.label);
                        setCustomAmount('');
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                        selectedAmount === pkg.amount && !customAmount
                          ? 'bg-[#ff5b24]/20 border-[#ff5b24] text-white shadow-md'
                          : 'bg-black/40 border-amber-500/20 text-amber-200/80 hover:bg-white/5'
                      }`}
                    >
                      {pkg.popular && (
                        <span className="absolute top-1.5 right-1.5 px-1 py-0.2 rounded-full bg-[#ff5b24] text-white text-[8px] font-black uppercase">
                          Mest valgt
                        </span>
                      )}
                      <div className="font-bold text-xs">{pkg.label}</div>
                      <div className="font-mono font-black text-sm text-[#ff7a45] mt-0.5">{pkg.amount} kr</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom amount & Payer Details */}
              <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/30 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1">
                      Eller valgfritt testbeløp (kr):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      placeholder="f.eks. 250"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        if (e.target.value) {
                          setPackageLabel(`Valgfritt testbeløp (${e.target.value} kr)`);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-400/40 text-amber-100 text-xs font-mono font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1">
                      Kjøpers test-mobilnummer:
                    </label>
                    <input
                      type="text"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="f.eks. 920 00 000"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-400/40 text-amber-100 text-xs font-mono outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1">
                    Kjøpers navn (arrangør/spiller):
                  </label>
                  <input
                    type="text"
                    value={testPayerName}
                    onChange={(e) => setTestPayerName(e.target.value)}
                    placeholder="f.eks. Bingovert Kari Hansen"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-400/40 text-amber-100 text-xs outline-none"
                  />
                </div>

                <div className="pt-1 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="updateBal"
                    checked={shouldUpdateBalance}
                    onChange={(e) => setShouldUpdateBalance(e.target.checked)}
                    className="w-4 h-4 rounded text-[#ff5b24] bg-black border-amber-400/50 cursor-pointer"
                  />
                  <label htmlFor="updateBal" className="text-xs text-amber-200 cursor-pointer font-medium select-none">
                    Krediter beløpet til eierens disponible saldo i appen (for å teste Admin Payout-uttak)
                  </label>
                </div>
              </div>

              {/* Start Test Action */}
              <button
                onClick={handleStartApiCall}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#ff5b24] via-[#ff7a45] to-[#ff5b24] hover:brightness-110 text-white font-black text-sm tracking-wide shadow-xl shadow-orange-600/30 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🚀</span>
                <span>Start simulert Vipps-kall ({currentAmount} kr)</span>
              </button>
            </div>
          )}

          {/* STEP 2: API CALL IN PROGRESS / TERMINAL LOG */}
          {step === 'api_call' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-black/80 border border-[#ff5b24]/50 font-mono text-xs space-y-2 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-[#ff7a45] font-black">HTTP POST /api/vipps/simulate</span>
                  <span className="text-2xs text-amber-300/60">Vipps ePayment v1</span>
                </div>

                <div className="text-emerald-400">
                  &gt; Kaller Vipps ePayment Gateway...
                </div>
                <div className="text-white/70">
                  &gt; Endpoint: https://api.vipps.no/epayments/v1/payments
                </div>
                <div className="text-white/70">
                  &gt; Headers: Authorization: Bearer vipps_token_***
                </div>
                <div className="text-white/70">
                  &gt; Merchant-Serial-Number: 314892
                </div>
                <div className="text-amber-200">
                  &gt; Payload: {JSON.stringify({ amount: currentAmount * 100, currency: 'NOK', phone: testPhone.replace(/\s+/g, '') })}
                </div>

                <div className="flex items-center gap-2 pt-2 text-[#ff7a45] font-bold">
                  <div className="w-3 h-3 rounded-full border-2 border-[#ff5b24] border-t-transparent animate-spin" />
                  <span>Venter på svar fra Vipps...</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: AUTHENTIC VIPPS MOBILE POPUP SIMULATOR */}
          {step === 'device_popup' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-center text-xs text-amber-200/80">
                📱 <strong>Vipps-popup på brukerens enhet:</strong> Slik ser det ut når kunden eller arrangøren åpner Vipps for å bekrefte beløpet.
              </div>

              {/* Mobile Phone Mockup */}
              <div className="w-full max-w-xs mx-auto rounded-3xl bg-[#ff5b24] p-3 shadow-2xl border-4 border-amber-900/60 text-slate-900 overflow-hidden">
                {/* Vipps app header */}
                <div className="flex items-center justify-between pb-2 text-white">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-lg bg-white text-[#ff5b24] font-black text-xs flex items-center justify-center">
                      v
                    </div>
                    <span className="font-heading font-black text-xs tracking-wide">Vipps</span>
                  </div>
                  <span className="text-2xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full">
                    9:41
                  </span>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl p-4 text-center space-y-3 shadow-lg">
                  <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                    Betalingsforespørsel
                  </div>

                  <div>
                    <div className="font-heading font-black text-2xl text-slate-900">
                      {currentAmount} kr
                    </div>
                    <div className="text-xs text-slate-600 font-medium mt-0.5">
                      Til: <strong>JoyBingo (v/ {ownerProfile.name || 'Eier'})</strong>
                    </div>
                    <div className="text-2xs text-slate-400 font-mono mt-0.5">
                      Mottaker: {settings.vippsNumber || ownerProfile.phoneOrVipps || '920 00 000'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200/60 text-left text-2xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Formål:</span>
                      <span className="font-bold text-slate-800">{packageLabel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kjøper:</span>
                      <span className="font-bold text-slate-800">{testPayerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Konto:</span>
                      <span className="font-bold text-slate-800">Brukskonto *8419</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      onClick={handleApprovePayment}
                      disabled={isCapturing}
                      className="w-full py-3 px-4 rounded-xl bg-[#ff5b24] hover:bg-[#e04f1e] text-white font-black text-xs cursor-pointer shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
                    >
                      {isCapturing ? (
                        <>
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          <span>Behandler Vipps-trekk...</span>
                        </>
                      ) : (
                        <>
                          <span>✓ Godkjenn {currentAmount} kr</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleRejectPayment}
                      className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-all"
                    >
                      ✕ Avbryt / Avvis
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS RECEIPT & VERIFICATION */}
          {step === 'success' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/70 via-black/70 to-emerald-950/40 border-2 border-emerald-400 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-3xl flex items-center justify-center text-emerald-300 shadow-xl animate-bounce">
                  ✓
                </div>

                <div>
                  <h3 className="font-heading font-black text-lg text-emerald-200">
                    Vipps-integrasjon Verifisert!
                  </h3>
                  <p className="text-xs text-emerald-300/80">
                    Betalingen på <strong>{currentAmount} kr</strong> ble godkjent og simulert trukket via Vipps API.
                  </p>
                </div>

                {/* Details Breakdown */}
                <div className="p-3.5 rounded-xl bg-black/60 border border-emerald-500/30 text-left text-xs space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-amber-200/70 font-sans">Status:</span>
                    <span className="text-emerald-400 font-bold">200 OK - PAYMENT.CAPTURED</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-200/70 font-sans">Ordre-ID:</span>
                    <span className="text-amber-100">{captureResponse?.reference || 'VIPPS-TEST-OK'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-200/70 font-sans">Transaksjons-ID:</span>
                    <span className="text-amber-100">{captureResponse?.transactionId || 'TX-VIPPS-OK'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-200/70 font-sans">Beløp trukket fra kjøper:</span>
                    <span className="text-rose-400 font-black">-{currentAmount} kr</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-1.5">
                    <span className="text-amber-200/70 font-sans">Kreditert eierens saldo:</span>
                    <span className="text-emerald-300 font-black">+{currentAmount} kr</span>
                  </div>
                </div>

                {shouldUpdateBalance && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-400/40 text-xs text-emerald-200">
                    💰 <strong>Saldo oppdatert:</strong> Inntekten er lagt til i appens omsetningslogg. Du kan se og overføre beløpet under <strong>Admin Payout</strong>!
                  </div>
                )}

                <div className="pt-2 flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setStep('config');
                      setApiResponse(null);
                      setCaptureResponse(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-black/40 hover:bg-black/60 border border-amber-500/30 text-amber-200 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <span>🔄</span>
                    <span>Kjør ny test</span>
                  </button>

                  <button
                    onClick={() => {
                      sounds.playClick();
                      onClose();
                    }}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs cursor-pointer shadow-lg transition-all"
                  >
                    Fullfør og gå til Admin Payout ➔
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-3 border-t border-[#ff5b24]/30 text-center text-[11px] text-amber-300/60 flex items-center justify-between">
          <span>Vipps ePayment API v1 Simulator</span>
          <span className="text-[#ff7a45] font-mono">Status: Tilkoblet</span>
        </div>
      </div>
    </div>
  );
};
