// ======================
// Material & Profile Data
// ======================
const MATERIAL_LIBRARY = { 
  "ABS (Generic)": { E: 320000, eps: 0.025 },
  "Polycarbonate (PC)": { E: 350000, eps: 0.020 },
  "Polypropylene (PP)": { E: 180000, eps: 0.040 },
  "Nylon 6": { E: 400000, eps: 0.015 }
};

const PROFILE_FACTORS = {
  "Rectangle – Constant Cross Section": 0.67
};

// ======================
// Dropdown Population
// ======================
const profileSelect = document.getElementById("profile");
Object.keys(PROFILE_FACTORS).forEach(p => {
  const opt = document.createElement("option");
  opt.value = p;
  opt.textContent = p;
  profileSelect.appendChild(opt);
});

const materialSelect = document.getElementById("material");

function loadSavedMaterials() {
  return JSON.parse(localStorage.getItem("customMaterials")) || {};
}

function saveMaterials(materials) {
  localStorage.setItem("customMaterials", JSON.stringify(materials));
}

function getAllMaterials() {
  return { ...MATERIAL_LIBRARY, ...loadSavedMaterials() };
}

function clearCustomMaterials() {
    localStorage.removeItem("customMaterials");
    populateMaterialDropdown(); // repopulate dropdown to reflect removal
    materialSelect.value = ""; // optional: reset selection
}


function populateMaterialDropdown() {
  materialSelect.innerHTML = "";
  const materials = getAllMaterials();
  Object.keys(materials).forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    materialSelect.appendChild(opt);
  });
}

// ======================
// Material Selection
// ======================
materialSelect.addEventListener("change", () => {
  const materials = getAllMaterials();
  const mat = materials[materialSelect.value];
  if (!mat) return;

  document.getElementById("E").value = mat.E;
  document.getElementById("eps").value = mat.eps;

  // Update chart with new material defaults
  updateParametricDefaultsAndChart();
});

function saveCurrentMaterial() {
  const name = prompt("Enter material name:");
  if (!name) return;

  const customMaterials = loadSavedMaterials();
  customMaterials[name] = {
    E: +document.getElementById("E").value,
    eps: +document.getElementById("eps").value
  };

  saveMaterials(customMaterials);
  populateMaterialDropdown();
  materialSelect.value = name;

  updateParametricDefaultsAndChart();
}

// ======================
// Snap-Fit Calculation
// ======================
function calculateSnapFit(profile, E, eps, L, h, b, mu, alphaDeg, FOS) {
    const alpha = alphaDeg * Math.PI / 180;
    const factor = PROFILE_FACTORS[profile];

    // Scale deflection and force based on FOS
    const y = factor * eps * L * L / h / FOS; // lower deflection for higher FOS
    const Z = (b * h * h) / 6;
    const P = Z * E * eps / L / FOS;          // force reduced for safety
    const W = P * ((mu + Math.tan(alpha)) / (1 - mu * Math.tan(alpha)));

    return { y, P, W };
}





function runCalculation() {
    const profile = document.getElementById("profile").value;
    const E = +document.getElementById("E").value;
    const eps = +document.getElementById("eps").value;
    const mu = +document.getElementById("mu").value;
    const alpha = +document.getElementById("alpha").value;
    const L = +document.getElementById("L").value;
    const h = +document.getElementById("h").value;
    const b = +document.getElementById("b").value;
    const FOS = +document.getElementById("fos").value || 1.5; // default

    const res = calculateSnapFit(profile, E, eps, L, h, b, mu, alpha, FOS);

    document.getElementById("results").innerHTML = `
        <strong>Permissible Deflection y:</strong> ${res.y.toFixed(4)} in<br>
        <strong>Deflection Force P:</strong> ${res.P.toFixed(2)} lbf<br>
        <strong>Mating Force W:</strong> ${res.W.toFixed(2)} lbf<br>
    `;

    updateChartFromInputs();
}



// ======================
// Parametric Defaults
// ======================
function getDefaultRangeFromValue(value) {
  const numericValue = +value;
  if (isNaN(numericValue) || numericValue === 0) return { start: 0, end: 1, step: 0.05 };

  const start = numericValue * 0.8;
  const end = numericValue * 1.2;
  const step = numericValue * 0.05;

  return { start, end, step };
}

// Update parametric input fields based on selected variable
function onParameterSelect(param) {
  const inputElement = document.getElementById(param);
  if (!inputElement) return;

  const defaults = getDefaultRangeFromValue(inputElement.value);

  document.getElementById('param-start').value = defaults.start.toFixed(4);
  document.getElementById('param-end').value = defaults.end.toFixed(4);
  document.getElementById('param-step').value = defaults.step.toFixed(4);

  updateChartFromInputs();
}

// Update defaults whenever inputs change or material/profile changes
function updateParametricDefaultsAndChart() {
  const param = document.getElementById("param-var").value;
  onParameterSelect(param);
}

// Event listener for parametric variable selection
document.getElementById("param-var").addEventListener("change", () => {
  updateParametricDefaultsAndChart();
});

// Event listeners for manual parametric input edits
["param-start", "param-end", "param-step"].forEach(id => {
  document.getElementById(id).addEventListener("input", () => updateChartFromInputs());
});

// Event listeners for removing custom material
document.getElementById("clear-custom").addEventListener("click", () => {
    if (confirm("Are you sure you want to remove all custom materials?")) {
        clearCustomMaterials();
    }
});


// ======================
// Initialize
// ======================
populateMaterialDropdown();
updateParametricDefaultsAndChart();
