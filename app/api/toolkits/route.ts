import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const url = 'https://backend.composio.dev/api/v3/toolkits';
    const options = {
      method: 'GET',
      headers: { 
        'x-api-key': process.env.COMPOSIO_API_KEY || '',
        'Content-Type': 'application/json'
      }
    };
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching toolkits:', error);
    return NextResponse.json({ error: 'Failed to fetch toolkits' }, { status: 500 });
  }
}