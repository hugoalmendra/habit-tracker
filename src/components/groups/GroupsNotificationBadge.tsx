import { useGroupNotifications } from '@/hooks/useGroupNotifications'

interface GroupsNotificationBadgeProps {
  className?: string
}

export default function GroupsNotificationBadge({ className = '' }: GroupsNotificationBadgeProps) {
  const { totalCount } = useGroupNotifications()

  if (totalCount === 0) return null

  const displayCount = totalCount > 9 ? '9+' : totalCount.toString()

  return (
    <div
      className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 ${className}`}
    >
      {displayCount}
    </div>
  )
}
