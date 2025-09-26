import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { toolkit } = body;
    
    console.log('Received toolkit request:', { toolkit, body });
    
    if (!toolkit) {
      return NextResponse.json({ error: 'Toolkit slug is required' }, { status: 400 });
    }

    const url = `https://backend.composio.dev/api/v3/toolkits/${toolkit}`;
    console.log('Fetching from URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 
        'x-api-key': process.env.COMPOSIO_API_KEY || '',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Successfully fetched toolkit data for:', toolkit);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching toolkit details:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch toolkit details',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}