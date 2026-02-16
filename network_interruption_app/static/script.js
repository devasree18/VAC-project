document.getElementById('analyzeBtn').addEventListener('click', runAnalysis);
const fileInput = document.getElementById('fileInput');
const dropArea = document.getElementById('dropArea');

// Handle File Input and Drag & Drop
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(name => {
    dropArea.addEventListener(name, e => { e.preventDefault(); e.stopPropagation(); }, false);
});

dropArea.addEventListener('drop', e => {
    const files = e.dataTransfer.files;
    fileInput.files = files;
    updateFileName(files[0].name);
});

fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) updateFileName(fileInput.files[0].name);
});

function updateFileName(name) {
    document.getElementById('fileName').textContent = name;
    document.getElementById('fileName').style.color = '#00d4ff';
}

// ---------------------------------------------------------
// CORE ANALYSIS LOGIC
// ---------------------------------------------------------
function runAnalysis() {
    const file = fileInput.files[0];
    const analyzeBtn = document.getElementById('analyzeBtn');

    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    const formData = new FormData();
    if (file) formData.append('file', file);

    fetch('/predict', { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-radar"></i> Analyze Traffic';

            if (data.error) {
                showToast(data.error, 'error');
                return;
            }

            showToast('System Scan Complete', 'success');

            // Update Numbers
            animateValue("totalPackets", 0, data.total_packets, 1200);
            animateValue("normalCount", 0, data.normal_count, 1200);
            animateValue("attackCount", 0, data.attack_count, 1200);

            // Force Render Graph
            if (data.trends) {
                console.log("Rendering graph with data:", data.trends);
                renderThreatGraph(data.trends);
            }

            // Smooth Scroll to Results
            setTimeout(() => {
                document.querySelector('.stats-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        })
        .catch(err => {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-radar"></i> Analyze Traffic';
            showToast('Connection Refused by Server', 'error');
        });
}

// ---------------------------------------------------------
// REFINED GRAPH RENDERING
// ---------------------------------------------------------
let myChartInstance = null;

function renderThreatGraph(trends) {
    const canvas = document.getElementById('threatChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (myChartInstance) myChartInstance.destroy();

    // Create Luxury Gradients
    const redGrad = ctx.createLinearGradient(0, 0, 0, 400);
    redGrad.addColorStop(0, 'rgba(239, 68, 68, 0.6)');
    redGrad.addColorStop(1, 'rgba(239, 68, 68, 0.05)');

    const greenGrad = ctx.createLinearGradient(0, 0, 0, 400);
    greenGrad.addColorStop(0, 'rgba(16, 185, 129, 0.6)');
    greenGrad.addColorStop(1, 'rgba(16, 185, 129, 0.05)');

    myChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: trends.labels,
            datasets: [
                {
                    label: 'Attacks Detected',
                    data: trends.attack,
                    borderColor: '#ef4444',
                    backgroundColor: redGrad,
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 3,
                    pointBackgroundColor: '#fff'
                },
                {
                    label: 'Safe Traffic',
                    data: trends.normal,
                    borderColor: '#10b981',
                    backgroundColor: greenGrad,
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 3,
                    pointBackgroundColor: '#fff'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#94a3b8', font: { family: 'Poppins', size: 12 } } }
            },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' }, beginAtZero: true }
            },
            animation: { duration: 1500, easing: 'easeOutQuart' }
        }
    });
}

// ---------------------------------------------------------
// UTILS
// ---------------------------------------------------------
function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start).toLocaleString();
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

function showToast(msg, type) {
    const toast = document.getElementById('toast');
    const msgSpan = document.getElementById('toastMsg');
    toast.className = `toast ${type}`;
    msgSpan.textContent = msg;

    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
    }, 3000);
}
