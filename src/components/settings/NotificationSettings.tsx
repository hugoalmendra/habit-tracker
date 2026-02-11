import { useState, useEffect } from 'react'
import { usePushNotifications, NotificationPreferences } from '@/hooks/usePushNotifications'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Bell, BellOff, Smartphone, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label>{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-border'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

export default function NotificationSettings() {
  const {
    supported,
    iosPushSupported,
    permissionState,
    preferences,
    subscriptionCount,
    isLoading,
    subscribe,
    unsubscribe,
    updatePreferences,
    isSubscribing,
  } = usePushNotifications()

  const [reminderTime, setReminderTime] = useState('08:00')

  useEffect(() => {
    if (preferences?.reminder_time) {
      setReminderTime(preferences.reminder_time.substring(0, 5))
    }
  }, [preferences])

  const handleSubscribe = async () => {
    try {
      await subscribe()
    } catch (error) {
      console.error('Failed to subscribe:', error)
    }
  }

  const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    await updatePreferences({ [key]: value })
  }

  const handleReminderTimeChange = async (time: string) => {
    setReminderTime(time)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    await updatePreferences({
      reminder_time: time + ':00',
      reminder_timezone: timezone,
    })
  }

  if (isLoading) return null

  if (!supported) {
    return (
      <Card className="border-border/40 shadow-apple-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Push notifications are not supported in this browser.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!iosPushSupported) {
    return (
      <Card className="border-border/40 shadow-apple-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            To receive push notifications on iOS, add this app to your Home Screen first.
            Tap the share icon, then "Add to Home Screen".
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/40 shadow-apple-lg rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {permissionState !== 'granted' || subscriptionCount === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Enable push notifications to get reminders and updates even when the app is closed.
            </p>
            <Button
              onClick={handleSubscribe}
              disabled={isSubscribing || permissionState === 'denied'}
              className="w-full h-12 rounded-xl bg-primary text-base font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all shadow-apple-sm"
            >
              {isSubscribing ? 'Enabling...' : 'Enable Push Notifications'}
            </Button>
            {permissionState === 'denied' && (
              <p className="text-xs text-destructive">
                Notifications are blocked. Please enable them in your browser settings.
              </p>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Smartphone className="h-4 w-4" />
              <span>
                {subscriptionCount} device{subscriptionCount !== 1 ? 's' : ''} subscribed
              </span>
            </div>

            <ToggleRow
              label="All push notifications"
              description="Master switch for all push notifications"
              checked={preferences?.push_enabled ?? true}
              onChange={(v) => handleToggle('push_enabled', v)}
            />

            {preferences?.push_enabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 pl-2 border-l-2 border-border/40"
              >
                <ToggleRow
                  label="Habit reminders"
                  description="Daily reminder at your chosen time"
                  checked={preferences?.push_habit_reminders ?? true}
                  onChange={(v) => handleToggle('push_habit_reminders', v)}
                />
                {preferences?.push_habit_reminders && (
                  <div className="flex items-center gap-3 pl-4">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => handleReminderTimeChange(e.target.value)}
                      className="h-10 rounded-lg border border-border/50 bg-secondary/50 px-3 text-sm"
                    />
                  </div>
                )}

                <ToggleRow
                  label="Social activity"
                  description="Follows, reactions, and comments"
                  checked={preferences?.push_social_activity ?? true}
                  onChange={(v) => handleToggle('push_social_activity', v)}
                />
                <ToggleRow
                  label="Challenge updates"
                  description="Invites, starts, and completions"
                  checked={preferences?.push_challenge_updates ?? true}
                  onChange={(v) => handleToggle('push_challenge_updates', v)}
                />
                <ToggleRow
                  label="Shared habits"
                  description="Invites and partner completions"
                  checked={preferences?.push_shared_habits ?? true}
                  onChange={(v) => handleToggle('push_shared_habits', v)}
                />
                <ToggleRow
                  label="Achievements"
                  description="Badges and milestones"
                  checked={preferences?.push_achievements ?? true}
                  onChange={(v) => handleToggle('push_achievements', v)}
                />
              </motion.div>
            )}

            <Button
              variant="outline"
              onClick={() => unsubscribe()}
              className="w-full h-10 rounded-xl text-sm text-destructive hover:bg-destructive/10"
            >
              <BellOff className="h-4 w-4 mr-2" />
              Unsubscribe this device
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
