import { prisma } from "@albion-tool/database";

export async function sendDiscordNotification(
  embed: {
    title: string;
    description?: string;
    color?: number;
    fields?: { name: string; value: string; inline?: boolean }[];
    timestamp?: string;
    thumbnail?: { url: string };
    image?: { url: string };
    url?: string;
  },
  configKey: string = "discord_webhook_url",
) {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: configKey },
    });

    const webhookUrl = config?.value as string | undefined;
    if (
      !webhookUrl ||
      typeof webhookUrl !== "string" ||
      !webhookUrl.startsWith("http")
    ) {
      return;
    }

    const globalImageConfig = await prisma.systemConfig.findUnique({
      where: { key: "discord_embed_image_url" },
    });
    const globalImageUrl = globalImageConfig?.value as string | undefined;

    const payload = {
      embeds: [
        {
          ...embed,
          timestamp: embed.timestamp || new Date().toISOString(),
          thumbnail:
            embed.thumbnail ||
            (globalImageUrl ? { url: globalImageUrl } : undefined),
          image: embed.image || undefined,
          footer: {
            text: "Albion SilverMind — Background System",
            icon_url: globalImageUrl || undefined,
          },
        },
      ],
    };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(
        `[Discord] Failed to send notification: ${res.status} ${await res.text()}`,
      );
    }
  } catch (err) {
    console.error("[Discord] Error sending notification:", err);
  }
}

export async function sendDiscordTextMessage(
  content: string,
  configKey: string = "discord_webhook_url",
) {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: configKey },
    });

    const webhookUrl = config?.value as string | undefined;
    if (
      !webhookUrl ||
      typeof webhookUrl !== "string" ||
      !webhookUrl.startsWith("http")
    ) {
      return;
    }

    const payload = { content };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(
        `[Discord] Failed to send text message: ${res.status} ${await res.text()}`,
      );
    }
  } catch (err) {
    console.error("[Discord] Error sending text message:", err);
  }
}
