import { NextResponse } from 'next/server';
import { getComposio } from '../../utils/composio';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' }, 
        { status: 400 }
      );
    }

    const composio = getComposio();
    const connectedAccounts = await composio.connectedAccounts.list({
      userIds: [userId]
    });

    console.log('Connected accounts:', connectedAccounts);
    return NextResponse.json(connectedAccounts);
  } catch (error) {
    console.error('Error fetching connected accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connected accounts' }, 
      { status: 500 }
    );
  }
}