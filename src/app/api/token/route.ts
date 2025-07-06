import { NextRequest, NextResponse } from 'next/server';
import { StreamClient } from '@stream-io/node-sdk';


console.log(process.env.NEXT_PUBLIC_STREAM_API_KEY);
console.log(process.env.STREAM_API_SECRET);
console.log(process.env.NEXT_PUBLIC_FEEDS_BASE_URL);

const client = new StreamClient(
    process.env.NEXT_PUBLIC_STREAM_API_KEY!,
    process.env.STREAM_API_SECRET!,
    {
      basePath: process.env.NEXT_PUBLIC_FEEDS_BASE_URL,
    }
);

export async function POST(req: NextRequest) {
  try {
    const { user_id, name } = await req.json();

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    // Create or update user if name is provided
    if (name) {
      await client.upsertUsers([{
        id: user_id,
        name: name
      }]);
    }

    const token = client.generateUserToken({ user_id });
    return NextResponse.json({ token });
  } catch (err) {
    console.error('Token route error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
