let chart;

// Utility: get default parametric range ±20% with 5% increments
function getDefaultRangeFromValue(value) {
    const numericValue = +value;
    if (isNaN(numericValue) || numericValue === 0) return { start: 0, end: 1, step: 0.05 };

    const start = numericValue * 0.8; // 20% below
    const end = numericValue * 1.2;   // 20% above
    const step = numericValue * 0.05; // 5% increments

    return { start, end, step };
}

// Auto-populate parametric inputs based on selected variable
function onParameterSelect(param) {
    const inputElement = document.getElementById(param);
    if (!inputElement) return;

    const defaults = getDefaultRangeFromValue(inputElement.value);

    document.getElementById('param-start').value = defaults.start.toFixed(4);
    document.getElementById('param-end').value = defaults.end.toFixed(4);
    document.getElementById('param-step').value = defaults.step.toFixed(4);

    updateChartFromInputs();
}

// Main chart update function
function updateChartFromInputs() {
    const param = document.getElementById("param-var").value;
    const start = parseFloat(document.getElementById("param-start").value);
    const end = parseFloat(document.getElementById("param-end").value);
    const step = parseFloat(document.getElementById("param-step").value);

    // Fixed inputs
    const E = +document.getElementById("E").value;
    const eps = +document.getElementById("eps").value;
    const mu = +document.getElementById("mu").value;
    const alpha = +document.getElementById("alpha").value;
    const L = +document.getElementById("L").value;
    const h = +document.getElementById("h").value;
    const b = +document.getElementById("b").value;
    const FOS = +document.getElementById("fos").value || 1.5;

    const labels = [];
    const Pvals = [];
    const Wvals = [];
    const yvals = [];

    for (let val = start; val <= end; val += step) {
        // Assign the varying parameter dynamically
        let curr_h = h, curr_b = b, curr_L = L, curr_E = E, curr_eps = eps, curr_mu = mu, curr_alpha = alpha;

        switch(param) {
            case "h": curr_h = val; break;
            case "b": curr_b = val; break;
            case "L": curr_L = val; break;
            case "E": curr_E = val; break;
            case "eps": curr_eps = val; break;
            case "mu": curr_mu = val; break;
            case "alpha": curr_alpha = val; break;
        }

        const { y, P, W } = calculateSnapFit(
            "Rectangle – Constant Cross Section",
            curr_E, curr_eps, curr_L, curr_h, curr_b, curr_mu, curr_alpha, FOS
        );

        labels.push(val.toFixed(3));
        Pvals.push(P);
        Wvals.push(W);
        yvals.push(y);
    }

    if (chart) chart.destroy();

    chart = new Chart(document.getElementById("chart"), {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                { label: "Deflection Force P (lbf)", data: Pvals, borderColor: "#00bcd4", fill: false },
                { label: "Mating Force W (lbf)", data: Wvals, borderColor: "#ff9800", fill: false },
                { label: "Permissible Deflection y (in)", data: yvals, borderColor: "#8bc34a", fill: false }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            stacked: false,
            plugins: {
                title: { display: true, text: 'Parametric Study' }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Force / Deflection' }
                }
            }
        }
    });
}

// Snap-Fit calculation scaled by Factor of Safety input
function calculateSnapFit(profile, E, eps, L, h, b, mu, alphaDeg, FOS) {
    const alpha = alphaDeg * Math.PI / 180;
    const factor = 0.67; // rectangle

    const y = factor * eps * L * L / h / FOS; // scale deflection
    const Z = b * h * h / 6;
    const P = Z * E * eps / L / FOS;          // scale force
    const W = P * ((mu + Math.tan(alpha)) / (1 - mu * Math.tan(alpha)));

    return { y, P, W };
}

// Auto-resize chart when window changes
window.addEventListener('resize', () => {
    if (chart) chart.resize();
});
