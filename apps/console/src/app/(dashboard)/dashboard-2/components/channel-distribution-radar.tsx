"use client"

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import dashboardData from "../data/dashboard-data.json"

const { attribution } = dashboardData

const channels = attribution.lastTouch.map((item) => item.channel)

const radarData = channels.map((channel) => {
  const last = attribution.lastTouch.find((item) => item.channel === channel)
  const first = attribution.firstTouch.find((item) => item.channel === channel)
  const linear = attribution.linear.find((item) => item.channel === channel)
  const decay = attribution.timeDecay.find((item) => item.channel === channel)

  return {
    channel: channel.charAt(0).toUpperCase() + channel.slice(1),
    lastTouch: last?.conversions ?? 0,
    firstTouch: first?.conversions ?? 0,
    linear: linear?.conversions ?? 0,
    timeDecay: decay?.conversions ?? 0,
  }
})

export function ChannelDistributionRadar() {
  return (
    <Card className="cursor-pointer">
      <CardHeader>
        <CardTitle>Channel Distribution by Model</CardTitle>
        <CardDescription>
          Radar comparison of how attribution models distribute conversion credit across channels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid className="stroke-muted/40" />
              <PolarAngleAxis dataKey="channel" tick={{ fontSize: 11 }} />
              <Radar name="Last Touch" dataKey="lastTouch" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.15} />
              <Radar name="First Touch" dataKey="firstTouch" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.15} />
              <Radar name="Linear" dataKey="linear" stroke="var(--chart-3)" fill="var(--chart-3)" fillOpacity={0.15} />
              <Radar name="Time Decay" dataKey="timeDecay" stroke="var(--chart-4)" fill="var(--chart-4)" fillOpacity={0.15} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "var(--chart-1)" }} />
            <span className="text-xs text-muted-foreground">Last Touch</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "var(--chart-2)" }} />
            <span className="text-xs text-muted-foreground">First Touch</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "var(--chart-3)" }} />
            <span className="text-xs text-muted-foreground">Linear</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "var(--chart-4)" }} />
            <span className="text-xs text-muted-foreground">Time Decay</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
