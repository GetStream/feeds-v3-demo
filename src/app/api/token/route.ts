import { NextRequest, NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

interface CustomSettings {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
}

// Default client using environment variables
const getDefaultClient = () =>
  new StreamClient(
    process.env.NEXT_PUBLIC_STREAM_API_KEY!,
    process.env.STREAM_API_SECRET!,
    {
      basePath: process.env.NEXT_PUBLIC_FEEDS_BASE_URL,
    }
  );

// Custom client using provided settings
const getCustomClient = (settings: CustomSettings) =>
  new StreamClient(settings.apiKey, settings.apiSecret, {
    basePath: settings.baseUrl,
  });

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.time("Token Route Total");

  try {
    const { user_id, name, customSettings } = await req.json();

    if (!user_id) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    // Use custom settings if provided, otherwise use default
    const client = customSettings
      ? getCustomClient(customSettings)
      : getDefaultClient();

    // Create or update user if name is provided
    if (name) {
      console.time("Upsert User");
      await client.upsertUsers([
        {
          id: user_id,
          name: name,
        },
      ]);
      console.timeEnd("Upsert User");
    }

    try {
      Promise.all([
        await client.feeds.createFeedView({
          view_id: "popular-view",
          activity_selectors: [{ type: "popular" }],
          ranking: {
            type: "expression",
            score:
              "popularity * external.weight + comment_count * external.comment_weight + external.base_score",
          },
        }),
        await client.feeds.createFeedGroup({
          feed_group_id: "foryou",
        }),
      ]);
    } catch {}

    console.time("Generate Token");
    const token = client.generateUserToken({ user_id });
    console.timeEnd("Generate Token");

    console.timeEnd("Token Route Total");
    console.log(`Token route completed in ${Date.now() - startTime}ms`);

    return NextResponse.json({ token });
  } catch (err) {
    console.timeEnd("Token Route Total");
    console.error("Token route error:", err);
    console.log(`Token route failed after ${Date.now() - startTime}ms`);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
