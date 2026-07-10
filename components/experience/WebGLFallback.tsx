'use client';

export type WebGLFallbackProps = {
  className?: string;
};

/**
 * A decorative CSS product silhouette used when WebGL cannot be created or
 * its context is lost. All story copy and controls remain in the HTML layer.
 */
export function WebGLFallback({ className = '' }: WebGLFallbackProps) {
  return (
    <div
      className={`webgl-fallback ${className}`.trim()}
      aria-hidden="true"
      data-webgl-fallback
    >
      <div className="webgl-fallback__can" />
    </div>
  );
}
