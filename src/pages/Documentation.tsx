import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Book, FileText, Shield, Terminal } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type DocType = 'user-guide' | 'privacy-policy' | 'terms-of-service' | 'api-documentation';

export default function Documentation() {
  const [searchParams] = useSearchParams();
  const [selectedDoc, setSelectedDoc] = useState<DocType>((searchParams.get('doc') as DocType) || 'user-guide');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docType = searchParams.get('doc') as DocType;
    if (docType) {
      setSelectedDoc(docType);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchDoc = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/docs/${selectedDoc}.md`);
        const text = await response.text();
        setContent(text);
      } catch (error) {
        console.error('Error loading documentation:', error);
        setContent('Error loading documentation. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [selectedDoc]);

  const docs = [
    { id: 'user-guide', name: 'User Guide', icon: Book },
    { id: 'privacy-policy', name: 'Privacy Policy', icon: Shield },
    { id: 'terms-of-service', name: 'Terms of Service', icon: FileText },
    { id: 'api-documentation', name: 'API Documentation', icon: Terminal }
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link 
            to="/dashboard" 
            className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mb-4"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Documentation</h1>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <nav className="space-y-1">
                {docs.map(({ id, name, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setSelectedDoc(id)}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
                      selectedDoc === id
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={16} />
                    {name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <div className="prose max-w-none">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}