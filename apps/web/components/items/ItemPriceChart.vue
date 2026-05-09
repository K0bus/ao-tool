<template>
  <div class="relative h-[300px] w-full">
    <Line v-if="chartData" :data="chartData" :options="chartOptions" />
    <div v-else class="flex items-center justify-center h-full text-gray-500 italic">
      No historical data available for these filters
    </div>
  </div>
</template>

<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  TimeScale,
  type ChartData,
  type ChartOptions
} from 'chart.js'
import 'chartjs-adapter-date-fns'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  TimeScale
)

const props = defineProps<{
  history: Array<{
    sellPriceMin: number
    buyPriceMax: number
    timestamp: string | Date
  }>
}>()

const chartData = computed<ChartData<'line'> | null>(() => {
  if (!props.history || props.history.length === 0) return null

  return {
    labels: props.history.map(h => new Date(h.timestamp)),
    datasets: [
      {
        label: 'Sell Price Min',
        data: props.history.map(h => h.sellPriceMin > 0 ? h.sellPriceMin : null),
        borderColor: '#3b82f6', // blue-500
        backgroundColor: '#3b82f6',
        tension: 0.2,
        pointRadius: 2,
        spanGaps: true,
      },
      {
        label: 'Buy Price Max',
        data: props.history.map(h => h.buyPriceMax > 0 ? h.buyPriceMax : null),
        borderColor: '#f59e0b', // amber-500
        backgroundColor: '#f59e0b',
        tension: 0.2,
        pointRadius: 2,
        spanGaps: true,
      }
    ]
  }
})

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        color: '#9ca3af', // gray-400
        font: { size: 11 }
      }
    },
    tooltip: {
      mode: 'index',
      intersect: false,
    }
  },
  scales: {
    x: {
      type: 'time',
      time: {
        unit: 'day',
        displayFormats: {
          day: 'MMM d'
        }
      },
      grid: {
        color: '#1f2937' // gray-800
      },
      ticks: {
        color: '#6b7280', // gray-500
        maxRotation: 0,
        autoSkip: true
      }
    },
    y: {
      grid: {
        color: '#1f2937' // gray-800
      },
      ticks: {
        color: '#6b7280', // gray-500
        callback: (value) => value.toLocaleString()
      }
    }
  }
}
</script>
