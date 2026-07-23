import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

const LOCAL_LOG_FILE = path.join(process.cwd(), 'src', 'lib', 'audit_logs.json');

// Helper to write to local fallback JSON
function writeLocalLogs(logs: any[]) {
  try {
    const dir = path.dirname(LOCAL_LOG_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_LOG_FILE, JSON.stringify(logs, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing local audit logs:', err);
  }
}

// Helper to read from local fallback JSON
function readLocalLogs(): any[] {
  try {
    if (fs.existsSync(LOCAL_LOG_FILE)) {
      const data = fs.readFileSync(LOCAL_LOG_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading local audit logs:', err);
  }
  return [];
}

export async function GET(request: Request) {
  try {
    // 1. Attempt to fetch from Supabase
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return NextResponse.json(data);
    }

    // 2. Fallback to local logs
    console.warn('audit_logs table not available in DB, using local fallback:', error?.message);
    const localLogs = readLocalLogs().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return NextResponse.json(localLogs);
  } catch (err: any) {
    // Fallback to local logs
    const localLogs = readLocalLogs().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return NextResponse.json(localLogs);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { admin_name, admin_email, action, details } = body;

    if (!admin_name || !action || !details) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const logEntry = {
      admin_name,
      admin_email: admin_email || 'unknown',
      action,
      details,
      created_at: new Date().toISOString()
    };

    // 1. Attempt to write to Supabase
    const { data, error } = await supabase
      .from('audit_logs')
      .insert([logEntry])
      .select();

    if (!error) {
      // Also write to local logs for sync/redundancy
      const localLogs = readLocalLogs();
      localLogs.push({ ...logEntry, id: data?.[0]?.id || Math.random().toString(36).substr(2, 9) });
      writeLocalLogs(localLogs);
      return NextResponse.json(data?.[0]);
    }

    // 2. Fallback to local logs
    console.warn('audit_logs table insert failed, writing locally:', error.message);
    const localLogs = readLocalLogs();
    const newEntry = {
      id: Math.random().toString(36).substr(2, 9),
      ...logEntry
    };
    localLogs.push(newEntry);
    writeLocalLogs(localLogs);

    return NextResponse.json(newEntry);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
