import { NextResponse } from 'next/server';
import { getComposio } from '../../utils/composio';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.userId || !body.authConfigId) {
      return NextResponse.json(
        { error: 'userId and authConfigId are required' }, 
        { status: 400 }
      );
    }

    const composio = getComposio();
    const connectionRequest = await composio.connectedAccounts.link(
      body.userId, 
      body.authConfigId, 
      {
        callbackUrl: process.env.CALLBACK_URL
      }
    );
    
    return NextResponse.json(connectionRequest);
  } catch (error) {
    console.error('Error creating auth link:', error);
    return NextResponse.json(
      { error: 'Failed to create auth link' }, 
      { status: 500 }
    );
  }
}