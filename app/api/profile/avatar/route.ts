import { NextRequest, NextResponse } from 'next/server';
import { imageExtensionFor } from '@/lib/utils/image-upload';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // JPEG / PNG / WebP up to 5MB; extension derived from the type, not the filename.
    const fileExt = imageExtensionFor(file);
    if (!fileExt) {
      return NextResponse.json(
        { error: 'Upload a JPEG, PNG or WebP image under 5MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(filePath, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('profiles').getPublicUrl(filePath);

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error('Avatar profile update error:', updateError);
      return NextResponse.json({ error: 'Failed to save avatar' }, { status: 500 });
    }

    return NextResponse.json({ avatar_url: publicUrl });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
