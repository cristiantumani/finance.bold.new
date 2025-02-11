import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getUserConsents, updateConsent, ConsentType } from '../lib/consent';

interface ConsentManagerProps {
  onClose: () => void;
}

export default function ConsentManager({ onClose }: ConsentManagerProps) {
  const [consents, setConsents] = useState<{
    [key in ConsentType]: boolean;
  }>({
    essential: true, // Always required
    analytics: false,
    marketing: false,
    third_party: false
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConsents = async () => {
      const userConsents = await getUserConsents();
      setConsents(prev => ({
        ...prev,
        ...Object.fromEntries(
          userConsents.map(c => [c.type, c.consented])
        )
      }));
      setLoading(false);
    };

    loadConsents();
  }, []);

  const handleConsentChange = async (type: ConsentType, value: boolean) => {
    if (type === 'essential') return; // Cannot change essential consents
    
    setConsents(prev => ({
      ...prev,
      [type]: value
    }));

    await updateConsent(type, value);
  };

  const consentDescriptions = {
    essential: 'Required for basic functionality. Cannot be disabled.',
    analytics: 'Help us improve by allowing anonymous usage tracking.',
    marketing: 'Receive updates about new features and improvements.',
    third_party: 'Allow integration with third-party services for enhanced functionality.'
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Privacy Preferences</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          We value your privacy. Choose which types of data processing you consent to:
        </p>

        <div className="space-y-4">
          {(Object.keys(consents) as ConsentType[]).map(type => (
            <div key={type} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  checked={consents[type]}
                  onChange={(e) => handleConsentChange(type, e.target.checked)}
                  disabled={type === 'essential'}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="font-medium text-gray-900 block mb-1 capitalize">
                  {type} {type === 'essential' && '(Required)'}
                </label>
                <p className="text-sm text-gray-600">
                  {consentDescriptions[type]}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}