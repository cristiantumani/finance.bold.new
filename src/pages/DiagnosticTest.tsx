import { useState } from 'react';
import { supabase } from '../lib/supabase';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

export default function DiagnosticTest() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testDemoUserAccess = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('Testing demo user access...');

      // Test 1: Check current auth session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session);

      // Test 2: Try to fetch transactions for demo user
      const { data, error, count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', DEMO_USER_ID)
        .limit(5);

      console.log('Query result:', { data, error, count });

      setResult({
        session: session ? 'Authenticated' : 'Anonymous',
        userId: session?.user?.id || 'None',
        transactionCount: count,
        transactions: data,
        error: error?.message || 'None'
      });
    } catch (err: any) {
      console.error('Test error:', err);
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Demo User Diagnostic Test</h1>

        <button
          onClick={testDemoUserAccess}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Demo User Access'}
        </button>

        {result && (
          <div className="mt-8 bg-dark-800 rounded-lg p-6 border border-dark-700">
            <h2 className="text-xl font-bold text-white mb-4">Test Results</h2>
            <pre className="text-sm text-dark-200 whitespace-pre-wrap overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
