import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const body = await request.json();
    const { chat_id, is_correct, liked_by, issues, category_id, priority, resolution, status } = body;

    if (!chat_id) {
      return NextResponse.json({ error: 'chat_id is required' }, { status: 400 });
    }

    // 1. Update the main chat status, classification, and history logs in Supabase
    const { error: chatError } = await supabase
      .from('chats')
      .update({
        status: status || 'completed',
        category_id: category_id || null,
        priority: priority || null,
        resolution: resolution || null
      })
      .eq('id', chat_id)
      .abortSignal(controller.signal);

    if (chatError) throw chatError;

    // 2. Loop through the issues array and update each child issue in chat_issues
    const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    if (issues && Array.isArray(issues)) {
      for (const issue of issues) {
        if (!issue.id) continue;
        
        if (isUuid(issue.id)) {
          const { error: issueError } = await supabase
            .from('chat_issues')
            .update({
              category_id: issue.category_id || null,
              priority: issue.priority || null
            })
            .eq('id', issue.id)
            .abortSignal(controller.signal);

          if (issueError) {
            console.error(`Error updating chat issue ${issue.id}:`, issueError);
          }
        } else if (issue.summary) {
          try {
            await supabase
              .from('chat_issues')
              .insert({
                chat_id,
                category_id: issue.category_id || null,
                priority: issue.priority || 'low',
                summary: issue.summary,
                created_at: new Date().toISOString()
              })
              .abortSignal(controller.signal);
          } catch (insertErr) {
            console.warn('Could not insert new chat issue row:', insertErr);
          }
        }
      }
    }

    // 3. Try to log the feedback into like_results table
    try {
      await supabase
        .from('like_results')
        .insert({
          chat_id,
          is_correct,
          liked_by: liked_by || 'admin',
          created_at: new Date().toISOString()
        })
        .abortSignal(controller.signal);
    } catch (likeErr) {
      console.warn('Non-blocking: could not insert into like_results:', likeErr);
    }

    clearTimeout(timeoutId);
    return NextResponse.json({ success: true, message: 'บันทึกการแก้ไขข้อมูลเรียบร้อยแล้ว' });
  } catch (err: any) {
    clearTimeout(timeoutId);
    const errMsg = err.name === 'AbortError' ? 'Supabase connection timed out (8s)' : err.message;
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
