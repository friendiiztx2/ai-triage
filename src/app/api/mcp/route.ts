import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Model Context Protocol (MCP) Server Endpoint for AI Triage System
// Allows external AI tools or agents to query triage status, get chat issues, and analyze SLA metrics.

export async function GET(request: NextRequest) {
  return NextResponse.json({
    name: 'AI Triage MCP Server',
    version: '1.0.0',
    description: 'Model Context Protocol server for AI Triage ticket classification and status monitoring',
    endpoints: {
      tools: '/api/mcp',
    },
    tools: [
      {
        name: 'get_triage_summary',
        description: 'Returns overall chat triage statistics including urgent cases, SLA status, and categories.',
      },
      {
        name: 'list_recent_chats',
        description: 'List recent chat tickets with filtering by status or priority.',
      },
      {
        name: 'triage_chat',
        description: 'Classify and update priority/category for a given chat ticket ID.',
      }
    ]
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;

    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
    }

    switch (action) {
      case 'get_triage_summary': {
        const { data: chats, error } = await supabase.from('chats').select('status, priority, is_sla_exceeded');
        if (error) throw error;

        const total = chats?.length || 0;
        const pending = chats?.filter(c => c.status === 'pending')?.length || 0;
        const urgent = chats?.filter(c => (c.priority || '').toLowerCase() === 'urgent' || (c.priority || '').toLowerCase() === 'critical')?.length || 0;
        const slaBreached = chats?.filter(c => c.is_sla_exceeded)?.length || 0;

        return NextResponse.json({
          success: true,
          summary: {
            total_chats: total,
            pending_triage: pending,
            urgent_cases: urgent,
            sla_breached: slaBreached
          }
        });
      }

      case 'list_recent_chats': {
        const limit = params?.limit || 10;
        const status = params?.status;

        let query = supabase.from('chats').select('*, chat_issues(*)').order('created_at', { ascending: false }).limit(limit);
        if (status) {
          query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json({
          success: true,
          chats: data
        });
      }

      case 'triage_chat': {
        const { chatId, categoryId, priority, status } = params || {};
        if (!chatId) {
          return NextResponse.json({ error: 'chatId is required' }, { status: 400 });
        }

        const updatePayload: Record<string, any> = {};
        if (categoryId) updatePayload.category_id = categoryId;
        if (priority) updatePayload.priority = priority;
        if (status) updatePayload.status = status;

        const { data, error } = await supabase
          .from('chats')
          .update(updatePayload)
          .eq('id', chatId)
          .select();

        if (error) throw error;

        return NextResponse.json({
          success: true,
          updatedChat: data
        });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal MCP server error' }, { status: 500 });
  }
}
