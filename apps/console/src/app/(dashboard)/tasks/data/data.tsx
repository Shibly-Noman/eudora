import {
  CheckCircle2,
  Circle,
  Clock,
  Dot,
  PlayCircle,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

type FilterOption = {
  value: string
  label: string
  icon?: LucideIcon
}

export const categories: FilterOption[] = [
  {
    value: "bug",
    label: "Bug",
  },
  {
    value: "feature",
    label: "Feature",
  },
  {
    value: "documentation",
    label: "Docs",
  },
  {
    value: "improvement",
    label: "Improvement",
  },
  {
    value: "refactor",
    label: "Refactor",
  },
]

export const statuses: FilterOption[] = [
  {
    value: "pending",
    label: "Pending",
    icon: Clock,
  },
  {
    value: "todo",
    label: "Todo",
    icon: Circle,
  },
  {
    value: "in progress",
    label: "In Progress",
    icon: PlayCircle,
  },
  {
    value: "completed",
    label: "Completed",
    icon: CheckCircle2,
  },
]

export const priorities: FilterOption[] = [
  {
    label: "Minor",
    value: "minor",
    icon: Dot,
  },
  {
    label: "Normal",
    value: "normal",
    icon: Dot,
  },
  {
    label: "Important",
    value: "important",
    icon: Dot,
  },
  {
    label: "Critical",
    value: "critical",
    icon: Dot,
  },
]
