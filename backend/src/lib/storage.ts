import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION ?? "us-east-1";
const bucket = process.env.S3_BUCKET ?? "questcode-avatars";
const endpoint =
  process.env.AWS_ENDPOINT ??
  (process.env.NODE_ENV === "production" ? undefined : "http://localhost:4566");
const usePathStyle = Boolean(endpoint);
const accessKeyId = process.env.AWS_ACCESS_KEY_ID ?? (endpoint ? "test" : undefined);
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY ?? (endpoint ? "test" : undefined);

const s3 = new S3Client({
  region,
  endpoint,
  forcePathStyle: usePathStyle,
  credentials: accessKeyId && secretAccessKey
    ? {
        accessKeyId,
        secretAccessKey,
      }
    : undefined,
});

export function getAvatarBucketName(): string {
  return bucket;
}

export function getAvatarPublicUrl(key: string): string {
  if (endpoint) {
    return `${endpoint}/${bucket}/${key}`;
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export function extractAvatarKeyFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (endpoint) {
      const endpointHost = new URL(endpoint).host;
      if (parsed.host !== endpointHost) return null;
      const path = parsed.pathname.replace(/^\/+/, "");
      const prefix = `${bucket}/`;
      if (!path.startsWith(prefix)) return null;
      return path.slice(prefix.length);
    }

    const virtualHost = `${bucket}.s3.${region}.amazonaws.com`;
    if (parsed.host === virtualHost) {
      return parsed.pathname.replace(/^\/+/, "") || null;
    }
    return null;
  } catch {
    return null;
  }
}

export async function createAvatarUploadUrl(params: {
  key: string;
  contentType: "image/jpeg" | "image/png" | "image/webp";
}): Promise<string> {
  return getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      ContentType: params.contentType,
    }),
    { expiresIn: 60 * 5 },
  );
}

export async function deleteAvatarObject(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}
