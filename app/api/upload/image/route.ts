import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

const BUCKET_NAME = 'meal-images';

async function ensureBucketExists(serviceClient: ReturnType<typeof createServiceClient>) {
  // Check if bucket already exists
  const { data: buckets } = await serviceClient.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET_NAME);
  if (exists) return;

  // Create it as a public bucket so image URLs work without auth
  const { error } = await serviceClient.storage.createBucket(BUCKET_NAME, {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    fileSizeLimit: 5242880, // 5 MB
  });

  if (error && !error.message.includes('already exists')) {
    throw new Error(`Could not create storage bucket: ${error.message}`);
  }
}

const ALLOWED_FOLDERS = ['meals', 'vendors', 'avatars', 'reviews'];
const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    // Fixed set of folders; anything else (including "../") falls back to meals.
    const requestedFolder = formData.get('folder');
    const folder = typeof requestedFolder === 'string' && ALLOWED_FOLDERS.includes(requestedFolder)
      ? requestedFolder
      : 'meals';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5 MB.' },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // Auto-create the bucket on first use — no manual Supabase dashboard step needed
    await ensureBucketExists(serviceClient);

    const ext = EXTENSION_BY_TYPE[file.type];
    const fileName = `${folder}/${user.id}_${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await serviceClient.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Upload failed' },
        { status: 500 }
      );
    }

    const { data: urlData } = serviceClient.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: fileName,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

