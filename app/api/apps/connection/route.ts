import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { getComposio } from '../../../utils/composio';

// GET: Check connection status for all toolkits for authenticated user
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || !user.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' }, 
        { status: 401 }
      );
    }

    const composio = getComposio();
    
    // Fetch connected accounts for the user
    const connectedAccounts = await composio.connectedAccounts.list({
      userIds: [user.email]
    });

    console.log('Connected accounts for user:', user.email, `(${connectedAccounts.items?.length || 0} accounts)`);

    // Get detailed info for each connected account
    const detailedAccounts = await Promise.all(
      (connectedAccounts.items || []).map(async (account) => {
        try {
          const accountDetails = await composio.connectedAccounts.get(account.id);
          // Log only essential info without sensitive data
          console.log('Account details for', account.id, ':', {
            toolkit: accountDetails.toolkit?.slug,
            connectionId: accountDetails.id,
            authConfigId: accountDetails.authConfig?.id,
            status: accountDetails.status
          });
          return accountDetails;
        } catch (error) {
          console.error('Error fetching account details for', account.id, ':', error);
          return account; // fallback to original if details fetch fails
        }
      })
    );
    
    return NextResponse.json({ connectedAccounts: detailedAccounts });
  } catch (error) {
    console.error('Error fetching connection status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connection status' }, 
      { status: 500 }
    );
  }
}

// POST: Create auth link for connecting a toolkit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authConfigId, toolkitSlug } = body;
    
    if (!authConfigId) {
      return NextResponse.json(
        { error: 'authConfigId is required' }, 
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || !user.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' }, 
        { status: 401 }
      );
    }

    console.log('Creating auth link for user:', user.email, 'toolkit:', toolkitSlug);

    const composio = getComposio();
    const connectionRequest = await composio.connectedAccounts.link(
      user.email, 
      authConfigId, 
      {
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/apps`
      }
    );
    
    console.log('Auth link created:', connectionRequest);
    return NextResponse.json(connectionRequest);
  } catch (error) {
    console.error('Error creating auth link:', error);
    return NextResponse.json(
      { error: 'Failed to create auth link' }, 
      { status: 500 }
    );
  }
}

// DELETE: Disconnect a toolkit
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId } = body;
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' }, 
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' }, 
        { status: 401 }
      );
    }

    console.log('Disconnecting account:', accountId, 'for user:', user.email);

    const composio = getComposio();
    const result = await composio.connectedAccounts.delete(accountId);
    
    console.log('Disconnect result:', result);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error disconnecting account:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect account' }, 
      { status: 500 }
    );
  }
}