import { type ImgHTMLAttributes, type ReactNode, useState } from 'react';

type SafeImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string | null | undefined;
  fallback?: ReactNode;
};

export function SafeImage({
  src,
  fallback = null,
  onError,
  ...imageProps
}: SafeImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const canShowImage = Boolean(src) && failedSrc !== src;

  if (!canShowImage) {
    return <>{fallback}</>;
  }

  return (
    <img
      {...imageProps}
      src={src ?? undefined}
      onError={(event) => {
        setFailedSrc(src ?? null);
        onError?.(event);
      }}
    />
  );
}
