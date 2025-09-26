import { NextResponse } from 'next/server';
import { getComposio } from '../../../utils/composio';

export async function POST() {
  try {
    const composio = getComposio();
    const authConfig = await composio.authConfigs.list();

    console.log(authConfig);
    return NextResponse.json(authConfig);
  } catch (error) {
    console.error('Error fetching all auth configs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auth configs' }, 
      { status: 500 }
    );
  }
}