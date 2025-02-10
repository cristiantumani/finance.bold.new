import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  Plus, 
  Search,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Upload,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Calendar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { utils, writeFile } from 'xlsx';
import TransactionForm from '../components/TransactionForm';
import type { Transaction } from '../types/finance';

type TransactionWithCategory = Transaction & {
  categories: {
    name: string;
  } | null;
};

type SortField = 'date' | 'type' | 'category' | 'description' | 'amount';
type SortDirection = 'asc' | 'desc';

type SortConfig = {
  field: SortField;
  direction: SortDirection;
};

export default function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [sort, setSort] = useState<SortConfig>({ field: 'date', direction: 'desc' });
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const itemsPerPage = 10;

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          categories (
            name
          )
        `, { count: 'exact' })
        .eq('user_id', user.id);

      // Apply filters
      if (filter !== 'all') {
        query = query.eq('type', filter);
      }

      if (searchTerm) {
        query = query.or(`description.ilike.%${searchTerm}%,categories.name.ilike.%${searchTerm}%`);
      }

      // Apply sorting
      if (sort.field === 'category') {
        // For category sorting, we need to join with categories table
        query = query.order('categories(name)', { ascending: sort.direction === 'asc' });
      } else {
        // For other fields, sort directly
        switch (sort.field) {
          case 'date':
            query = query.order('date', { ascending: sort.direction === 'asc' });
            // Add created_at as secondary sort to maintain consistent order for same-date entries
            query = query.order('created_at', { ascending: sort.direction === 'asc' });
            break;
          case 'type':
            query = query.order('type', { ascending: sort.direction === 'asc' });
            break;
          case 'description':
            query = query.order('description', { ascending: sort.direction === 'asc' });
            break;
          case 'amount':
            query = query.order('amount', { ascending: sort.direction === 'asc' });
            break;
        }
      }

      // Calculate pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, count, error } = await query.range(from, to);

      if (error) throw error;

      setTransactions(data as TransactionWithCategory[]);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user, currentPage, searchTerm, filter, sort]);

  useEffect(() => {
    const fetchAvailableMonths = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('date')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (error) throw error;

        // Extract unique months from transaction dates
        const months = new Set(
          data.map(t => t.date.substring(0, 7)) // Get YYYY-MM from date
        );

        setAvailableMonths(Array.from(months));
      } catch (error) {
        console.error('Error fetching available months:', error);
      }
    };

    fetchAvailableMonths();
  }, [user]);

  const handleSort = (field: SortField) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const renderSortHeader = (field: SortField, label: string) => {
    const isActive = sort.field === field;
    return (
      <th 
        onClick={() => handleSort(field)}
        className="px-6 py-3 text-left cursor-pointer group"
      >
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium tracking-wider transition-colors ${
            isActive ? 'text-indigo-600' : 'text-gray-500 group-hover:text-gray-700'
          } uppercase`}>
            {label}
          </span>
          <div className="flex items-center">
            {isActive ? (
              sort.direction === 'asc' ? (
                <ArrowUp size={16} className="text-indigo-600" />
              ) : (
                <ArrowDown size={16} className="text-indigo-600" />
              )
            ) : (
              <ArrowUpDown size={16} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </div>
        {isActive && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
        )}
      </th>
    );
  };

  const handleAddTransaction = async (data: Omit<Transaction, 'id'>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          ...data
        }]);

      if (error) throw error;

      setIsAddModalOpen(false);
      fetchTransactions();
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const handleUpdateTransaction = async (data: Omit<Transaction, 'id'>) => {
    if (!user || !editingTransaction) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          ...data
        })
        .eq('id', editingTransaction.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setEditingTransaction(null);
      fetchTransactions();
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!user || !window.confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleDownload = async (month?: string) => {
    if (!user) return;

    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('user_id', user.id);

      if (month) {
        // If month is provided (format: YYYY-MM), filter by that month
        const startDate = `${month}-01`;
        const endDate = new Date(month.split('-')[0], parseInt(month.split('-')[1]), 0)
          .toISOString()
          .split('T')[0];
        
        query = query
          .gte('date', startDate)
          .lte('date', endDate);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;

      // Transform data for export
      const exportData = data.map(transaction => ({
        Date: new Date(transaction.date).toLocaleDateString(),
        Type: transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
        Category: transaction.categories?.name || 'Uncategorized',
        Amount: transaction.amount,
        Description: transaction.description || ''
      }));

      // Create workbook and worksheet
      const ws = utils.json_to_sheet(exportData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Transactions');

      // Generate filename
      const filename = month 
        ? `transactions_${month}.xlsx`
        : 'all_transactions.xlsx';

      // Download file
      writeFile(wb, filename);
    } catch (error) {
      console.error('Error downloading transactions:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
          <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-700 text-sm">
            ← Back to Dashboard
          </Link>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <button
              onClick={() => setShowDownloadOptions(!showDownloadOptions)}
              className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <Download size={20} />
              Download
            </button>

            {showDownloadOptions && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                <button
                  onClick={() => {
                    handleDownload();
                    setShowDownloadOptions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Download size={16} />
                  Download All Transactions
                </button>
                <div className="border-t border-gray-100 my-2" />
                <div className="px-4 py-1">
                  <p className="text-xs font-medium text-gray-500">Download by Month</p>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {availableMonths.map(month => (
                    <button
                      key={month}
                      onClick={() => {
                        handleDownload(month);
                        setShowDownloadOptions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Calendar size={16} />
                      {new Date(month + '-01').toLocaleDateString('default', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link 
            to="/upload"
            className="flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors border border-indigo-600"
          >
            <Upload size={20} />
            Import Transactions
          </Link>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
            Add Transaction
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page when search changes
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-4">
              <Filter size={20} className="text-gray-400" />
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value as 'all' | 'income' | 'expense');
                  setCurrentPage(1); // Reset to first page when filter changes
                }}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All</option>
                <option value="income">Income</option>
                <option value="expense">Expenses</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {renderSortHeader('date', 'Date')}
                {renderSortHeader('type', 'Type')}
                {renderSortHeader('category', 'Category')}
                {renderSortHeader('description', 'Description')}
                {renderSortHeader('amount', 'Amount')}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.categories?.name || 'Uncategorized'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                      {transaction.type === 'income' ? '+' : '-'}${Number(transaction.amount).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setEditingTransaction(transaction)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteTransaction(transaction.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1 rounded-md text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1 rounded-md text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <TransactionForm
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddTransaction}
        title="Add Transaction"
      />

      <TransactionForm
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSubmit={handleUpdateTransaction}
        initialData={editingTransaction || undefined}
        title="Edit Transaction"
      />
    </div>
  );
}