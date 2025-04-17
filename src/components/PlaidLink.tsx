import React, { useCallback, useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { createLinkToken, exchangePublicToken } from '../lib/plaid';
import { Wallet, Loader2 } from 'lucide-react';

interface PlaidLinkProps {
  onSuccess?: () => void;
  onExit?: () => void;
}

export default function PlaidLink({ onSuccess, onExit }: PlaidLinkProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateToken = async () => {
      try {
        setLoading(true);
        const { link_token } = await createLinkToken();
        setLinkToken(link_token);
      } catch (err: any) {
        setError(err.message || 'Failed to generate link token');
      } finally {
        setLoading(false);
      }
    };

    generateToken();
  }, []);

  const onPlaidSuccess = useCallback(async (publicToken: string) => {
    try {
      setLoading(true);
      await exchangePublicToken(publicToken);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to exchange public token');
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (public_token) => onPlaidSuccess(public_token),
    onExit: () => {
      setError(null);
      onExit?.();
    }
  });

  if (loading) {
    return (
      <button 
        disabled
        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl opacity-50 cursor-not-allowed"
      >
        <Loader2 className="animate-spin" size={20} />
        Connecting...
      </button>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 bg-red-100 border border-red-200 rounded-lg p-4">
        {error}
      </div>
    );
  }

  return (
    <button
      onClick={() => open()}
      disabled={!ready}
      className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Wallet size={20} />
      Connect Bank Account
    </button>
  );
}