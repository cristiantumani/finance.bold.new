import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const { verifyEmail, resendVerification } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setError('No verification token provided');
        return;
      }

      try {
        await verifyEmail(token);
        setStatus('success');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err: any) {
        setStatus('error');
        setError(err.message || 'Failed to verify email');
      }
    };

    verify();
  }, [token, verifyEmail, navigate]);

  const handleResend = async () => {
    if (!email) return;

    try {
      setResending(true);
      await resendVerification(email);
      setResendSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          {status === 'verifying' ? (
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent" />
          ) : status === 'success' ? (
            <CheckCircle className="h-12 w-12 text-green-600" />
          ) : (
            <XCircle className="h-12 w-12 text-red-600" />
          )}
        </div>

        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {status === 'verifying'
            ? 'Verifying your email'
            : status === 'success'
            ? 'Email verified!'
            : 'Verification failed'}
        </h2>

        <div className="mt-4 text-center">
          {status === 'verifying' && (
            <p className="text-sm text-gray-600">
              Please wait while we verify your email address...
            </p>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Your email has been successfully verified.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting you to login...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>

              {email && (
                <div>
                  {resendSuccess ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-700">
                        A new verification email has been sent to {email}
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={handleResend}
                      disabled={resending}
                      className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-500"
                    >
                      <RefreshCw size={16} className={resending ? 'animate-spin' : ''} />
                      {resending ? 'Sending...' : 'Resend verification email'}
                    </button>
                  )}
                </div>
              )}

              <div className="flex justify-center">
                <Link
                  to="/login"
                  className="text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  Return to login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}