import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ShareView } from '@/components/share-view';

interface SharePageProps {
  params: Promise<{
    shortId: string;
  }>;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { shortId } = await params;

  try {
    // 从服务器获取分享信息用于 OG 标签
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/shares/${shortId}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        title: 'Share Not Found',
      };
    }

    const share = await response.json();

    return {
      title: share.ogTitle || share.title || 'Shared Conversation',
      description: share.ogDescription || share.description || 'View this shared conversation',
      openGraph: {
        title: share.ogTitle || share.title,
        description: share.ogDescription || share.description,
        images: share.ogImage ? [share.ogImage] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: share.ogTitle || share.title,
        description: share.ogDescription || share.description,
        images: share.ogImage ? [share.ogImage] : [],
      },
    };
  } catch (error) {
    console.error('Failed to generate metadata:', error);
    return {
      title: 'Shared Conversation',
    };
  }
}

export default async function SharePage({ params }: SharePageProps) {
  const { shortId } = await params;

  return <ShareView shortId={shortId} />;
}
