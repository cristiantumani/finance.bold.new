import { supabase } from './supabase';

export async function exportUserData() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    // Fetch all user data
    const [
      { data: profile },
      { data: transactions },
      { data: categories },
      { data: budgets },
      { data: consents }
    ] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('transactions').select('*').eq('user_id', user.id),
      supabase.from('categories').select('*').eq('user_id', user.id),
      supabase.from('budgets').select('*').eq('user_id', user.id),
      supabase.from('user_consents').select('*').eq('user_id', user.id)
    ]);

    // Compile data into a structured format
    const userData = {
      profile,
      transactions,
      categories,
      budgets,
      consents,
      exportDate: new Date().toISOString(),
      user: {
        email: user.email,
        createdAt: user.created_at
      }
    };

    // Convert to JSON and create blob
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-data-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error exporting user data:', error);
    return false;
  }
}

export async function deleteUserData() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    // Delete all user data in the correct order to respect foreign key constraints
    await Promise.all([
      supabase.from('analytics_events').delete().eq('user_id', user.id),
      supabase.from('consent_audit_log').delete().eq('user_id', user.id),
      supabase.from('user_consents').delete().eq('user_id', user.id),
      supabase.from('transaction_patterns').delete().eq('user_id', user.id),
      supabase.from('ai_suggestions').delete().eq('user_id', user.id)
    ]);

    // Delete data with foreign key dependencies in the correct order
    await supabase.from('transactions').delete().eq('user_id', user.id);
    await supabase.from('budgets').delete().eq('user_id', user.id);
    await supabase.from('categories').delete().eq('user_id', user.id);
    await supabase.from('user_profiles').delete().eq('user_id', user.id);

    // Finally, delete the user account
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting user data:', error);
    return false;
  }
}

export async function cleanupInactiveData() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    // Delete analytics events older than 90 days
    await supabase
      .from('analytics_events')
      .delete()
      .eq('user_id', user.id)
      .lt('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

    // Delete old audit logs (keep last 12 months)
    await supabase
      .from('consent_audit_log')
      .delete()
      .eq('user_id', user.id)
      .lt('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

    // Delete old AI suggestions (keep last 30 days)
    await supabase
      .from('ai_suggestions')
      .delete()
      .eq('user_id', user.id)
      .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    return true;
  } catch (error) {
    console.error('Error cleaning up inactive data:', error);
    return false;
  }
}