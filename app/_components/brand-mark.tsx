type BrandMarkProps = {
  className?: string
  title?: string
}

export function BrandMark({ className, title }: BrandMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 600 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <path d="M380 50H50V160H0V0H380V50Z" fill="currentColor" />
      <path d="M550 380V50H440V0H600V380H550Z" fill="currentColor" />
      <path d="M50 220V550H160V600H0V220H50Z" fill="currentColor" />
      <path d="M220 550H550V440H600V600H220V550Z" fill="currentColor" />
      <path d="M360 300C360 333.137 333.137 360 300 360C266.863 360 240 333.137 240 300C240 266.863 266.863 240 300 240C333.137 240 360 266.863 360 300Z" fill="currentColor" />
    </svg>
  )
}
