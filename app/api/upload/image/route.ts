import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { MAX_IMAGE_BYTES, sniffImageType } from '@/lib/utils/image-upload';
import { rateLimit } from '@/lib/utils/rate-limit';

const BUCKET_NAME = 'meal-images';
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Folders and who may write to them. Kitchen imagery is for vendors (and admins).
const FOLDER_ROLES: Record<string, readonly string[]> = {
  meals: ['vendor', 'admin'],
  vendors: ['vendor', 'admin'],
  avatars: ['customer', 'vendor', 'delivery', 'admin'],
  reviews: ['customer', 'admin'],
};

// Bucket existence is checked once per server instance, not on every upload.
let bucketReady = false;

async function ensureBucketExists(serviceClient: ReturnType<typeof createServiceClient>) {
  if (bucketReady) return;
  const { data: buckets, error: listError } = await serviceClient.storage.listBuckets();
  if (listError) throw new Error(`Could not list storage buckets: ${listError.message}`);

  if (!buckets?.some((b) => b.name === BUCKET_NAME)) {
    const { error } = await serviceClient.storage.createBucket(BUCKET_NAME, {
      public: true,
      allowedMimeTypes: ALLOWED_MIME,
      fileSizeLimit: MAX_IMAGE_BYTES,
    });
    if (error && !error.message.includes('already exists')) {
      throw new Error(`Could not create storage bucket: ${error.message}`);
    }
  }
  bucketReady = true;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limit = rateLimit(`image-upload:${user.id}`, { interval: 60 * 60 * 1000, maxRequests: 20 });
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many uploads. Please try again later.' }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const requestedFolder = formData.get('folder');
    // Fixed set of folders; anything else (including "../") falls back to meals.
    const folder = typeof requestedFolder === 'string' && requestedFolder in FOLDER_ROLES
      ? requestedFolder
      : 'meals';

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5 MB.' }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .maybeSingle();
    if (!profile || profile.is_active === false || !FOLDER_ROLES[folder].includes(profile.role as string)) {
      return NextResponse.json({ error: 'You are not allowed to upload to this folder' }, { status: 403 });
    }

    // Trust the file's bytes, not the browser-sent type.
    const buffer = new Uint8Array(await file.arrayBuffer());
    const sniffed = sniffImageType(buffer);
    if (!sniffed) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      );
    }

    await ensureBucketExists(serviceClient);

    const fileName = `${folder}/${user.id}_${Date.now()}.${sniffed.ext}`;
    const { error: uploadError } = await serviceClient.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, { contentType: sniffed.mime, upsert: false });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    const { data: urlData } = serviceClient.storage.from(BUCKET_NAME).getPublicUrl(fileName);

    return NextResponse.json({ success: true, url: urlData.publicUrl, path: fileName });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
