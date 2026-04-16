import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import API_URL from '../config/api';

const BalanceContext = createContext();

export const useBalance = () => {
  const context = useContext(BalanceContext);
  if (!context) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return context;
};

export const BalanceProvider = ({ children, credentials }) => {
  const [exchangeBalance, setExchangeBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState(null);

  const fetchBalance = useCallback(async () => {
    if (!credentials.apiKey || !credentials.apiSecret) {
      setExchangeBalance(null);
      return;
    }

    setBalanceLoading(true);
    setBalanceError(null);

    try {
      const response = await fetch(`${API_URL}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: credentials.apiKey,
          secret: credentials.apiSecret
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.usdt_free !== undefined) {
          setExchangeBalance(data.usdt_free);
          setBalanceError(null);
        } else {
          setBalanceError('Formato de balance inválido');
        }
      } else {
        const errorData = await response.json();
        setBalanceError(errorData.detail || 'Error obteniendo balance');
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalanceError('Error de conexión');
    } finally {
      setBalanceLoading(false);
    }
  }, [credentials]);

  useEffect(() => {
    fetchBalance();
  }, [credentials, fetchBalance]);

  const value = {
    exchangeBalance,
    setExchangeBalance,
    balanceLoading,
    balanceError,
    refetchBalance: fetchBalance
  };

  return (
    <BalanceContext.Provider value={value}>
      {children}
    </BalanceContext.Provider>
  );
};
