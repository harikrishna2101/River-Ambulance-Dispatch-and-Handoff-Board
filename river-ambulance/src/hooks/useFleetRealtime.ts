import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useFleetRealtime() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('fleet_and_dispatch_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'boats' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['boats'] })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dispatch_requests' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dispatches'] })
          queryClient.invalidateQueries({ queryKey: ['boats'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
