"use server";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "./r2";

export async function uploadImage(formData: FormData): Promise<string | null> {
  const file = formData.get("file") as File;
  if (!file) return null;

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `report-images/${fileName}`;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: filePath,
      Body: buffer,
      ContentType: file.type,
    });

    await r2Client.send(command);

    // Return the public URL
    const publicUrl = process.env.R2_PUBLIC_URL;
    return `${publicUrl}/${filePath}`;
  } catch (error) {
    console.error("Unexpected error uploading image:", error);
    return null;
  }
}
