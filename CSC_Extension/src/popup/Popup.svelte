<script>
  import { onMount, onDestroy } from "svelte";
  import Chart from "chart.js/auto";

  let count = $state(0);
  let chartCanvas;
  let currentTime = $state(new Date().toLocaleTimeString());
  let timeInterval;
  let chart;

  // Modern chart data with gradient colors
  const chartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [{
      label: "Activity",
      data: [65, 78, 45, 89, 67, 92, 34],
      backgroundColor: "rgba(99, 102, 241, 0.1)",
      borderColor: "rgba(99, 102, 241, 1)",
      borderWidth: 2,
      fill: true,
      tension: 0.4
    }]
  };

  onMount(() => {
    // Set up time interval
    timeInterval = setInterval(() => {
      currentTime = new Date().toLocaleTimeString();
    }, 1000);

    // Initialize chart
    if (chartCanvas) {
      chart = new Chart(chartCanvas, {
        type: "line",
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            x: {
              display: true,
              grid: {
                display: false
              }
            },
            y: {
              display: false,
              beginAtZero: true
            }
          },
          elements: {
            point: {
              radius: 4,
              hoverRadius: 6
            }
          }
        }
      });
    }
  });

  onDestroy(() => {
    // Clean up interval
    if (timeInterval) {
      clearInterval(timeInterval);
    }
    // Clean up chart
    if (chart) {
      chart.destroy();
    }
  });

  function handleAction() {
    count++;
    // Add some animation feedback
    const button = document.querySelector('.action-btn');
    if (button) {
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = 'scale(1)';
      }, 150);
    }
  }
</script>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .container {
    width: 350px;
    min-height: 500px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 0;
    margin: 0;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .header {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    padding: 20px;
    text-align: center;
    position: relative;
  }

  .header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
  }

  .header-content {
    position: relative;
    z-index: 1;
  }

  .title {
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 8px 0;
    letter-spacing: -0.5px;
  }

  .subtitle {
    font-size: 14px;
    opacity: 0.9;
    margin: 0;
    font-weight: 400;
  }

  .time {
    font-size: 12px;
    opacity: 0.8;
    margin-top: 8px;
    font-family: 'Courier New', monospace;
  }

  .content {
    padding: 24px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 24px;
  }

  .stat-card {
    background: white;
    border-radius: 12px;
    padding: 16px;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.05);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }

  .stat-number {
    font-size: 28px;
    font-weight: 700;
    color: #6366f1;
    margin: 0 0 4px 0;
  }

  .stat-label {
    font-size: 12px;
    color: #6b7280;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .chart-container {
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.05);
  }

  .chart-title {
    font-size: 16px;
    font-weight: 600;
    color: #374151;
    margin: 0 0 16px 0;
  }

  .chart-wrapper {
    position: relative;
    height: 120px;
  }

  .action-section {
    display: flex;
    gap: 12px;
  }

  .action-btn {
    flex: 1;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    border: none;
    border-radius: 10px;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  }

  .action-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
  }

  .action-btn:active {
    transform: translateY(0);
  }

  .secondary-btn {
    flex: 1;
    background: white;
    color: #6366f1;
    border: 2px solid #6366f1;
    border-radius: 10px;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .secondary-btn:hover {
    background: #6366f1;
    color: white;
    transform: translateY(-1px);
  }

  .feature-list {
    margin-top: 20px;
    padding: 16px;
    background: rgba(99, 102, 241, 0.05);
    border-radius: 8px;
    border-left: 4px solid #6366f1;
  }

  .feature-item {
    display: flex;
    align-items: center;
    padding: 8px 0;
    font-size: 13px;
    color: #4b5563;
  }

  .feature-item::before {
    content: '✨';
    margin-right: 8px;
  }
</style>

<div class="container">
  <div class="header">
    <div class="header-content">
      <h1 class="title">CSC Extension</h1>
      <p class="subtitle">Capstone Project Dashboard</p>
      <div class="time">{currentTime}</div>
    </div>
  </div>
  
  <div class="content">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">{count}</div>
        <div class="stat-label">Actions</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">24</div>
        <div class="stat-label">Active</div>
      </div>
    </div>

    <div class="chart-container">
      <div class="chart-title">Weekly Activity</div>
      <div class="chart-wrapper">
        <canvas bind:this={chartCanvas}></canvas>
      </div>
    </div>

    <div class="action-section">
      <button class="action-btn" onclick={handleAction}>
        Take Action
      </button>
      <button class="secondary-btn">
        Settings
      </button>
    </div>

    <div class="feature-list">
      <div class="feature-item">Real-time data monitoring</div>
      <div class="feature-item">Interactive analytics dashboard</div>
      <div class="feature-item">Smart notifications system</div>
    </div>
  </div>
</div>
