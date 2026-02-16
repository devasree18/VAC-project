document.getElementById('analyzeBtn').addEventListener('click', analyzeNetwork);
const fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', () => {
    const fileName = fileInput.files.length > 0 ? fileInput.files[0].name : 'Choose CSV File';
    document.querySelector('.custom-file-upload span').textContent = fileName;
});

function analyzeNetwork() {
    const file = fileInput.files[0];

    // Status update
    const statusMsg = document.getElementById('statusMsg');
    statusMsg.innerHTML = '<span class="text-blue">Analyzing Network Traffic... (Please Wait)</span>';
    statusMsg.style.display = 'block';

    const formData = new FormData();
    if (file) {
        formData.append('file', file);
    }
    // If no file, we send empty formData. Backend will pick up default CSV.

    fetch('/predict', {
        method: 'POST',
        body: formData
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                statusMsg.innerHTML = `<span class="text-red">Error: ${data.error}</span>`;
                return;
            }

            // Hide status
            statusMsg.style.display = 'none';

            // Show sections
            document.getElementById('statsSection').classList.remove('hidden');
            document.getElementById('graphSection').classList.remove('hidden');

            // Update Stats
            animateValue("totalPackets", 0, data.total_packets, 1000);
            animateValue("normalCount", 0, data.normal_count, 1000);
            animateValue("attackCount", 0, data.attack_count, 1000);

            // Render Graph
            renderThreatsGraph(data.trends);
        })
        .catch(err => {
            statusMsg.innerHTML = `<span class="text-red">Server Error. Check console.</span>`;
            console.error(err);
        });
}

function renderThreatsGraph(trendsData) {
    const ctx = document.getElementById('threatsGraph').getContext('2d');

    if (window.myChart) window.myChart.destroy();

    // Create Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(255, 0, 85, 0.5)'); // Red/Pink
    gradient.addColorStop(1, 'rgba(255, 0, 85, 0.0)');

    window.myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: trendsData.labels,
            datasets: [{
                label: 'Threats Detected',
                data: trendsData.attack,
                borderColor: '#ff0055',
                backgroundColor: gradient,
                borderWidth: 2,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#ff0055',
                fill: true,
                tension: 0.4 // Smooth curve
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#e0e0e0', font: { family: 'Courier New' } }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#888' },
                    title: { display: true, text: 'Time / Packet Segments', color: '#555' }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#888' },
                    beginAtZero: true
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Simple number counting animation
function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}
