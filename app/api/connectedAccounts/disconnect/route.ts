import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { getComposio } from '../../../utils/composio';

export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const { accountId } = body;
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' }, 
        { status: 400 }
      );
    }

    console.log('Disconnecting account:', accountId, 'for user:', user.email);

    const composio = getComposio();
    const result = await composio.connectedAccounts.delete(accountId);

    console.log('Successfully disconnected account:', accountId);
    return NextResponse.json({ 
      success: true, 
      message: 'Account disconnected successfully',
      result 
    });
  } catch (error) {
    console.error('Error disconnecting account:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect account' }, 
      { status: 500 }
    );
  }
}