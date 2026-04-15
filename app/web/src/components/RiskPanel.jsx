import React, { useState, useEffect } from 'react';
import { ShieldCheck, Calculator, Play, XCircle, RefreshCw, X } from 'lucide-react';
import API_URL from '../config/api';

const RiskPanel = ({ symbol, analysis, credentials }) => {
  const [capital, setCapital] = useState(100);
  const [riskPct, setRiskPct] = useState(1);
  const [leverage, setLeverage] = useState(10);
  const [slPrice, setSlPrice] = useState(0);
  const [tpPrice, setTpPrice] = useState(0);
  const [result, setResult] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [exchangeBalance, setExchangeBalance] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [marginMode, setMarginMode] = useState('isolated');
  const [orderType, setOrderType] = useState('limit');

  const getResolvedPositionSize = () => {
    const directSize = result?.position?.position_size;
    if (directSize && Number(directSize) > 0) return Number(directSize);

    const nestedSize = result?.position?.posicion?.cantidad;
    if (nestedSize && Number(nestedSize) > 0) return Number(nestedSize);

    return null;
  };

  useEffect(() => {
    if (analysis?.risk_recommendations) {
      const recs = analysis.risk_recommendations;
      setSlPrice(recs.stop_loss);
      setRiskPct(recs.risk_pct);
      setLeverage(recs.leverage);
    } else if (analysis?.analysis) {
      // Fallback a lógica simple si no hay recomendaciones
      const currentPrice = analysis.analysis.last_price;
      const dist = currentPrice * 0.02; 
      setSlPrice(analysis.analysis.bias === "Alcista" ? currentPrice - dist : currentPrice + dist);
    }
    
    if (analysis?.position?.tp1) {
      setTpPrice(analysis.position.tp1);
    }
  }, [analysis]);
  
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await fetch(`${API_URL}/balance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: credentials.apiKey,
            secret: credentials.apiSecret
          })
        });
        const data = await response.json();
        if (data && data.USDT) {
          setExchangeBalance(data.USDT.free);
        }
      } catch (e) {
        console.error("Error fetching balance:", e);
      }
    };
    
    fetchBalance();
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchBalance();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [credentials]);

  const calculateRisk = async () => {
    if (!analysis?.analysis) return;
    try {
      const response = await fetch(`${API_URL}/risk-management`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capital,
          risk_pct: riskPct,
          entry_price: analysis.analysis.last_price,
          stop_loss: slPrice,
          take_profit: tpPrice || null,
          leverage
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail || 'Error en el cálculo'}`);
        return;
      }
      const data = await response.json();
      setResult(data);
      if (data.plan?.tp1) {
        setTpPrice(data.plan.tp1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const executeTrade = async () => {

    if (!result || !analysis) return;
    const positionSize = getResolvedPositionSize();
    if (!positionSize) {
      alert('Error: no hay tamaño de posición válido. Actualiza cálculos de riesgo.');
      return;
    }
    
    setExecuting(true);
    try {
      const response = await fetch(`${API_URL}/execute-trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          side: analysis.analysis.bias === "Alcista" ? 'buy' : 'sell',
          amount: positionSize,
          entry_price: orderType === 'limit' ? analysis.analysis.last_price : null,
          stop_loss: slPrice,
          take_profit: tpPrice || result.plan?.tp1 || null,
          leverage: leverage,
          margin_mode: marginMode,
          order_type: orderType,
          api_key: credentials.apiKey,
          secret: credentials.apiSecret
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        alert(`Éxito: Orden ${data.clientOrderId || data.order_id} enviada (${data.side})`);
      } else {
        alert(`Error: ${data.detail}`);
      }
    } catch (e) {
      console.error(e);
      alert(`Error de ejecución: ${e.message || "Error de conexión con el motor de ejecución."}`);
    } finally {
      setExecuting(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="glass p-5 border-accent/20">
        <h3 className="text-xs font-bold text-gray-500 uppercase mb-5 flex items-center gap-2">
          <Calculator size={14} className="text-accent" /> Motor de Riesgo
        </h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[10px] text-gray-400 uppercase font-bold">Capital (USDT)</label>
              {exchangeBalance !== null && !isNaN(exchangeBalance) && (
                <span className="text-[9px] text-gray-400">
                  Fondo en Futuros: <b className={exchangeBalance < capital ? "text-short" : "text-long"}>
                    {Number(exchangeBalance).toFixed(2)} USDT
                  </b>
                </span>
              )}
            </div>
            <input 
              type="number" 
              value={capital} 
              onChange={(e) => setCapital(Number(e.target.value))}
              className="w-full bg-surface border border-border p-2 rounded text-sm outline-none focus:border-accent" 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] text-gray-400 uppercase font-bold">Riesgo %</label>
                {analysis?.risk_recommendations && (
                  <span className="text-[8px] bg-accent/20 text-accent px-1 rounded">REC</span>
                )}
              </div>
              <input 
                type="number" 
                value={riskPct} 
                onChange={(e) => setRiskPct(Number(e.target.value))}
                className="w-full bg-surface border border-border p-2 rounded text-sm outline-none focus:border-accent" 
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] text-gray-400 uppercase font-bold">Apalancamiento</label>
                {analysis?.risk_recommendations && (
                  <span className="text-[8px] bg-accent/20 text-accent px-1 rounded">REC</span>
                )}
              </div>
              <input 
                type="number" 
                value={leverage} 
                onChange={(e) => setLeverage(Number(e.target.value))}
                className="w-full bg-surface border border-border p-2 rounded text-sm outline-none focus:border-accent" 
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[10px] text-gray-400 uppercase font-bold">Stop Loss (Precio)</label>
              {analysis?.risk_recommendations?.sl_found_via_smc && (
                <span className="text-[8px] bg-long/20 text-long px-1 rounded">SMC SAFE</span>
              )}
            </div>
            <input 
              type="number" 
              value={slPrice} 
              onChange={(e) => setSlPrice(Number(e.target.value))}
              className="w-full bg-surface border border-border p-2 rounded text-sm font-mono outline-none focus:border-accent" 
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[10px] text-gray-400 uppercase font-bold">Take Profit (Precio)</label>
            </div>
            <input 
              type="number" 
              value={tpPrice} 
              onChange={(e) => setTpPrice(Number(e.target.value))}
              className="w-full bg-surface border border-border p-2 rounded text-sm font-mono outline-none focus:border-long" 
            />
          </div>

          <button 
            onClick={calculateRisk}
            className="w-full py-2 bg-white/5 border border-border rounded-lg text-xs font-bold hover:bg-white/10 transition-colors"
          >
            Actualizar Cálculos
          </button>
        </div>

        {result && (
          <div className="mt-6 pt-6 border-t border-border space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Position Size:</span>
              <span className="font-mono text-white">{result.position.position_size} {symbol.split('/')[0]}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Notional Val:</span>
              <span className="font-mono text-white">${result.position.notional_value}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Margin Used:</span>
              <span className="font-mono text-accent">${result.position.margin_required}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Potential Loss:</span>
              <span className="font-mono text-short">-${result.position.risk_amount}</span>
            </div>
            {result.plan && (
              <>
                <div className="border-t border-border/50 pt-3 mt-2">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Take Profit Levels</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">TP1 (1.5R):</span>
                  <span className="font-mono text-long">${result.plan.tp1}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">TP2 (2.5R):</span>
                  <span className="font-mono text-long">${result.plan.tp2}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">TP3 (4R):</span>
                  <span className="font-mono text-long">${result.plan.tp3}</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className={`glass p-5 border-accent/20`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase">Ejecución</h3>
        </div>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <button 
              disabled={!result || executing}
              onClick={() => setShowConfirmModal(true)}
              className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                analysis?.analysis?.bias === 'Alcista' 
                  ? 'bg-long text-black hover:opacity-90 shadow-lg shadow-long/20' 
                  : 'bg-short text-white hover:opacity-90 shadow-lg shadow-short/20'
              } disabled:opacity-20 disabled:grayscale`}
            >
              {executing ? <RefreshCw className="animate-spin" /> : <Play fill="currentColor" size={18} />}
              {executing ? 'Procesando...' : `ABRIR ${analysis?.analysis?.bias === 'Alcista' ? 'LONG' : 'SHORT'} REAL`}
            </button>
            <button className="w-full py-3 bg-white/5 border border-border rounded-xl text-xs font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
              <XCircle size={14} /> Cancelar Plan
            </button>
          </div>
          
          <div className="p-3 bg-accent/5 rounded-lg border border-accent/10 flex items-start gap-3">
            <ShieldCheck size={16} className="text-accent mt-0.5" />
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Modo <span className="text-short font-bold uppercase">Live Execution</span> activo. TP1 fijado en {result?.plan?.tp1 || '...'} con cierre automático del 50%.
            </p>
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass border border-border p-6 w-[400px] max-w-[90%]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Confirmar Orden</h3>
              <button onClick={() => setShowConfirmModal(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-gray-400">Par:</span>
                <span className="font-mono text-white">{symbol}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-gray-400">Margen:</span>
                <select 
                  value={marginMode}
                  onChange={(e) => setMarginMode(e.target.value)}
                  className="bg-surface border border-border rounded px-2 py-1 text-white outline-none"
                >
                  <option value="isolated">Aislado</option>
                  <option value="cross">Cruzado</option>
                </select>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-gray-400">Orden:</span>
                <select 
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="bg-surface border border-border rounded px-2 py-1 text-white outline-none"
                >
                  <option value="limit">Limit</option>
                  <option value="market">Market</option>
                </select>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-gray-400">Apalancamiento:</span>
                <span className="font-mono text-accent">{leverage}x</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-gray-400">Precio Actual:</span>
                <span className="font-mono text-white">${analysis?.analysis?.last_price?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-gray-400">Precio Entrada:</span>
                <input 
                  type="number"
                  value={analysis?.analysis?.last_price}
                  className="bg-surface border border-border rounded px-2 py-1 text-white font-mono w-28 text-right outline-none focus:border-accent"
                  readOnly
                />
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-gray-400">Stop Loss:</span>
                <span className="font-mono text-short">${slPrice?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-gray-400">Take Profit:</span>
                <span className="font-mono text-long">${tpPrice?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-gray-400">Cantidad:</span>
                <span className="font-mono text-white">{getResolvedPositionSize()} {symbol.split('/')[0]}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-gray-400">Ejecución:</span>
                <span className="text-short text-xs font-bold uppercase">LIVE</span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-white/5 border border-border rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  setShowConfirmModal(false);
                  executeTrade();
                }}
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
                  analysis?.analysis?.bias === 'Alcista' 
                    ? 'bg-long text-black hover:opacity-90' 
                    : 'bg-short text-white hover:opacity-90'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskPanel;
