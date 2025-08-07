import { useEffect } from 'react';

interface AdBannerProps {
  slot: string;
  format?: string;
  responsive?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export function AdBanner({ 
  slot, 
  format = "auto", 
  responsive = true, 
  style, 
  className = "block" 
}: AdBannerProps) {
  useEffect(() => {
    try {
      // Push ads to AdSense queue
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  return (
    <div className={`ad-container ${className}`} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-app-pub-8626828126160251"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
      />
    </div>
  );
}

// Pre-configured ad components for common placements
export function HeaderAd() {
  return (
    <AdBanner
      slot="3935359007"
      format="horizontal"
      className="mb-4 text-center"
      style={{ minHeight: "90px" }}
    />
  );
}

export function SidebarAd() {
  return (
    <AdBanner
      slot="3935359007"
      format="rectangle"
      className="my-4"
      style={{ minHeight: "250px", maxWidth: "300px" }}
    />
  );
}

export function FooterAd() {
  return (
    <AdBanner
      slot="3935359007"
      format="horizontal"
      className="mt-6 text-center"
      style={{ minHeight: "90px" }}
    />
  );
}