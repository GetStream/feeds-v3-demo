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
      basePath:
        process.env.NEXT_PUBLIC_FEEDS_BASE_URL ||
        "https://chat.stream-io-api.com",
    }
  );

// Custom client using provided settings
const getCustomClient = (settings: CustomSettings) =>
  new StreamClient(settings.apiKey, settings.apiSecret, {
    basePath: settings.baseUrl,
  });

export async function POST(req: NextRequest) {
  try {
    const { user_id, name, customSettings } = await req.json();

    if (!user_id) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    // Use custom settings if provided, otherwise use default
    const client = customSettings
      ? getCustomClient(customSettings)
      : getDefaultClient();

    const usr = await client.feeds.queryFeeds({
      filter: {
        id: {
          $eq: "darko123",
        },
      },
    });
    console.log("user", usr);

    // Create or update user if name is provided
    if (name) {
      await client.upsertUsers([
        {
          id: user_id,
          name: name,
        },
      ]);
    }

    try {
      Promise.all([
        await client.feeds.createFeedView({
          id: "popular-view",
          activity_selectors: [{ type: "popular" }],
          ranking: {
            type: "expression",
            score:
              "popularity * external.weight + comment_count * external.comment_weight + external.base_score",
          },
        }),
        // await client.feeds.createFeedGroup({
        //   id: "foryou",
        // }),
      ]);
    } catch {}
    const token = client.generateUserToken({ user_id });

    return NextResponse.json({ token });
  } catch (err) {
    console.error("error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
