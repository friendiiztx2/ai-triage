/**
 * Client-side helper utility to save admin actions into the audit log
 */
export async function saveAuditLog(action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN', details: string) {
  try {
    const savedSession = localStorage.getItem('user_session');
    if (!savedSession) return;

    const parsed = JSON.parse(savedSession);
    const body = {
      user_id: parsed.id || parsed.user_id || parsed.email || 'unknown',
      company_id: parsed.companyId || parsed.company_id || '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2',
      admin_name: parsed.name || 'Unknown Admin',
      admin_email: parsed.email || 'unknown',
      action,
      details
    };

    await fetch('/api/audit-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  } catch (err) {
    console.error('Failed to save audit log action:', err);
  }
}
