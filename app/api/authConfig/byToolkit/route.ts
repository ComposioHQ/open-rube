import { NextResponse } from 'next/server';
import { getComposio } from '../../../utils/composio';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.toolkit) {
      return NextResponse.json(
        { error: 'Toolkit parameter is required' }, 
        { status: 400 }
      );
    }

    const composio = getComposio();
    const authConfig = await composio.authConfigs.list({
      toolkit: body.toolkit,
    });

    console.log(authConfig);
    return NextResponse.json(authConfig);
  } catch (error) {
    console.error('Error fetching auth config by toolkit:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auth config' }, 
      { status: 500 }
    );
  }
}