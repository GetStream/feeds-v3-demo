import { NextRequest, NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

const ALLOWED_ORIGINS = [
  "https://getstream.io",
  "https://staging.getstream.io",
  "https://local.getstream.io:3000",
  "http://local.getstream.io:3000",
];

function cors(origin: string | null) {
  let allowOrigin = ALLOWED_ORIGINS[0];
  if (origin) {
    if (ALLOWED_ORIGINS.includes(origin)) {
      allowOrigin = origin;
    } else if (origin.endsWith(".vercel.app")) {
      allowOrigin = origin;
    }
  }
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-csrftoken",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
    "Access-Control-Max-Age": "86400",
  };
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  return new Response(null, { status: 204, headers: cors(origin) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");

  try {
    const { id, name } = await req.json();
    if (!id) {
      return NextResponse.json(
        { error: "Missing user id" },
        { status: 400, headers: cors(origin) }
      );
    }

    const client = new StreamClient(
      process.env.NEXT_PUBLIC_STREAM_TOUR_API_KEY!,
      process.env.STREAM_TOUR_API_SECRET!,
      { basePath: "https://chat.stream-io-api.com" }
    );

    if (name) {
      await client.upsertUsers([{ id, name }]);
    }

    // await client.feeds.getOrCreateFeedGroup({
    //   id: "foryou-popular",
    //   activity_selectors: [{ type: "popular" }],
    //   ranking: {
    //     type: "expression",
    //     score:
    //       "popularity * 2 + comment_count * 3 + reaction_count * 1.5",
    //   },
    // });

    // These are needed only once per application initialization
    // await client.createBlockList({
    //   name: "feeds-api-tour-blocklist",
    //   words: ['badword', 'spam', 'inappropriate'],
    //   type: 'word',
    // });

    // await client.moderation.upsertConfig({
    //   key: 'feeds',
    //   block_list_config: {
    //     enabled: true,
    //     rules: [
    //       { name: "feeds-api-tour-blocklist", action: 'remove', team: '' },
    //     ],
    //   },
    // });

    const token = client.generateUserToken({ user_id: id });

    // Add CORS headers to the POST response too
    return NextResponse.json({ token }, { status: 200, headers: cors(origin) });
  } catch (err) {
    console.error("error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: cors(origin) }
    );
  }
}
