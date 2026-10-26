import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { verifyApiAuth } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
import {
  setCompanyQuotaInMemory,
  getPackageInfoFromQuota,
  saveFallbackCompany,
} from '@/lib/companyQuotaStore';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await verifyApiAuth(request, ['system_admin', 'super_admin']);
  if (errorResponse || !session) return errorResponse!;

  const db = supabaseAdmin || supabase;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const body = await request.json();
    const {
      name,
      domain,
      monthly_quota,
      package_name,
      admin_user,
      telegram_group,
    } = body;

    if (!name || !domain) {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'กรุณาระบุชื่อบริษัทและโดเมนให้ครบถ้วน' }, { status: 400 });
    }

    const cleanName = name.trim();
    const cleanDomain = domain
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-_]/g, '');

    if (!cleanDomain) {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'รูปแบบโดเมนไม่ถูกต้อง กรุณาใช้ตัวอักษรภาษาอังกฤษหรือตัวเลข' }, { status: 400 });
    }

    const warnings: string[] = [];

    // Check if admin email already exists BEFORE creating company (if admin_user is requested)
    if (admin_user && admin_user.email && admin_user.password) {
      const cleanEmail = admin_user.email.trim().toLowerCase();
      const { data: existingUser } = await db
        .from('users')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingUser) {
        clearTimeout(timeoutId);
        return NextResponse.json(
          { error: `ชื่อผู้ใช้/อีเมล "${cleanEmail}" มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น` },
          { status: 400 }
        );
      }
    }

    // 1. Generate Security Credentials & Company Record
    const newCompanyId = crypto.randomUUID();
    const generatedClientId = `cid_${cleanDomain.replace(/[^a-z0-9]/g, '')}_${crypto.randomBytes(4).toString('hex')}`;
    const generatedClientSecret = `sec_${crypto.randomBytes(16).toString('hex')}`;

    const resolvedQuota =
      monthly_quota !== undefined && !isNaN(Number(monthly_quota))
        ? Number(monthly_quota)
        : 50000;
    const pkgInfo = getPackageInfoFromQuota(resolvedQuota);
    const resolvedPackageName = package_name || pkgInfo.name;

    const newCompany = {
      id: newCompanyId,
      name: cleanName,
      domain: cleanDomain,
      client_id: generatedClientId,
      client_secret: generatedClientSecret,
      created_at: new Date().toISOString(),
    };

    const { data: companyData, error: companyErr } = await db
      .from('companies')
      .insert([newCompany])
      .select('id, name, domain, client_id, client_secret, created_at')
      .abortSignal(controller.signal);

    if (companyErr) {
      const errText = String(companyErr.message || '');
      if (errText.includes('exceed_egress_quota') || errText.includes('restricted')) {
        warnings.push(
          'ขณะนี้ฐานข้อมูล Supabase ติดโควต้า Egress ชั่วคราว ระบบได้สร้างข้อมูลในโหมดพรีวิวเพื่อให้คุณทดสอบใบส่งมอบลูกค้าได้ทันที'
        );
      } else {
        clearTimeout(timeoutId);
        throw companyErr;
      }
    }

    // Store Quota & Fallback Company in memory
    setCompanyQuotaInMemory(newCompanyId, resolvedQuota);
    saveFallbackCompany({
      ...newCompany,
      monthly_quota: resolvedQuota,
      package_name: resolvedPackageName,
      package_badge: pkgInfo.badgeText,
      is_unlimited: pkgInfo.isUnlimited,
    });
    try {
      await db.from('companies').update({ quota: resolvedQuota }).eq('id', newCompanyId);
    } catch {}

    // 2. Seed Default Categories for the new company
    const defaultCategories = [
      {
        id: `${cleanDomain}_general_inquiry`,
        company_id: newCompanyId,
        name: 'สอบถามข้อมูลทั่วไป',
        description: 'ลูกค้าสอบถามรายละเอียดสินค้า บริการ หรือโปรโมชั่นทั่วไป',
      },
      {
        id: `${cleanDomain}_technical_issue`,
        company_id: newCompanyId,
        name: 'แจ้งปัญหาการใช้งาน / ระบบขัดข้อง',
        description: 'ลูกค้าแจ้งปัญหาระบบล่ม เข้าใช้งานไม่ได้ หรือพบข้อผิดพลาดทางเทคนิค',
      },
      {
        id: `${cleanDomain}_billing_payment`,
        company_id: newCompanyId,
        name: 'การชำระเงิน / ธุรกรรมทางการเงิน',
        description: 'ปัญหาการโอนเงิน ยอดเงินไม่เข้า ขอใบเสร็จ หรือตรวจสอบสถานะการชำระเงิน',
      },
    ];

    try {
      await db.from('categories').insert(defaultCategories);
    } catch (catErr) {
      console.warn('Initial category seed warning:', catErr);
    }

    let createdAdminInfo: { name: string; email: string; password: string; role: string } | null = null;
    let boundTelegramInfo: { group_name: string; chat_id: string } | null = null;

    // 3. Provision Initial Company Admin User (if requested)
    if (admin_user && admin_user.email && admin_user.password) {
      try {
        const cleanEmail = admin_user.email.trim().toLowerCase();
        const cleanAdminName = (admin_user.name || `Admin (${cleanName})`).trim();
        const plainPassword = admin_user.password.trim();
        const adminRole = admin_user.role === 'staff' ? 'staff' : 'admin';

        const hashedPassword = await hashPassword(plainPassword);
        const newUserRecord = {
          id: crypto.randomUUID(),
          email: cleanEmail,
          name: cleanAdminName,
          role: adminRole,
          company_id: newCompanyId,
          password: hashedPassword,
          permissions: ['dashboard', 'chats', 'kb', 'categories', 'users', 'settings'],
          created_at: new Date().toISOString(),
        };

        const { error: userErr } = await db.from('users').insert([newUserRecord]);
        createdAdminInfo = {
          name: cleanAdminName,
          email: cleanEmail,
          password: plainPassword,
          role: adminRole,
        };
        if (userErr && !String(userErr.message || '').includes('exceed_egress_quota')) {
          warnings.push(`ไม่สามารถสร้างบัญชีแอดมินได้: ${userErr.message}`);
        }
      } catch (uErr: any) {
        warnings.push(`เกิดข้อผิดพลาดในการสร้างแอดมิน: ${uErr.message}`);
      }
    }

    // 4. Bind Initial Telegram Group (if requested)
    if (telegram_group && telegram_group.chat_id && String(telegram_group.chat_id).trim()) {
      try {
        const cleanChatId = String(telegram_group.chat_id).trim();
        const cleanGroupName = (
          telegram_group.group_name || `${cleanName} - AI Alert Group`
        ).trim();

        boundTelegramInfo = { group_name: cleanGroupName, chat_id: cleanChatId };

        const { data: existingGroup } = await db
          .from('telegram_groups')
          .select('*')
          .eq('chat_id', cleanChatId)
          .maybeSingle();

        if (existingGroup) {
          const { error: tgUpdateErr } = await db
            .from('telegram_groups')
            .update({
              company_id: newCompanyId,
              is_active: true,
              group_name: cleanGroupName,
            })
            .eq('chat_id', cleanChatId);

          if (tgUpdateErr && !String(tgUpdateErr.message || '').includes('exceed_egress_quota')) {
            warnings.push(`ไม่สามารถผูกกลุ่ม Telegram ได้: ${tgUpdateErr.message}`);
          }
        } else {
          const { error: tgInsertErr } = await db.from('telegram_groups').insert([
            {
              chat_id: cleanChatId,
              group_name: cleanGroupName,
              company_id: newCompanyId,
              is_active: true,
              created_at: new Date().toISOString(),
            },
          ]);

          if (tgInsertErr && !String(tgInsertErr.message || '').includes('exceed_egress_quota')) {
            warnings.push(`ไม่สามารถสร้างกลุ่ม Telegram ได้: ${tgInsertErr.message}`);
          }
        }
      } catch (tgErr: any) {
        warnings.push(`เกิดข้อผิดพลาดในการผูกกลุ่ม Telegram: ${tgErr.message}`);
      }
    }

    // 5. Persist onboarding & quota in activity_logs so quota persists across serverless restarts
    try {
      await db.from('activity_logs').insert([
        {
          company_id: newCompanyId,
          user_id: session.id,
          user_name: session.name || 'System Admin',
          action_type: 'CREATE_COMPANY_ONBOARDING',
          details: {
            company_id: newCompanyId,
            company_name: cleanName,
            domain: cleanDomain,
            package_name: resolvedPackageName,
            new_quota: resolvedQuota,
            monthly_quota: resolvedQuota,
            is_unlimited: resolvedQuota === -1,
            admin_created: Boolean(createdAdminInfo),
            admin_email: createdAdminInfo?.email || null,
            telegram_bound: Boolean(boundTelegramInfo),
            telegram_chat_id: boundTelegramInfo?.chat_id || null,
          },
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {}

    clearTimeout(timeoutId);

    const baseCompany = companyData?.[0] || newCompany;
    return NextResponse.json({
      ...baseCompany,
      monthly_quota: resolvedQuota,
      package_name: resolvedPackageName,
      package_badge: pkgInfo.badgeText,
      is_unlimited: pkgInfo.isUnlimited,
      admin_created: Boolean(createdAdminInfo),
      admin_user: createdAdminInfo,
      telegram_bound: Boolean(boundTelegramInfo),
      telegram_group: boundTelegramInfo,
      warnings,
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    const errMsg = err.name === 'AbortError' ? 'Supabase connection timed out (30s)' : err.message;
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
