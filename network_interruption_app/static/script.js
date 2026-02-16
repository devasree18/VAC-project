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
            document.getElementById('tableSection').classList.remove('hidden');

            // Update Stats
            animateValue("totalPackets", 0, data.total_packets, 1000);
            animateValue("normalCount", 0, data.normal_count, 1000);
            animateValue("attackCount", 0, data.attack_count, 1000);

            // Render Table
            renderAttackTable(data.detected_incidents);
        })
        .catch(err => {
            statusMsg.innerHTML = `<span class="text-red">Server Error. Check console.</span>`;
            console.error(err);
        });
}

function renderAttackTable(attacks) {
    const tableBody = document.querySelector('#attacksTable tbody');
    tableBody.innerHTML = '';

    if (attacks.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#888;">No attacks detected.</td></tr>';
        return;
    }

    attacks.forEach(attack => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${attack.id}</td>
            <td class="text-blue">${attack.protocol_type}</td>
            <td>${attack.service}</td>
            <td>${attack.src_bytes} / ${attack.dst_bytes}</td>
            <td class="risk-high">${attack.flag}</td>
            <td class="risk-high">INTERRUPTED</td>
        `;
        tableBody.appendChild(row);
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
