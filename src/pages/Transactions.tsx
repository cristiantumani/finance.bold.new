import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
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

type FilterConfig = {
  month: string;
  type: 'all' | 'income' | 'expense';
  category: string;
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
  const [sort, setSort] = useState<SortConfig>({ field: 'date', direction: 'desc' });
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState<FilterConfig>({
    month: new Date().toISOString().slice(0, 7),
    type: 'all',
    category: 'all'
  });
  const itemsPerPage = 10;

  const fetchCategories = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

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

      // Apply month filter
      if (filters.month) {
        const startDate = `${filters.month}-01`;
        const endDate = new Date(filters.month.split('-')[0], parseInt(filters.month.split('-')[1]), 0)
          .toISOString()
          .split('T')[0];
        
        query = query
          .gte('date', startDate)
          .lte('date', endDate);
      }

      // Apply type filter
      if (filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }

      // Apply category filter
      if (filters.category !== 'all') {
        query = query.eq('category_id', filters.category);
      }

      // Apply search - Fixed the query syntax for the or condition
      if (searchTerm) {
        query = query.or(`description.ilike.%${searchTerm}%,categories.name.ilike.%${searchTerm}%`.split(','));
      }

      // Apply sorting
      if (sort.field === 'category') {
        query = query.order('categories(name)', { ascending: sort.direction === 'asc' });
      } else {
        query = query.order(sort.field, { ascending: sort.direction === 'asc' });
        if (sort.field === 'date') {
          query = query.order('created_at', { ascending: sort.direction === 'asc' });
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
    fetchCategories();
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [user, currentPage, searchTerm, filters, sort]);

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

        const months = new Set(
          data.map(t => t.date.substring(0, 7))
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
    setCurrentPage(1);
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

      const exportData = data.map(transaction => ({
        Date: new Date(transaction.date).toLocaleDateString(),
        Type: transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
        Category: transaction.categories?.name || 'Uncategorized',
        Amount: transaction.amount,
        Description: transaction.description || ''
      }));

      const ws = utils.json_to_sheet(exportData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Transactions');

      const filename = month 
        ? `transactions_${month}.xlsx`
        : 'all_transactions.xlsx';

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
            Import
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

      <div className="bg-dark-800 rounded-xl shadow-sm border border-dark-700 overflow-hidden">
        <div className="p-4 border-b border-dark-700">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" size={20} />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4">
                <select
                  value={filters.month}
                  onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
                  className="bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {availableMonths.map(month => (
                    <option key={month} value={month}>
                      {new Date(month + '-01').toLocaleDateString('default', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    type: e.target.value as 'all' | 'income' | 'expense'
                  }))}
                  className="bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expenses</option>
                </select>

                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-900/50">
                {renderSortHeader('date', 'Date')}
                {renderSortHeader('type', 'Type')}
                {renderSortHeader('category', 'Category')}
                {renderSortHeader('description', 'Description')}
                {renderSortHeader('amount', 'Amount')}
                <th className="px-6 py-3 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-dark-800 divide-y divide-dark-700">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-dark-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      transaction.type === 'income' ? 'bg-emerald-900/20 text-emerald-400' : 'bg-red-900/20 text-red-400'
                    }`}>
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100">
                    {transaction.categories?.name || 'Uncategorized'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={transaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'}>
                      {transaction.type === 'income' ? '+' : '-'}${Number(transaction.amount).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setEditingTransaction(transaction)}
                      className="text-indigo-400 hover:text-indigo-300 mr-4"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteTransaction(transaction.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-dark-400">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-dark-700 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1 rounded-md text-sm text-dark-200 hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <span className="text-sm text-dark-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1 rounded-md text-sm text-dark-200 hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
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