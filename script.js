const CAMPUS_LOCATIONS = {
    "Main Campus Areas": ["MAC Lab", "SAO", "Quadrangle", "Chapel"],
    "Admin Building": ["Admin Offices", "Faculty Room", "Student Lounge", "A301", "A302", "A303", "A304", "A305", "A501", "A502", "A503", "A504"],
    "LCA Building": ["Arzatech", "SITE Faculty Office", "CISCO Lab", "L301", "L302", "L303", "L304", "L305", "L306", "L401", "L402", "L403", "L404", "L405", "L406", "Nursing Laboratory", "AVT"],
    "VPA Building": ["V201", "V202", "V203", "V204", "V205", "V206", "V207", "V301", "V302", "V303", "V304", "V305", "V306", "V307", "V308", "V309", "V401", "V402", "V403", "V404", "V405", "V406", "V407", "V408", "V409", "Library", "Open Computer Lab"],
    "Engineering Building": ["Lab 1", "Lab 2", "Faculty Room", "E101", "E102"],
    "FAME Building": ["FAME Office", "F101", "F102", "F103"],
    "Herrero Building": ["H101", "H102", "H103"]
};

// Default Active CPR Volunteer Medics
const DEFAULT_CPR_ROSTER = [
    { id: "23-1122-334", name: "Juan Miguel Santos", role: "officer", squad: "Alpha Team (Rapid Response)", zone: "Main Campus / Admin", status: "On Duty" },
    { id: "23-5566-778", name: "Angela Reyes", role: "member", squad: "Alpha Team (Rapid Response)", zone: "Main Campus / Admin", status: "On Duty" },
    { id: "23-9900-112", name: "Kevin Cruz", role: "member", squad: "Bravo Team (Main Patrol)", zone: "LCA & VPA Buildings", status: "Responding" },
    { id: "23-3344-556", name: "Patricia Ramos", role: "member", squad: "Charlie Team (Triage Support)", zone: "Engineering & Herrero", status: "Off Duty" }
];

// Default Campus Announcements
const DEFAULT_ANNOUNCEMENTS = [
    {
        id: "ann-1",
        title: "Campus Safety Awareness Week",
        details: "Students and faculty are encouraged to participate in the upcoming campus safety awareness activities.",
        date: "October 7 - 11, 2026",
        icon: "📢",
        featured: true
    },
    {
        id: "ann-2",
        title: "First Aid Training",
        details: "Learn basic first aid and emergency response procedures.",
        date: "October 10, 2026",
        icon: "🩹",
        featured: false
    },
    {
        id: "ann-3",
        title: "Health Screening",
        details: "Free basic health screening for students.",
        date: "October 12, 2026",
        icon: "❤️",
        featured: false
    },
    {
        id: "ann-4",
        title: "Emergency Exit Reminder",
        details: "Keep all emergency exits and pathways clear.",
        date: "Campus Safety Office",
        icon: "⚠️",
        featured: false
    }
];

function switchAuthTab(tab) {
    const loginTabBtn = document.getElementById("loginTabBtn");
    const registerTabBtn = document.getElementById("registerTabBtn");
    const loginContainer = document.getElementById("loginFormContainer");
    const registerContainer = document.getElementById("registerFormContainer");

    if (tab === "register") {
        if (loginTabBtn) loginTabBtn.classList.remove("active");
        if (registerTabBtn) registerTabBtn.classList.add("active");
        if (loginContainer) loginContainer.style.display = "none";
        if (registerContainer) registerContainer.style.display = "block";
    } else {
        if (registerTabBtn) registerTabBtn.classList.remove("active");
        if (loginTabBtn) loginTabBtn.classList.add("active");
        if (registerContainer) registerContainer.style.display = "none";
        if (loginContainer) loginContainer.style.display = "block";
    }
}

// LOGIN FORM SUBMISSION
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const studentId = document.getElementById("studentId").value.trim();
        const password = document.getElementById("password").value.trim();

        const regex = /^2\d-\d{4}-\d{3}$/;
        if (!regex.test(studentId)) {
            alert("Invalid UdD Student ID format! Must follow 2X-XXXX-XXX (e.g. 23-1234-567)");
            return;
        }

        const registeredUsers = JSON.parse(localStorage.getItem("lifelineRegisteredUsers") || "{}");

        if (!registeredUsers[studentId]) {
            alert("Account not found! Please register your Student ID before signing in.");
            switchAuthTab("register");
            const regIdInput = document.getElementById("regStudentId");
            if (regIdInput) regIdInput.value = studentId;
            return;
        }

        const user = registeredUsers[studentId];

        if (user.password && user.password !== password) {
            alert("Incorrect password. Please try again.");
            return;
        }

        localStorage.setItem("lifelineSessionActive", "true");
        localStorage.setItem("lifelineStudentId", studentId);
        localStorage.setItem("lifelineRole", user.role || "user");
        localStorage.setItem("lifelineName", user.name);
        localStorage.setItem("lifelineCourse", user.course || "BS Information Technology");

        if (user.role === "member" || user.role === "officer") {
            syncUserToRoster(studentId, user.name, user.role);
        }

        window.location.href = "dashboard.html";
    });
}

// REGISTER FORM SUBMISSION
const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const fullName = document.getElementById("regFullName").value.trim();
        const studentId = document.getElementById("regStudentId").value.trim();
        const course = document.getElementById("regCourse").value.trim();
        const role = document.getElementById("regRole").value;
        const password = document.getElementById("regPassword").value.trim();

        const regex = /^2\d-\d{4}-\d{3}$/;
        if (!regex.test(studentId)) {
            alert("Invalid UdD Student ID format! Must follow 2X-XXXX-XXX (e.g. 23-1234-567)");
            return;
        }

        const registeredUsers = JSON.parse(localStorage.getItem("lifelineRegisteredUsers") || "{}");
        registeredUsers[studentId] = { 
            name: fullName, 
            course: course, 
            role: role, 
            password: password 
        };
        localStorage.setItem("lifelineRegisteredUsers", JSON.stringify(registeredUsers));

        if (role === "member" || role === "officer") {
            syncUserToRoster(studentId, fullName, role);
        }

        alert(`Account successfully registered for ${fullName} (${studentId})! Please sign in with your password.`);
        registerForm.reset();

        const loginStudentId = document.getElementById("studentId");
        if (loginStudentId) loginStudentId.value = studentId;

        switchAuthTab("login");
    });
}

// PREVENT DUPLICATES IN ROSTER
function syncUserToRoster(studentId, fullName, role) {
    if (!localStorage.getItem("lifelineCprRoster")) {
        localStorage.setItem("lifelineCprRoster", JSON.stringify(DEFAULT_CPR_ROSTER));
    }

    const roster = JSON.parse(localStorage.getItem("lifelineCprRoster"));
    const existingIndex = roster.findIndex(m => m.id === studentId || m.name.toLowerCase() === fullName.toLowerCase());

    if (existingIndex > -1) {
        roster[existingIndex].id = studentId;
        roster[existingIndex].name = fullName;
        roster[existingIndex].role = role;
        if (roster[existingIndex].status === "Off Duty") {
            roster[existingIndex].status = "On Duty";
        }
    } else {
        roster.push({
            id: studentId,
            name: fullName,
            role: role,
            squad: "Alpha Team (Rapid Response)",
            zone: "Main Campus / Admin",
            status: "On Duty"
        });
    }

    localStorage.setItem("lifelineCprRoster", JSON.stringify(roster));
}

function updateRoomDropdown() {
    const buildingSelect = document.getElementById("building");
    const roomSelect = document.getElementById("room");
    if (!buildingSelect || !roomSelect) return;

    const selectedBuilding = buildingSelect.value;
    roomSelect.innerHTML = '<option value="">Select Room / Area</option>';

    if (CAMPUS_LOCATIONS[selectedBuilding]) {
        CAMPUS_LOCATIONS[selectedBuilding].forEach(room => {
            const option = document.createElement("option");
            option.value = room;
            option.textContent = room;
            roomSelect.appendChild(option);
        });
    }
}

function showSection(sectionId) {
    document.querySelectorAll(".content-section").forEach(section => {
        section.classList.remove("active-section");
    });

    const selected = document.getElementById(sectionId);
    if (selected) selected.classList.add("active-section");

    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
        const text = item.textContent.toLowerCase();

        if (
            (sectionId === "dashboard" && text.includes("dashboard")) ||
            (sectionId === "emergency" && text.includes("emergency")) ||
            (sectionId === "roster" && text.includes("roster")) ||
            (sectionId === "announcements" && text.includes("announcement")) ||
            (sectionId === "training" && text.includes("training")) ||
            (sectionId === "analytics" && text.includes("analytics")) ||
            (sectionId === "profile" && text.includes("profile"))
        ) item.classList.add("active");
    });

    const titles = {
        dashboard: "Dashboard",
        emergency: "Emergency Alert",
        roster: "CPR Team Management",
        announcements: "Announcement Board",
        training: "Training & Seminars",
        analytics: "Patient Analytics",
        profile: "My Profile"
    };

    const title = document.getElementById("pageTitle");
    if (title) title.textContent = titles[sectionId];

    const sidebar = document.querySelector(".sidebar");
    if (sidebar) sidebar.classList.remove("open");

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleSidebar() {
    const sidebar = document.querySelector(".sidebar");
    if (sidebar) sidebar.classList.toggle("open");
}

function logout() {
    localStorage.removeItem("lifelineSessionActive");
    localStorage.removeItem("lifelineStudentId");
    localStorage.removeItem("lifelineRole");
    localStorage.removeItem("lifelineName");
    localStorage.removeItem("lifelineCourse");
    window.location.replace("index.html");
}

// EMERGENCY DISPATCH SYSTEM
const emergencyForm = document.getElementById("emergencyForm");
if (emergencyForm) {
    emergencyForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const priority = document.querySelector('input[name="priority"]:checked');
        const building = document.getElementById("building").value;
        const room = document.getElementById("room").value;
        const patients = document.getElementById("patients").value;
        const others = document.getElementById("others").value;

        if (!priority) {
            alert("Please select the emergency priority.");
            return;
        }

        const currentStudentId = localStorage.getItem("lifelineStudentId") || "23-4567-890";
        const currentName = localStorage.getItem("lifelineName") || "Student User";

        const newIncident = {
            id: 'UDD-' + Math.floor(1000 + Math.random() * 9000),
            priority: priority.value,
            building: building,
            room: room,
            patients: patients,
            details: others || "No additional remarks",
            reporterName: currentName,
            reporterId: currentStudentId,
            status: "DISPATCHED",
            responderName: null,
            time: "Just now"
        };

        const existingIncidents = JSON.parse(localStorage.getItem("lifelineIncidents") || "[]");
        existingIncidents.unshift(newIncident);
        localStorage.setItem("lifelineIncidents", JSON.stringify(existingIncidents));

        document.getElementById("alertMessage").textContent =
            `${priority.value} priority emergency reported at ${building} (${room}). Patients: ${patients}. Available CPR responders have been notified.`;

        document.getElementById("alertModal").classList.add("show");
        emergencyForm.reset();
        renderDispatchAlerts();
    });
}

function renderDispatchAlerts() {
    const role = localStorage.getItem("lifelineRole");
    const container = document.getElementById("responderDispatchQueue");
    const list = document.getElementById("dispatchAlertsList");
    if (!container || !list) return;

    if (role === "member" || role === "officer" || role === "admin") {
        container.style.display = "block";
    } else {
        container.style.display = "none";
        return;
    }

    const incidents = JSON.parse(localStorage.getItem("lifelineIncidents") || "[]");
    const activeIncidents = incidents.filter(i => i.status !== "RESOLVED");

    document.getElementById("activeAlertCount").textContent = `● ${activeIncidents.length} Active Alerts`;

    if (activeIncidents.length === 0) {
        list.innerHTML = `<p style="font-size: 12px; color: var(--muted); padding: 10px;">No active emergency dispatches requiring response.</p>`;
        return;
    }

    list.innerHTML = "";
    activeIncidents.forEach(inc => {
        const item = document.createElement("div");
        item.className = "card";
        item.style.marginBottom = "0";
        item.style.background = "#fffafa";
        item.style.border = "1px solid #ffd4d4";

        let statusClass = "responding";
        if (inc.status === "ON_SCENE") statusClass = "onscene";

        item.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
                <strong style="font-size:13px;">${inc.id} • ${inc.reporterName} (${inc.reporterId})</strong>
                <span class="priority ${inc.priority.toLowerCase()}-priority">${inc.priority}</span>
            </div>
            <p style="font-size:12px; color: var(--text); font-weight:bold;">📍 ${inc.building} - ${inc.room}</p>
            <p style="font-size:11px; color: var(--muted); margin: 4px 0;">Patients: ${inc.patients} | ${inc.details}</p>
            <p style="font-size:10px; margin-bottom: 10px;">Status: <span class="status ${statusClass}">${inc.status}</span> ${inc.responderName ? `(Medic: ${inc.responderName})` : ''}</p>
            <div style="display:flex; gap:8px;">
                ${inc.status === 'DISPATCHED' ? `
                    <button class="primary-button" style="margin:0; padding:10px 14px; font-size:12px;" onclick="respondToDispatch('${inc.id}', 'RESPONDING')">Accept & Respond</button>
                ` : inc.status === 'RESPONDING' ? `
                    <button class="primary-button" style="margin:0; padding:10px 14px; font-size:12px; background:var(--yellow);" onclick="respondToDispatch('${inc.id}', 'ON_SCENE')">Mark Arrived On-Scene</button>
                ` : `
                    <button class="primary-button" style="margin:0; padding:10px 14px; font-size:12px; background:var(--green);" onclick="respondToDispatch('${inc.id}', 'RESOLVED')">Mark Resolved</button>
                `}
            </div>
        `;
        list.appendChild(item);
    });
}

// ACCEPT & RESPOND HANDLER WITH DYNAMIC ROSTER STATUS UPDATE
function respondToDispatch(id, newStatus) {
    const currentName = localStorage.getItem("lifelineName") || "CPR Volunteer";
    const currentStudentId = localStorage.getItem("lifelineStudentId");

    const incidents = JSON.parse(localStorage.getItem("lifelineIncidents") || "[]");
    const target = incidents.find(i => i.id === id);

    if (target) {
        target.status = newStatus;
        target.responderName = currentName;
        localStorage.setItem("lifelineIncidents", JSON.stringify(incidents));

        // Update Medic Status in Roster
        const roster = JSON.parse(localStorage.getItem("lifelineCprRoster") || "[]");
        const medic = roster.find(m => m.id === currentStudentId || m.name.toLowerCase() === currentName.toLowerCase());

        if (medic) {
            if (newStatus === "RESPONDING") {
                medic.status = "Responding";
            } else if (newStatus === "ON_SCENE") {
                medic.status = "On-Scene";
            } else if (newStatus === "RESOLVED") {
                medic.status = "On Duty";
            }
            localStorage.setItem("lifelineCprRoster", JSON.stringify(roster));
        }

        alert(`[DISPATCH UPDATED] Status for emergency ${id} changed to ${newStatus}. Your responder status is now "${medic ? medic.status : 'Responding'}".`);
        
        // Refresh UI components
        renderDispatchAlerts();
        renderCPRRoster();
    }
}

function renderAnnouncements() {
    if (!localStorage.getItem("lifelineAnnouncements")) {
        localStorage.setItem("lifelineAnnouncements", JSON.stringify(DEFAULT_ANNOUNCEMENTS));
    }

    const role = localStorage.getItem("lifelineRole");
    const officerCard = document.getElementById("officerAnnouncementCard");
    
    if (officerCard) {
        if (role === "officer" || role === "admin") {
            officerCard.style.display = "block";
        } else {
            officerCard.style.display = "none";
        }
    }

    const list = JSON.parse(localStorage.getItem("lifelineAnnouncements") || "[]");
    const grid = document.getElementById("announcementBoardGrid");
    if (!grid) return;

    grid.innerHTML = "";

    const featuredList = list.filter(a => a.featured);
    const standardList = list.filter(a => !a.featured);

    featuredList.forEach(ann => {
        const div = document.createElement("div");
        div.className = "large-announcement";
        div.innerHTML = `
            <span class="announcement-label">IMPORTANT</span>
            <h2>${ann.title}</h2>
            <p>${ann.details}</p>
            <span>${ann.date}</span>
        `;
        grid.appendChild(div);
    });

    standardList.forEach(ann => {
        const div = document.createElement("div");
        div.className = "card announcement-card";
        div.innerHTML = `
            <div class="announcement-big-icon">${ann.icon || "📢"}</div>
            <h3>${ann.title}</h3>
            <p>${ann.details}</p>
            <strong>${ann.date}</strong>
        `;
        grid.appendChild(div);
    });
}

const createAnnouncementForm = document.getElementById("createAnnouncementForm");
if (createAnnouncementForm) {
    createAnnouncementForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const title = document.getElementById("annTitle").value.trim();
        const icon = document.getElementById("annIcon").value;
        const featured = document.getElementById("annFeatured").value === "true";
        const date = document.getElementById("annDate").value.trim();
        const details = document.getElementById("annDetails").value.trim();

        const announcements = JSON.parse(localStorage.getItem("lifelineAnnouncements") || "[]");
        const newAnn = {
            id: "ann-" + Date.now(),
            title: title,
            icon: icon,
            featured: featured,
            date: date,
            details: details
        };

        announcements.unshift(newAnn);
        localStorage.setItem("lifelineAnnouncements", JSON.stringify(announcements));

        alert(`Announcement "${title}" successfully published to campus board!`);
        createAnnouncementForm.reset();
        renderAnnouncements();
    });
}

// CPR ROSTER & ACTIVE RESPONDERS WIDGET RENDERER
function renderCPRRoster() {
    if (!localStorage.getItem("lifelineCprRoster")) {
        localStorage.setItem("lifelineCprRoster", JSON.stringify(DEFAULT_CPR_ROSTER));
    }

    const roster = JSON.parse(localStorage.getItem("lifelineCprRoster"));
    const tbody = document.getElementById("cprRosterTableBody");
    const container = document.getElementById("dynamicRespondersList");

    if (tbody) {
        tbody.innerHTML = "";
        roster.forEach(medic => {
            const tr = document.createElement("tr");
            let statusColor = "available";
            if (medic.status === "Responding" || medic.status === "On-Scene") statusColor = "busy";
            if (medic.status === "Off Duty") statusColor = "status-dot";

            tr.innerHTML = `
                <td><strong>${medic.name}</strong></td>
                <td><code>${medic.id}</code></td>
                <td>
                    <select style="font-size:11px; padding:4px;" onchange="updateMedicSquad('${medic.id}', this.value)">
                        <option value="Alpha Team (Rapid Response)" ${medic.squad.includes("Alpha") ? 'selected' : ''}>Alpha Team</option>
                        <option value="Bravo Team (Main Patrol)" ${medic.squad.includes("Bravo") ? 'selected' : ''}>Bravo Team</option>
                        <option value="Charlie Team (Triage Support)" ${medic.squad.includes("Charlie") ? 'selected' : ''}>Charlie Team</option>
                    </select>
                </td>
                <td>${medic.zone}</td>
                <td><span class="${statusColor}">● ${medic.status}</span></td>
                <td>
                    <button class="secondary-button" style="margin:0; padding:4px 8px; font-size:10px;" onclick="toggleMedicDuty('${medic.id}')">Toggle Duty</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    if (container) {
        container.innerHTML = "";
        const activeMedics = roster.filter(m => m.status === "On Duty" || m.status === "Responding" || m.status === "On-Scene");
        const currentId = localStorage.getItem("lifelineStudentId");

        activeMedics.forEach(m => {
            const initials = m.name.split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase();
            const roleTitle = m.role === "officer" ? "CPR Officer" : "CPR Member";
            const isSelf = m.id === currentId;

            let badgeClass = "available";
            if (m.status === "Responding" || m.status === "On-Scene") {
                badgeClass = "busy";
            }

            const div = document.createElement("div");
            div.className = "responder";
            div.innerHTML = `
                <div class="responder-avatar">${initials}</div>
                <div class="responder-details">
                    <strong>${m.name} ${isSelf ? '<small style="color:var(--primary); font-size:10px;">(You)</small>' : ''}</strong>
                    <span>${roleTitle} • ${m.squad.split(" ")[0]} Team</span>
                </div>
                <span class="${badgeClass}">● ${m.status}</span>
            `;
            container.appendChild(div);
        });

        const badge = document.getElementById("activeRespondersBadge");
        if (badge) badge.textContent = `${activeMedics.length} Active`;

        const activeEl = document.getElementById("activeRespondersCount");
        if (activeEl) activeEl.textContent = activeMedics.length;
    }
}

function updateMedicSquad(id, newSquad) {
    const roster = JSON.parse(localStorage.getItem("lifelineCprRoster") || "[]");
    const medic = roster.find(m => m.id === id);
    if (medic) {
        medic.squad = newSquad;
        localStorage.setItem("lifelineCprRoster", JSON.stringify(roster));
        alert(`[ROSTER UPDATED] ${medic.name} re-assigned to ${newSquad}.`);
        renderCPRRoster();
    }
}

function toggleMedicDuty(id) {
    const roster = JSON.parse(localStorage.getItem("lifelineCprRoster") || "[]");
    const medic = roster.find(m => m.id === id);
    if (medic) {
        medic.status = medic.status === "Off Duty" ? "On Duty" : "Off Duty";
        localStorage.setItem("lifelineCprRoster", JSON.stringify(roster));
        renderCPRRoster();
    }
}

const addMemberForm = document.getElementById("addMemberForm");
if (addMemberForm) {
    addMemberForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const name = document.getElementById("newMemberName").value.trim();
        const id = document.getElementById("newMemberId").value.trim();
        const role = document.getElementById("newMemberRole").value;
        const squad = document.getElementById("newMemberTeam").value;
        const zone = document.getElementById("newMemberZone").value;

        const roster = JSON.parse(localStorage.getItem("lifelineCprRoster") || "[]");
        roster.push({ id: id, name: name, role: role, squad: squad, zone: zone, status: "On Duty" });
        localStorage.setItem("lifelineCprRoster", JSON.stringify(roster));

        alert(`New CPR Volunteer Medic ${name} registered and assigned to ${squad}!`);
        addMemberForm.reset();
        renderCPRRoster();
    });
}

function closeModal() {
    const modal = document.getElementById("alertModal");
    if (modal) modal.classList.remove("show");
}

const modal = document.getElementById("alertModal");
if (modal) {
    modal.addEventListener("click", function (event) {
        if (event.target === modal) closeModal();
    });
}

function createCharts() {
    if (typeof Chart === "undefined") return;

    const incidentCanvas = document.getElementById("incidentChart");
    if (incidentCanvas) {
        new Chart(incidentCanvas, {
            type: "doughnut",
            data: {
                labels: ["Fever / Flu", "Headache", "Minor Cuts", "Sprains", "Other"],
                datasets: [{ data: [18, 14, 12, 9, 31] }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: "bottom" } }
            }
        });
    }

    const monthlyCanvas = document.getElementById("monthlyChart");
    if (monthlyCanvas) {
        new Chart(monthlyCanvas, {
            type: "line",
            data: {
                labels: ["May", "June", "July", "August", "September", "October"],
                datasets: [{
                    label: "Incidents",
                    data: [48, 57, 51, 67, 72, 84],
                    tension: 0.3,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } }
            }
        });
    }

    const locationCanvas = document.getElementById("locationChart");
    if (locationCanvas) {
        new Chart(locationCanvas, {
            type: "bar",
            data: {
                labels: ["Main Campus", "LCA Bldg", "Admin Bldg", "VPA Bldg", "Others"],
                datasets: [{ label: "Incidents", data: [24, 18, 20, 13, 9] }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } }
            }
        });
    }

    const responseCanvas = document.getElementById("responseChart");
    if (responseCanvas) {
        new Chart(responseCanvas, {
            type: "bar",
            data: {
                labels: ["May", "June", "July", "August", "September", "October"],
                datasets: [{ label: "Minutes", data: [7.1, 6.5, 6.1, 5.4, 4.8, 4.2] }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } }
            }
        });
    }
}

// LOAD USER DATA & AUTH GUARD
function loadUserData() {
    const isDashboard = document.getElementById("dashboard");
    if (isDashboard) {
        const sessionActive = localStorage.getItem("lifelineSessionActive");
        if (!sessionActive) {
            window.location.replace("index.html");
            return;
        }
    }

    const studentId = localStorage.getItem("lifelineStudentId") || "23-4567-890";
    const role = localStorage.getItem("lifelineRole") || "user";
    
    const registeredUsers = JSON.parse(localStorage.getItem("lifelineRegisteredUsers") || "{}");
    let name = localStorage.getItem("lifelineName");

    if (registeredUsers[studentId] && registeredUsers[studentId].name) {
        name = registeredUsers[studentId].name;
    } else if (!name || name === "Student User") {
        name = `Student ${studentId}`;
    }

    const course = (registeredUsers[studentId] && registeredUsers[studentId].course) || localStorage.getItem("lifelineCourse") || "BS Information Technology";

    const headerNameElement = document.getElementById("headerUserName");
    if (headerNameElement) headerNameElement.textContent = name;

    const welcomeUserName = document.getElementById("welcomeUserName");
    if (welcomeUserName) welcomeUserName.textContent = name;

    const profileNameElement = document.getElementById("profileFullName");
    if (profileNameElement) profileNameElement.textContent = name;

    const idElement = document.getElementById("profileStudentId");
    if (idElement) idElement.textContent = studentId;

    const courseElement = document.getElementById("profileCourse");
    if (courseElement) courseElement.textContent = course;

    let initials = name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    if (!initials) initials = "UD";

    const headerAvatar = document.getElementById("headerAvatar");
    if (headerAvatar) headerAvatar.textContent = initials;

    const profileAvatar = document.getElementById("profileAvatar");
    if (profileAvatar) profileAvatar.textContent = initials;

    let roleName = "Student / User";
    if (role === "member") roleName = "CPR Member";
    if (role === "officer") roleName = "CPR Officer";
    if (role === "admin") roleName = "Administrator";

    const roleBadge = document.getElementById("profileRoleBadge");
    if (roleBadge) roleBadge.textContent = roleName;

    const headerRole = document.getElementById("headerUserRole");
    if (headerRole) headerRole.textContent = roleName;

    const cprNav = document.getElementById("cprRosterNavBtn");
    if (cprNav) {
        if (role === "officer" || role === "admin") {
            cprNav.style.display = "flex";
        } else {
            cprNav.style.display = "none";
        }
    }

    renderDispatchAlerts();
    renderCPRRoster();
    renderAnnouncements();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        createCharts();
        loadUserData();
    });
} else {
    createCharts();
    loadUserData();
}