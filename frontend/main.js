document.addEventListener('DOMContentLoaded', function() {
    // Initialize application
    if (localStorage.getItem('jwt')) {
        loadDashboard();
    } else {
        showLogin();
    }
});

const apiBase = 'https://localhost:5001/api'; // Consistent API base URL

function showLogin() {
    document.getElementById('auth-container').innerHTML = `
    <form class="auth-form" id="login-form">
        <h3>Login</h3>
        <div class="mb-3">
            <input type="email" class="form-control" id="login-email" placeholder="Email" required />
        </div>
        <div class="mb-3">
            <input type="password" class="form-control" id="login-password" placeholder="Password" required />
        </div>
        <button type="submit" class="btn btn-primary w-100">Login</button>
        <div class="mt-2 text-center">
            <a href="#" id="show-register">Register</a>
        </div>
    </form>`;
    document.getElementById('login-form').onsubmit = handleLogin;
    document.getElementById('show-register').onclick = showRegister;
}

function showRegister() {
    document.getElementById('auth-container').innerHTML = `
    <form class="auth-form" id="register-form">
        <h3>Register</h3>
        <div class="mb-3">
            <input type="email" class="form-control" id="register-email" placeholder="Email" required />
        </div>
        <div class="mb-3">
            <input type="password" class="form-control" id="register-password" placeholder="Password" required />
        </div>
        <div class="mb-3">
            <input type="text" class="form-control" id="register-fullname" placeholder="Full Name" required />
        </div>
        <div class="mb-3">
            <input type="text" class="form-control" id="register-skills" placeholder="Skills (comma separated)" required />
        </div>
        <div class="mb-3">
            <select class="form-select" id="register-role" required>
                <option value="">Select Role</option>
                <option value="Manager">Manager</option>
                <option value="TeamLead">TeamLead</option>
                <option value="Employee">Employee</option>
            </select>
        </div>
        <button type="submit" class="btn btn-success w-100">Register</button>
        <div class="mt-2 text-center">
            <a href="#" id="show-login">Back to Login</a>
        </div>
    </form>`;
    document.getElementById('register-form').onsubmit = handleRegister;
    document.getElementById('show-login').onclick = showLogin;
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        const res = await fetch(`${apiBase}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('jwt', data.token);
            loadDashboard();
        } else {
            const error = await res.text();
            alert(`Login failed: ${error}`);
        }
    } catch (error) {
        alert(`Login error: ${error.message}`);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const fullName = document.getElementById('register-fullname').value;
    const skills = document.getElementById('register-skills').value;
    const role = document.getElementById('register-role').value;
    try {
        const res = await fetch(`${apiBase}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, fullName, skills, role })
        });
        if (res.ok) {
            alert('Registration successful! Please login.');
            showLogin();
        } else {
            const error = await res.text();
            alert(`Registration failed: ${error}`);
        }
    } catch (error) {
        alert(`Registration error: ${error.message}`);
    }
}

async function loadDashboard() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('dashboard-root').style.display = 'block';

    try {
        const jwt = localStorage.getItem('jwt');
        if (!jwt) {
            throw new Error('No JWT found. Redirecting to login...');
        }

        const res = await fetch(`${apiBase}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${jwt}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch user info. Status: ${res.status}`);
        }

        const user = await res.json();

        // Store user info globally (avoid if not necessary)
        window.currentUser = user;

        renderDashboardShell(user);
    } catch (error) {
        console.error('Dashboard load error:', error.message);
        localStorage.removeItem('jwt');
        showLogin();
    }
}


function renderDashboardShell(user) {
    document.getElementById('dashboard-root').innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-light bg-light mb-3">
        <div class="container-fluid">
            <a class="navbar-brand" href="#">ProjectManagementApp</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto mb-2 mb-lg-0" id="nav-links"></ul>
                <span class="navbar-text me-3">${user.fullName} (${user.role})</span>
                <button class="btn btn-outline-danger btn-sm" id="logout-btn">Logout</button>
            </div>
        </div>
    </nav>
    <div class="mb-3">
        <label for="project-select" class="form-label">Select Project:</label>
        <select id="project-select" class="form-select" style="max-width:300px;display:inline-block;"></select>
    </div>
    <div id="dashboard-content"></div>
    `;
    document.getElementById('logout-btn').onclick = () => {
        localStorage.removeItem('jwt');
        location.reload();
    };
    loadProjectsDropdown(user);
}

async function loadProjectsDropdown(user) {
    try {
        const jwt = localStorage.getItem('jwt');
        const res = await fetch(`${apiBase}/Projects`, {
            headers: { 'Authorization': `Bearer ${jwt}` }
        });
        if (!res.ok) {
            throw new Error('Failed to fetch projects');
        }
        const projects = await res.json();
        const select = document.getElementById('project-select');
        select.innerHTML = '<option value="">-- Select Project --</option>' +
            projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        select.onchange = () => loadRoleDashboard(user, select.value);
    } catch (error) {
        console.error('Error loading projects:', error);
        document.getElementById('dashboard-content').innerHTML = `<div class="alert alert-danger">Error loading projects: ${error.message}</div>`;
    }
}

function loadRoleDashboard(user, projectId) {
    if (!projectId) {
        document.getElementById('dashboard-content').innerHTML = '<div class="alert alert-warning">Please select a project.</div>';
        return;
    }
    if (user.role === 'Manager') {
        renderManagerDashboard(projectId);
    } else if (user.role === 'TeamLead') {
        renderTeamLeadDashboard(projectId);
    } else if (user.role === 'Employee') {
        renderEmployeeDashboard(projectId);
    }
}

function renderManagerDashboard(projectId) {
    document.getElementById('dashboard-content').innerHTML = `
    <ul class="nav nav-tabs" id="managerTabs" role="tablist">
        <li class="nav-item" role="presentation">
            <button class="nav-link active" id="projectOverview-tab" data-bs-toggle="tab" data-bs-target="#projectOverview" type="button" role="tab">Project Overview</button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="taskReview-tab" data-bs-toggle="tab" data-bs-target="#taskReview" type="button" role="tab">Task Review</button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="manageRoles-tab" data-bs-toggle="tab" data-bs-target="#manageRoles" type="button" role="tab">Manage Roles</button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="discrepancies-tab" data-bs-toggle="tab" data-bs-target="#discrepancies" type="button" role="tab">Discrepancies</button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="gantt-tab" data-bs-toggle="tab" data-bs-target="#gantt" type="button" role="tab">Gantt Chart</button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="reports-tab" data-bs-toggle="tab" data-bs-target="#reports" type="button" role="tab">Reports</button>
        </li>
    </ul>
    <div class="tab-content mt-3" id="managerTabsContent">
        <div class="tab-pane fade show active" id="projectOverview" role="tabpanel">
            <div id="project-details"></div>
            <div id="project-members">
                <h4>Project Members</h4>
                <ul id="member-list" class="list-group mb-3"></ul>
                <h5>Add Member</h5>
                <div class="input-group mb-3">
                    <select class="form-control" id="available-employees-select">
                        <option value="">Select Employee</option>
                    </select>
                    <button class="btn btn-primary" id="add-member-btn">Add Member</button>
                </div>
            </div>
            <div id="task-status-chart">
                <h4>Task Status Overview</h4>
                <canvas id="taskStatusPieChart"></canvas>
            </div>
        </div>
        <div class="tab-pane fade" id="taskReview" role="tabpanel">
            <h4>Tasks in Review</h4>
            <ul id="tasks-in-review-list" class="list-group"></ul>
        </div>
        <div class="tab-pane fade" id="manageRoles" role="tabpanel">
            <h4>Manage User Roles</h4>
            <div id="user-roles-list"></div>
        </div>
        <div class="tab-pane fade" id="discrepancies" role="tabpanel">
            <div id="manager-discrepancies-content">Loading discrepancies...</div>
        </div>
        <div class="tab-pane fade" id="gantt" role="tabpanel">
            <div id="manager-gantt-content">Loading Gantt chart...</div>
        </div>
        <div class="tab-pane fade" id="reports" role="tabpanel">
            <div id="manager-reports-content">Loading reports...</div>
        </div>
    </div>
    `;
    loadManagerOverview(projectId);
    document.getElementById('taskReview-tab').onclick = () => loadManagerTaskReview(projectId);
    document.getElementById('discrepancies-tab').onclick = () => loadManagerDiscrepancies(projectId);
    document.getElementById('manageRoles-tab').onclick = () => loadUserRoles();
    document.getElementById('gantt-tab').onclick = () => loadManagerGantt(projectId);
    document.getElementById('reports-tab').onclick = () => loadManagerReports(projectId);

    // Add event listeners for tabs
    const managerTabsContent = document.getElementById('managerTabsContent');
    managerTabsContent.querySelectorAll('.nav-link').forEach(tab => {
        tab.addEventListener('shown.bs.tab', (event) => {
            const targetId = event.target.id;
            if (targetId === 'manageRoles-tab') {
                loadUserRoles();
            } else if (targetId === 'discrepancies-tab') {
                 loadManagerDiscrepancies(projectId);
            } else if (targetId === 'reports-tab') {
                 loadManagerReports(projectId);
            } else if (targetId === 'gantt-tab') {
                 loadManagerGantt(projectId);
            }
        });
    });
}

async function loadManagerOverview(projectId) {
    try {
        const jwt = localStorage.getItem('jwt');
        const projectRes = await fetch(`${apiBase}/Projects/${projectId}`, { headers: { 'Authorization': `Bearer ${jwt}` } });
        if (!projectRes.ok) {
            throw new Error('Failed to fetch project');
        }
        const project = await projectRes.json();
        const tasksRes = await fetch(`${apiBase}/Tasks?projectId=${projectId}`, { headers: { 'Authorization': `Bearer ${jwt}` } });
        const tasks = tasksRes.ok ? await tasksRes.json() : [];
        const availableEmployeesRes = await fetch(`${apiBase}/Users?role=Employee`, { headers: { 'Authorization': `Bearer ${jwt}` } });
        const availableEmployees = availableEmployeesRes.ok ? await availableEmployeesRes.json() : [];

        let html = `<h4>${project.name}</h4>
            <p><b>Category:</b> ${project.category} | <b>Priority:</b> ${project.priority} | <b>Start:</b> ${project.startDate.substring(0,10)} | <b>End:</b> ${project.endDate.substring(0,10)}</p>
            <p><b>Skills Required:</b> ${project.skillsRequired}</p>
            <h5>Members</h5>
            <ul class="list-group mb-3">${(project.members || []).map(m => `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    User ID: ${m.userId}
                    <button class="btn btn-danger btn-sm remove-member" data-userid="${m.userId}" data-projectid="${projectId}">Remove</button>
                </li>
            `).join('')}</ul>
            <h5>Add Employees</h5>
            <select class="form-select mb-3" id="employee-select">
                <option value="">-- Select Employee to Add --</option>
                ${availableEmployees.map(emp => `<option value="${emp.id}">${emp.email} (${emp.skills})</option>`).join('')}
            </select>
            <button class="btn btn-primary" id="add-employee-btn" data-projectid="${projectId}">Add Employee</button>
            <h5 class="mt-4">Task Status Distribution</h5>
            <canvas id="statusChart" width="300" height="300"></canvas>
        `;
        document.getElementById('project-details').innerHTML = html;

        document.querySelectorAll('.remove-member').forEach(button => {
            button.onclick = () => removeProjectMember(button.dataset.projectid, button.dataset.userid);
        });
        document.getElementById('add-employee-btn').onclick = () => addProjectMember(document.getElementById('add-employee-btn').dataset.projectid, document.getElementById('employee-select').value);

        // Task Status Chart
        const statusCounts = {
            ToDo: tasks.filter(t => t.status === 'ToDo').length,
            InProgress: tasks.filter(t => t.status === 'InProgress').length,
            Review: tasks.filter(t => t.status === 'Review').length,
            Done: tasks.filter(t => t.status === 'Done').length
        };
        const ctx = document.getElementById('statusChart').getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['To Do', 'In Progress', 'Review', 'Done'],
                datasets: [{
                    data: [statusCounts.ToDo, statusCounts.InProgress, statusCounts.Review, statusCounts.Done],
                    backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0']
                }]
            },
            options: { responsive: true }
        });
    } catch (error) {
        console.error('Error loading manager overview:', error);
        document.getElementById('project-details').innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
}

async function addProjectMember(projectId, userId) {
    if (!userId) {
        alert('Please select an employee');
        return;
    }
    try {
        const jwt = localStorage.getItem('jwt');
        const projectRes = await fetch(`${apiBase}/Projects/${projectId}`, { headers: { 'Authorization': `Bearer ${jwt}` } });
        if (!projectRes.ok) {
            throw new Error('Failed to fetch project');
        }
        const project = await projectRes.json();
        if (!project.members) project.members = [];
        if (project.members.some(m => m.userId === parseInt(userId))) {
            alert('User is already a member of this project');
            return;
        }
        project.members.push({ userId: parseInt(userId), projectId: parseInt(projectId) });
        const res = await fetch(`${apiBase}/Projects/${projectId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
            body: JSON.stringify(project)
        });
        if (res.ok) {
            alert('Member added successfully');
            loadManagerOverview(projectId);
        } else {
            throw new Error('Failed to add member');
        }
    } catch (error) {
        alert(`Error adding member: ${error.message}`);
    }
}

async function removeProjectMember(projectId, userId) {
    try {
        const jwt = localStorage.getItem('jwt');
        const projectRes = await fetch(`${apiBase}/Projects/${projectId}`, { headers: { 'Authorization': `Bearer ${jwt}` } });
        if (!projectRes.ok) {
            throw new Error('Failed to fetch project');
        }
        const project = await projectRes.json();
        project.members = (project.members || []).filter(m => m.userId !== parseInt(userId));
        const res = await fetch(`${apiBase}/Projects/${projectId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
            body: JSON.stringify(project)
        });
        if (res.ok) {
            alert('Member removed successfully');
            loadManagerOverview(projectId);
        } else {
            throw new Error('Failed to remove member');
        }
    } catch (error) {
        alert(`Error removing member: ${error.message}`);
    }
}

async function loadManagerTaskReview(projectId) {
    try {
        const jwt = localStorage.getItem('jwt');
        const tasksRes = await fetch(`${apiBase}/Tasks?projectId=${projectId}&status=Review`, { headers: { 'Authorization': `Bearer ${jwt}` } });
        const tasks = tasksRes.ok ? await tasksRes.json() : [];
        let html = tasks.length === 0
            ? '<div class="alert alert-info">No tasks currently in Review for this project.</div>'
            : '<ul class="list-group">' + tasks.map(task => `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <b>${task.title}</b> (Due: ${task.dueDate.substring(0,10)}) - Assigned to: User ID ${task.assignedTo}
                        <p>${task.description}</p>
                    </div>
                    <div>
                        <button class="btn btn-success btn-sm me-2 approve-task" data-id="${task.id}">Approve</button>
                        <button class="btn btn-warning btn-sm reject-task" data-id="${task.id}">Reject</button>
                    </div>
                </li>
            `).join('') + '</ul>';
        document.getElementById('tasks-in-review-list').innerHTML = html;

        document.querySelectorAll('.approve-task').forEach(button => {
            button.onclick = () => updateTaskStatus(button.dataset.id, 'Done', projectId);
        });
        document.querySelectorAll('.reject-task').forEach(button => {
            button.onclick = () => {
                const comment = prompt('Enter rejection reason:');
                if (comment !== null) {
                    updateTaskStatus(button.dataset.id, 'InProgress', projectId, comment);
                }
            };
        });
    } catch (error) {
        console.error('Error loading task review:', error);
        document.getElementById('tasks-in-review-list').innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
}

async function updateTaskStatus(taskId, newStatus, projectId, comment = '') {
    try {
        const jwt = localStorage.getItem('jwt');
        const res = await fetch(`${apiBase}/Tasks/${taskId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
            body: JSON.stringify({ newStatus, comment })
        });
        if (res.ok) {
            alert(`Task ${taskId} status updated to ${newStatus}`);
            loadManagerTaskReview(projectId);
            loadManagerOverview(projectId);
        } else {
            throw new Error('Failed to update task status');
        }
    } catch (error) {
        alert(`Error updating task status: ${error.message}`);
    }
}

async function loadManagerDiscrepancies(projectId) {
    const discrepanciesContent = document.getElementById('manager-discrepancies-content');
    try {
        const jwt = localStorage.getItem('jwt');
        const response = await fetch(`${apiBase}/Discrepancies?projectId=${projectId}`, { headers: { 'Authorization': `Bearer ${jwt}` } });
        if (!response.ok) {
            throw new Error('Failed to fetch discrepancies');
        }
        const discrepancies = await response.json();
        let html = '<h4>Project Discrepancies</h4>';
        if (discrepancies.length === 0) {
            html += '<div class="alert alert-info">No discrepancies found for this project.</div>';
        } else {
            html += '<ul class="list-group">';
            discrepancies.forEach(discrepancy => {
                html += `
                <li class="list-group-item">
                    <div>
                        <b>Discrepancy ID: ${discrepancy.id}</b> (Status: ${discrepancy.status}) - Raised by: User ID ${discrepancy.raisedBy}
                        <p>${discrepancy.description}</p>
                        ${discrepancy.status === 'Resolved' ? `<p>Resolution: ${discrepancy.resolutionComment || 'N/A'}</p>` : `
                            <button class="btn btn-sm btn-success resolve-discrepancy-btn mt-2" data-id="${discrepancy.id}">Resolve</button>
                        `}
                    </div>
                </li>
                `;
            });
            html += '</ul>';
        }
        discrepanciesContent.innerHTML = html;

        document.querySelectorAll('.resolve-discrepancy-btn').forEach(button => {
            button.onclick = () => showResolveDiscrepancyModal(button.dataset.id, projectId);
        });
    } catch (error) {
        console.error('Error loading discrepancies:', error);
        discrepanciesContent.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
}

function showResolveDiscrepancyModal(discrepancyId, projectId) {
    // Remove existing modal if present to prevent ID conflicts
    const existingModal = document.getElementById('resolveDiscrepancyModal');
    if (existingModal) existingModal.remove();

    const modalHtml = `
    <div class="modal fade" id="resolveDiscrepancyModal" tabindex="-1" aria-labelledby="resolveDiscrepancyModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="resolveDiscrepancyModalLabel">Resolve Discrepancy ${discrepancyId}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="resolve-discrepancy-form">
                        <div class="mb-3">
                            <label for="resolution-comment" class="form-label">Resolution Comment</label>
                            <textarea class="form-control" id="resolution-comment" rows="3" required></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-success" id="submit-resolution-btn">Submit Resolution</button>
                </div>
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = new bootstrap.Modal(document.getElementById('resolveDiscrepancyModal'));
    document.getElementById('submit-resolution-btn').onclick = () => handleSubmitResolution(discrepancyId, projectId);
    modal.show();

    document.getElementById('resolveDiscrepancyModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
}

async function handleSubmitResolution(discrepancyId, projectId) {
    const resolutionComment = document.getElementById('resolution-comment').value;
    if (!resolutionComment) {
        alert('Please provide a resolution comment');
        return;
    }
    try {
        const jwt = localStorage.getItem('jwt');
        const res = await fetch(`${apiBase}/Discrepancies/${discrepancyId}/resolve`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
            body: JSON.stringify({ resolutionComment })
        });
        if (res.ok) {
            alert('Discrepancy resolved successfully');
            bootstrap.Modal.getInstance(document.getElementById('resolveDiscrepancyModal')).hide();
            loadManagerDiscrepancies(projectId);
        } else {
            throw new Error('Failed to resolve discrepancy');
        }
    } catch (error) {
        alert(`Error resolving discrepancy: ${error.message}`);
    }
}

async function loadUserRoles() {
    const userRolesList = document.getElementById('user-roles-list');
    userRolesList.innerHTML = '<p>Loading users...</p>'; // Placeholder message

    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            userRolesList.innerHTML = '<p>Authentication token not found. Please log in.</p>';
            return;
        }

        const response = await fetch(`${apiBase}/auth/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to fetch users: ${response.status} ${error}`);
        }

        const users = await response.json();

        if (users.length === 0) {
            userRolesList.innerHTML = '<p>No users found.</p>';
            return;
        }

        let usersHtml = '<ul class="list-group">';
        users.forEach(user => {
            usersHtml += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    ${user.email}
                    <select class="form-control w-auto" data-user-id="${user.id}">
                        <option value="Manager" ${user.role === 'Manager' ? 'selected' : ''}>Manager</option>
                        <option value="TeamLead" ${user.role === 'TeamLead' ? 'selected' : ''}>TeamLead</option>
                        <option value="Employee" ${user.role === 'Employee' ? 'selected' : ''}>Employee</option>
                    </select>
                </li>
            `;
        });
        usersHtml += '</ul>';
        userRolesList.innerHTML = usersHtml;

        // Add event listeners for role changes
        userRolesList.querySelectorAll('select').forEach(select => {
            select.addEventListener('change', (event) => {
                const userId = event.target.dataset.userId;
                const newRole = event.target.value;
                console.log(`Attempting to change role for user ${userId} to ${newRole}`);
                updateRole(userId, newRole); // Call the updateRole function
            });
        });
    } catch (error) {
        console.error('Error loading users:', error);
        userRolesList.innerHTML = `<p>Error loading users: ${error.message}</p>`;
    }
}

async function updateRole(userId, newRole) {
    try {
        const jwt = localStorage.getItem('jwt');
        const res = await fetch(`${apiBase}/Users/${userId}/role`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
            body: JSON.stringify({ role: newRole })
        });
        if (res.ok) {
            alert('User role updated successfully');
        } else {
            throw new Error('Failed to update role');
        }
    } catch (error) {
        alert(`Error updating role: ${error.message}`);
    }
}

async function loadManagerGantt(projectId) {
    const ganttContent = document.getElementById('manager-gantt-content');
    ganttContent.innerHTML = '<p>Loading Gantt chart...</p>';

    try {
        const jwt = localStorage.getItem('jwt');
        // Fetch task data for Gantt chart
        const response = await fetch(`${apiBase}/gantt/project/${projectId}`, {
            headers: {
                'Authorization': `Bearer ${jwt}`
            }
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to fetch Gantt data: ${response.status} ${error}`);
        }

        const data = await response.json();
        const tasks = data.tasks; // Backend returns { project, tasks }

        if (!tasks || tasks.length === 0) {
            ganttContent.innerHTML = '<div class="alert alert-info">No tasks available to display in the Gantt chart for this project.</div>';
            return;
        }

        // Format data for Frappe Gantt
        const ganttTasks = tasks.map(task => ({
            id: task.id,
            name: task.name,
            start: task.start, // Assuming backend provides formatted date strings
            end: task.end,     // Assuming backend provides formatted date strings
            progress: task.progress || 0,
            dependencies: task.dependencies, // Assuming backend provides dependency IDs string
            custom_class: getTaskStatusClass(task.custom_class) // Use helper to get status class
        }));

        // Add a container for the Gantt chart
        ganttContent.innerHTML = '<div id="gantt-chart"></div>';

        // Initialize and render the Gantt chart
        const gantt = new Gantt("#gantt-chart", ganttTasks, {
            on_click: function (task) {
                console.log('Task clicked:', task);
                // Optionally, show task details in a modal or sidebar
                alert(`Task: ${task.name}\nStatus: ${task.custom_class.replace('task-', '')}\nProgress: ${task.progress}%`);
            },
            on_date_change: function(task, start, end) {
                console.log('Task date changed:', task, start, end);
                // TODO: Implement backend call to update task dates
                // updateTaskDates(task.id, start, end);
            },
            on_progress_change: function(task, progress) {
                console.log('Task progress changed:', task, progress);
                 // TODO: Implement backend call to update task progress
                // updateTaskProgress(task.id, progress);
            },
            on_view_change: function(mode) {
                console.log('View changed to:', mode);
            },
            view_modes: ['Quarter Day', 'Half Day', 'Day', 'Week', 'Month'],
            language: 'en'
        });

         // Example of changing view mode after initialization (optional)
         // gantt.change_view_mode('Week');

    } catch (error) {
        console.error('Error loading Gantt chart:', error);
        ganttContent.innerHTML = `<p>Error loading Gantt chart: ${error.message}</p>`;
    }
}

function renderTeamLeadDashboard(projectId) {
    document.getElementById('dashboard-content').innerHTML = `
    <ul class="nav nav-tabs" id="teamLeadTabs" role="tablist">
        <li class="nav-item">
            <button class="nav-link active" id="teamTasks-tab" data-bs-toggle="tab" data-bs-target="#teamTasks" type="button" role="tab">Team Tasks</button>
        </li>
        <li class="nav-item">
            <button class="nav-link" id="teamProgress-tab" data-bs-toggle="tab" data-bs-target="#teamProgress" type="button" role="tab">Team Progress</button>
        </li>
        <li class="nav-item">
            <button class="nav-link" id="teamReview-tab" data-bs-toggle="tab" data-bs-target="#teamReview" type="button" role="tab">Task Review</button>
        </li>
        <li class="nav-item">
            <button class="nav-link" id="teamDiscrepancies-tab" data-bs-toggle="tab" data-bs-target="#teamDiscrepancies" type="button" role="tab">Discrepancies</button>
        </li>
        <li class="nav-item">
            <button class="nav-link" id="teamReports-tab" data-bs-toggle="tab" data-bs-target="#teamReports" type="button" role="tab">Reports</button>
        </li>
        <li class="nav-item">
            <button class="nav-link" id="teamGantt-tab" data-bs-toggle="tab" data-bs-target="#teamGantt" type="button" role="tab">Gantt Chart</button>
        </li>
    </ul>
    <div class="tab-content mt-3" id="teamLeadTabsContent">
        <div class="tab-pane fade show active" id="teamTasks" role="tabpanel">
            <h4>Team Tasks</h4>
            <div id="team-tasks-list">Loading team tasks...</div>
            <button class="btn btn-primary mt-3" id="create-task-btn">Create New Task</button>
        </div>
        <div class="tab-pane fade" id="teamProgress" role="tabpanel">
            <h4>Team Progress Overview</h4>
            <div id="team-progress-overview">Loading team progress...</div>
        </div>
        <div class="tab-pane fade" id="teamReview" role="tabpanel">
            <h4>Tasks for Review</h4>
            <div id="team-task-review">Loading tasks for review...</div>
        </div>
        <div class="tab-pane fade" id="teamDiscrepancies" role="tabpanel">
            <h4>Team Discrepancies</h4>
            <div id="team-discrepancies-list">Loading discrepancies...</div>
            <button class="btn btn-danger mt-3" id="raise-discrepancy-btn">Raise New Discrepancy</button>
        </div>
        <div class="tab-pane fade" id="teamReports" role="tabpanel">
            <h4>Team Reports</h4>
            <div id="team-reports-content">Loading reports...</div>
        </div>
        <div class="tab-pane fade" id="teamGantt" role="tabpanel">
            <h4>Team Gantt Chart</h4>
            <div id="team-gantt-content">Loading Gantt chart...</div>
        </div>
    </div>
    `;
    // Load initial data for the default active tab (Team Tasks)
    loadTeamLeadTasks(projectId);

    // Add event listeners for tabs
    const teamLeadTabsContent = document.getElementById('teamLeadTabsContent');
    teamLeadTabsContent.querySelectorAll('.nav-link').forEach(tab => {
        tab.addEventListener('shown.bs.tab', (event) => {
            const targetId = event.target.id;
            if (targetId === 'teamProgress-tab') {
                loadTeamLeadProgress(projectId);
            } else if (targetId === 'teamReview-tab') {
                loadTeamLeadTaskReview(projectId);
            } else if (targetId === 'teamDiscrepancies-tab') {
                loadTeamLeadDiscrepancies(projectId);
            } else if (targetId === 'teamReports-tab') {
                loadTeamLeadReports(projectId);
            } else if (targetId === 'teamGantt-tab') {
                 loadManagerGantt(projectId); // Reusing Manager Gantt function
            }
        });
    });
}

async function loadTeamLeadTasks(projectId) {
    const jwt = localStorage.getItem('jwt');
    try {
        const tasksRes = await fetch(`${apiBase}/tasks?projectId=${projectId}`, { headers: { 'Authorization': `Bearer ${jwt}` } });
        if (!tasksRes.ok) {
            throw new Error('Failed to fetch tasks');
        }
        const tasks = await tasksRes.json();
        let html = '';
        if (tasks.length === 0) {
            html += '<div class="alert alert-info">No tasks found for this project.</div>';
        } else {
            html += '<ul class="list-group">';
            tasks.forEach(task => {
                html += `
                <li class="list-group-item">
                    <div>
                        <b>${task.title}</b> (Due: ${task.dueDate?.substring(0,10)}) - Status: <span id="task-status-${task.id}">${task.status}</span>
                        <p>${task.description}</p>
                        <div class="mt-2">
                            <button class="btn btn-sm btn-secondary edit-task-btn" data-task-id="${task.id}">Edit</button>
                            <select class="form-select form-select-sm d-inline-block w-auto task-status-select" data-task-id="${task.id}">
                                <option value="">Change Status</option>
                                <option value="ToDo">To Do</option>
                                <option value="InProgress">In Progress</option>
                                <option value="Review">Review</option>
                                <option value="Done">Done</option>
                                <option value="Blocked">Blocked</option>
                            </select>
                            <button class="btn btn-sm btn-secondary ms-2 log-time-comment-btn" data-task-id="${task.id}">Log Time/Comment</button>
                            <button class="btn btn-sm btn-info ms-2 view-history-btn" data-task-id="${task.id}">View History</button>
                        </div>
                    </div>
                </li>
                `;
            });
            html += '</ul>';
        }
        document.getElementById('team-tasks-list').innerHTML = html;

        // Add event listeners
        document.getElementById('create-task-btn').onclick = () => showCreateTaskModal(projectId);

        document.querySelectorAll('.edit-task-btn').forEach(button => {
            button.onclick = () => showEditTaskModal(button.dataset.taskId, projectId);
        });

        document.querySelectorAll('.task-status-select').forEach(select => {
            select.addEventListener('change', (event) => {
                const taskId = event.target.dataset.taskId;
                const newStatus = event.target.value;
                if (newStatus) {
                    updateTaskStatusTeamLead(taskId, newStatus, projectId); // Use TeamLead status update function
                }
                event.target.value = ''; // Reset the dropdown
            });
        });

        document.querySelectorAll('.log-time-comment-btn').forEach(button => {
            button.onclick = () => showLogTimeCommentModal(button.dataset.taskId, projectId);
        });

        document.querySelectorAll('.view-history-btn').forEach(button => {
            button.onclick = () => showTaskHistoryModal(button.dataset.taskId);
        });


    } catch (error) {
        console.error('Error loading team lead tasks:', error);
        document.getElementById('team-tasks-list').innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
}

async function loadTeamLeadProgress(projectId) {
    const progressContent = document.getElementById('team-progress-overview');
    progressContent.innerHTML = '<p>Loading team progress...</p>';

    try {
        const jwt = localStorage.getItem('jwt');
        // Fetch task status distribution for the project
        const statusRes = await fetch(`${apiBase}/reports/project-progress/${projectId}`, { headers: { 'Authorization': `Bearer ${jwt}` } });
        const statusData = statusRes.ok ? await statusRes.json() : [];

        let html = '<h4>Task Status Overview</h4>';

        if (statusData.length === 0) {
            html += '<div class="alert alert-info">No task status data available for this project.</div>';
        } else {
            // Display summary list
            html += '<ul class="list-group mb-3">';
            statusData.forEach(item => {
                html += `<li class="list-group-item">${item.status}: ${item.count}</li>`;
            });
            html += '</ul>';

            // Add canvas for Chart.js Pie Chart
            html += '<div style="width: 80%; margin: auto;"><canvas id="teamStatusPieChart"></canvas></div>';
        }

        // Add section for Team Velocity Chart
        html += '<h4 class="mt-4">Team Velocity (Tasks Completed per Week)</h4>';
        html += '<div style="width: 80%; margin: auto;"><canvas id="teamVelocityBarChart"></canvas></div>';

        // Add section for Task Completion by Priority Chart
        html += '<h4 class="mt-4">Task Completion by Priority</h4>';
        html += '<div style="width: 80%; margin: auto;"><canvas id="teamCompletionPriorityChart"></canvas></div>';

        progressContent.innerHTML = html;

        // Render Chart.js pie chart if data exists
        if (statusData.length > 0) {
            const ctx = document.getElementById('teamStatusPieChart').getContext('2d');
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: statusData.map(s => s.status),
                    datasets: [{
                        data: statusData.map(s => s.count),
                        backgroundColor: ['#0d6efd','#ffc107','#198754','#dc3545','#6c757d', '#0dcaf0'] // Added another color for Blocked
                    }]
                },
                options: { responsive: true }
            });
        }

        // Fetch and render Team Velocity Chart
        const velocityRes = await fetch(`${apiBase}/reports/project-velocity/${projectId}`, { headers: { 'Authorization': `Bearer ${jwt}` } });
        const velocityData = velocityRes.ok ? await velocityRes.json() : [];

        if (velocityData.length > 0) {
             const velocityCtx = document.getElementById('teamVelocityBarChart').getContext('2d');
             new Chart(velocityCtx, {
                 type: 'bar',
                 data: {
                     labels: velocityData.map(item => new Date(item.weekStart).toLocaleDateString()), // Format date for label
                     datasets: [{
                         label: 'Completed Tasks',
                         data: velocityData.map(item => item.completedCount),
                         backgroundColor: 'rgba(75, 192, 192, 0.6)',
                         borderColor: 'rgba(75, 192, 192, 1)',
                         borderWidth: 1
                     }]
                 },
                 options: {
                     responsive: true,
                     scales: {
                         y: {
                             beginAtZero: true,
                             title: {
                                 display: true,
                                 text: 'Number of Tasks Completed'
                             }
                         },
                         x: {
                              title: {
                                 display: true,
                                 text: 'Week Starting'
                             }
                         }
                     },
                      plugins: {
                         legend: {
                             display: true
                         }
                     }
                 }
             });
        }

        // Fetch and render Task Completion by Priority Chart
        const completionPriorityRes = await fetch(`${apiBase}/reports/project-completion-by-priority/${projectId}`, { headers: { 'Authorization': `Bearer ${jwt}` } });
        const completionPriorityData = completionPriorityRes.ok ? await completionPriorityData.json() : [];

        if (completionPriorityData.length > 0) {
             const completionPriorityCtx = document.getElementById('teamCompletionPriorityChart').getContext('2d');
             new Chart(completionPriorityCtx, {
                 type: 'bar',
                 data: {
                     labels: completionPriorityData.map(item => item.priority || 'Unspecified'),
                     datasets: [{
                         label: 'Completed Tasks by Priority',
                         data: completionPriorityData.map(item => item.completedCount),
                         backgroundColor: ['#198754','#ffc107','#dc3545','#6c757d'], // Green, Yellow, Red, Gray
                         borderColor: ['#198754','#ffc107','#dc3545','#6c757d'],
                         borderWidth: 1
                     }]
                 },
                 options: {
                     responsive: true,
                     scales: {
                         y: {
                             beginAtZero: true,
                             title: {
                                 display: true,
                                 text: 'Number of Tasks Completed'
                             }
                         },
                          x: {
                              title: {
                                 display: true,
                                 text: 'Priority'
                             }
                         }
                     },
                      plugins: {
                         legend: {
                             display: true
                         }
                     }
                 }
             });
        }

    } catch (error) {
        console.error('Error loading team progress:', error);
        progressContent.innerHTML = `<p>Error loading team progress: ${error.message}</p>`;
    }
}

async function loadTeamLeadTaskReview(projectId) {
    const taskReviewContent = document.getElementById('team-task-review');
    taskReviewContent.innerHTML = '<p>Loading tasks for review...</p>';

    try {
        const jwt = localStorage.getItem('jwt');
        // Fetch tasks for the current project that are in 'Review' status
        const response = await fetch(`${apiBase}/tasks?projectId=${projectId}&status=Review`, {
            headers: {
                'Authorization': `Bearer ${jwt}`
            }
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to fetch tasks for review: ${response.status} ${error}`);
        }

        const tasks = await response.json();

        let html = '<h4>Tasks for Review</h4>';

        if (tasks.length === 0) {
            html += '<div class="alert alert-info">No tasks currently in Review for this project.</div>';
        } else {
            html += '<ul class="list-group">';
            tasks.forEach(task => {
                html += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <b>${task.title}</b> (Due: ${task.dueDate?.substring(0,10)}) - Assigned to: ${task.assignedToId || 'Unassigned'}
                        <p>${task.description}</p>
                    </div>
                    <div>
                        <button class="btn btn-success btn-sm me-2 approve-task-tl" data-id="${task.id}">Approve (to Manager Review)</button>
                        <button class="btn btn-warning btn-sm reject-task-tl" data-id="${task.id}">Reject (to In Progress)</button>
                    </div>
                </li>
                `;
            });
            html += '</ul>';
        }

        taskReviewContent.innerHTML = html;

        // Add event listeners for approve/reject buttons
        document.querySelectorAll('.approve-task-tl').forEach(button => {
            button.onclick = () => updateTaskStatusTeamLead(button.dataset.id, 'Review', projectId); // Assuming 'Review' by TL moves it to 'Review' for Manager
        });
        document.querySelectorAll('.reject-task-tl').forEach(button => {
            button.onclick = () => {
                const comment = prompt('Enter rejection reason:');
                if (comment !== null) {
                     updateTaskStatusTeamLead(button.dataset.id, 'InProgress', projectId, comment);
                }
            };
        });

    } catch (error) {
        console.error('Error loading team lead task review:', error);
        taskReviewContent.innerHTML = `<p>Error loading tasks for review: ${error.message}</p>`;
    }
}

async function loadTeamLeadDiscrepancies(projectId) {
    const discrepanciesContent = document.getElementById('team-discrepancies-list');
    discrepanciesContent.innerHTML = '<p>Loading discrepancies...</p>';

    try {
        const jwt = localStorage.getItem('jwt');
        const response = await fetch(`${apiBase}/discrepancies`, {
            headers: {
                'Authorization': `Bearer ${jwt}`
            }
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to fetch discrepancies: ${response.status} ${error}`);
        }

        const allDiscrepancies = await response.json();

        // Filter discrepancies by current project ID
        const projectDiscrepancies = allDiscrepancies.filter(d => d.projectId === parseInt(projectId));

        let html = '<h4>Project Discrepancies</h4>';

        if (projectDiscrepancies.length === 0) {
            html += '<div class="alert alert-info">No discrepancies found for this project.</div>';
        } else {
            html += '<ul class="list-group">';
            projectDiscrepancies.forEach(discrepancy => {
                html += `
                <li class="list-group-item">
                    <div>
                        <b>${discrepancy.title}</b> (Status: ${discrepancy.status}) - Raised by: ${discrepancy.raisedByUserId}
                        <p>${discrepancy.description}</p>
                        ${discrepancy.status === 'Resolved' ? `<p>Resolution: ${discrepancy.resolutionComment}</p>` : ''}
                    </div>
                </li>
                `;
            });
            html += '</ul>';
        }

        discrepanciesContent.innerHTML = html;

        // Add event listener for raise discrepancy button
        document.getElementById('raise-discrepancy-btn').onclick = () => showRaiseDiscrepancyModal(projectId);

    } catch (error) {
        console.error('Error loading discrepancies:', error);
        discrepanciesContent.innerHTML = `<p>Error loading discrepancies: ${error.message}</p>`;
    }
}

async function loadTeamLeadReports(projectId) {
    const reportsContent = document.getElementById('team-reports-content');
    reportsContent.innerHTML = '<p>Loading reports...</p>';

    try {
        const jwt = localStorage.getItem('jwt');
        // Fetch project task summary report
        const response = await fetch(`${apiBase}/reports/project-task-summary/${projectId}`, {
            headers: {
                'Authorization': `Bearer ${jwt}`
            }
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to fetch project task summary: ${response.status} ${error}`);
        }

        const reportData = await response.json();

        let html = '<h4>Project Task Summary Report</h4>';

        if (!reportData) {
             html += '<div class="alert alert-info">No task summary data available for this project.</div>';
        } else {
            // The backend SP returns a list of objects with Status and TaskCount
            // We need to format this into the requested summary format.
            // Assuming the SP returns data for all relevant statuses (Total, Completed, Pending, In Progress, In Review, Overdue)
            // If not, the backend SP or this frontend logic needs adjustment.
            const totalTasks = reportData.reduce((sum, item) => sum + item.taskCount, 0);
            const completedTasks = reportData.find(item => item.status === 'Done')?.taskCount || 0;
            const pendingTasks = reportData.find(item => item.status === 'ToDo')?.taskCount || 0;
            const inProgressTasks = reportData.find(item => item.status === 'InProgress')?.taskCount || 0;
            const inReviewTasks = reportData.find(item => item.status === 'Review')?.taskCount || 0;
            // Overdue tasks are not directly provided by the SP, would need separate logic or SP modification
            const overdueTasks = 0; // Placeholder

            html += `
                <p><b>Total Tasks:</b> ${totalTasks}</p>
                <p><b>Completed Tasks:</b> ${completedTasks}</p>
                <p><b>Pending Tasks:</b> ${pendingTasks}</p>
                <p><b>Tasks in Progress:</b> ${inProgressTasks}</p>
                <p><b>Tasks in Review:</b> ${inReviewTasks}</p>
                <p><b>Overdue Tasks:</b> ${overdueTasks}</p>
            `;
        }

        reportsContent.innerHTML = html;

    } catch (error) {
        console.error('Error loading team reports:', error);
        reportsContent.innerHTML = `<p>Error loading reports: ${error.message}</p>`;
    }
}

function renderEmployeeDashboard(projectId) {
    document.getElementById('dashboard-content').innerHTML = `
    <h3>Employee Dashboard</h3>
    <ul class="nav nav-tabs" id="employeeTabs" role="tablist">
        <li class="nav-item" role="presentation">
            <button class="nav-link active" id="employeeTasks-tab" data-bs-toggle="tab" data-bs-target="#employeeTasks" type="button" role="tab" aria-controls="employeeTasks" aria-selected="true">My Tasks</button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="employeeNotifications-tab" data-bs-toggle="tab" data-bs-target="#employeeNotifications" type="button" role="tab" aria-controls="employeeNotifications" aria-selected="false">Notifications</button>
        </li>
         <li class="nav-item" role="presentation">
            <button class="nav-link" id="employeeProfile-tab" data-bs-toggle="tab" data-bs-target="#employeeProfile" type="button" role="tab" aria-controls="employeeProfile" aria-selected="false">Profile</button>
        </li>
    </ul>
    <div class="tab-content mt-3" id="employeeTabsContent">
        <div class="tab-pane fade show active" id="employeeTasks" role="tabpanel" aria-labelledby="employeeTasks-tab">
            <h4>My Assigned Tasks</h4>
            <div id="employee-tasks-list">Loading tasks...</div>
        </div>
        <div class="tab-pane fade" id="employeeNotifications" role="tabpanel" aria-labelledby="employeeNotifications-tab">
            <h4>My Notifications</h4>
            <div id="employee-notifications-list">Loading notifications...</div>
        </div>
         <div class="tab-pane fade" id="employeeProfile" role="tabpanel" aria-labelledby="employeeProfile-tab">
            <h4>My Profile</h4>
            <div id="employee-profile-content">Loading profile...</div>
        </div>
    </div>
    `;

    // Load initial data for the default active tab (My Tasks)
    loadEmployeeTasks(projectId);

    // Add event listeners for tabs
    const employeeTabsContent = document.getElementById('employeeTabsContent');
    employeeTabsContent.querySelectorAll('.nav-link').forEach(tab => {
        tab.addEventListener('shown.bs.tab', (event) => {
            const targetId = event.target.id;
            if (targetId === 'employeeNotifications-tab') {
                loadEmployeeNotifications();
            } else if (targetId === 'employeeProfile-tab') {
                loadEmployeeProfile();
            }
        });
    });
}

async function loadEmployeeTasks(projectId) {
    const tasksList = document.getElementById('employee-tasks-list');
    tasksList.innerHTML = '<p>Loading tasks...</p>';

    try {
        const jwt = localStorage.getItem('jwt');
        // Fetch tasks assigned to the current user for this project
        const response = await fetch(`${apiBase}/tasks?projectId=${projectId}&assignedToMe=true`, {
            headers: {
                'Authorization': `Bearer ${jwt}`
            }
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to fetch employee tasks: ${response.status} ${error}`);
        }

        const tasks = await response.json();

        let html = '';
        if (tasks.length === 0) {
            html += '<div class="alert alert-info">No tasks assigned to you for this project.</div>';
        } else {
            html += '<ul class="list-group">';
            tasks.forEach(task => {
                html += `
                <li class="list-group-item">
                    <div>
                        <b>${task.title}</b> (Due: ${task.dueDate?.substring(0,10)}) - Status: <span id="task-status-${task.id}">${task.status}</span>
                        <p>${task.description}</p>
                        <div class="mt-2">
                            <select class="form-select form-select-sm d-inline-block w-auto task-status-select" data-task-id="${task.id}">
                                <option value="">Change Status</option>
                                <option value="ToDo">To Do</option>
                                <option value="InProgress">In Progress</option>
                                <option value="Review">Review</option>
                                <option value="Done">Done</option>
                                <option value="Blocked">Blocked</option>
                            </select>
                            <button class="btn btn-sm btn-secondary ms-2 log-time-comment-btn" data-task-id="${task.id}">Log Time/Comment</button>
                            <button class="btn btn-sm btn-info ms-2 view-history-btn" data-task-id="${task.id}">View History</button>
                        </div>
                    </div>
                </li>
                `;
            });
            html += '</ul>';
        }

        tasksList.innerHTML = html;

        // Add event listeners for status change, log time/comment, and view history
        document.querySelectorAll('.task-status-select').forEach(select => {
            select.addEventListener('change', (event) => {
                const taskId = event.target.dataset.taskId;
                const newStatus = event.target.value;
                if (newStatus) {
                     updateTaskStatusEmployee(taskId, newStatus, projectId); // Assuming projectId is needed for reload
                }
                event.target.value = ''; // Reset the dropdown
            });
        });

        document.querySelectorAll('.log-time-comment-btn').forEach(button => {
            button.onclick = () => showLogTimeCommentModal(button.dataset.taskId, projectId); // Assuming projectId is needed
        });

        document.querySelectorAll('.view-history-btn').forEach(button => {
            button.onclick = () => showTaskHistoryModal(button.dataset.taskId);
        });

    } catch (error) {
        console.error('Error loading employee tasks:', error);
        tasksList.innerHTML = `<p>Error loading tasks: ${error.message}</p>`;
    }
}

async function updateTaskStatusEmployee(taskId, newStatus, projectId) {
    try {
        const jwt = localStorage.getItem('jwt');
        const res = await fetch(`${apiBase}/Tasks/${taskId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
            body: JSON.stringify({ newStatus })
        });
        if (res.ok) {
            alert(`Task ${taskId} status updated to ${newStatus}`);
            loadEmployeeTasks(projectId);
        } else {
            throw new Error('Failed to update task status');
        }
    } catch (error) {
        alert(`Error updating task status: ${error.message}`);
    }
}

async function loadEmployeeNotifications() {
    const notificationsList = document.getElementById('employee-notifications-list');
    notificationsList.innerHTML = '<p>Loading notifications...</p>';

    try {
        const jwt = localStorage.getItem('jwt');
        const response = await fetch(`${apiBase}/notifications`, {
            headers: {
                'Authorization': `Bearer ${jwt}`
            }
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to fetch notifications: ${response.status} ${error}`);
        }

        const notifications = await response.json();

        let html = '';
        if (notifications.length === 0) {
            html += '<div class="alert alert-info">No notifications.</div>';
        } else {
            html += '<ul class="list-group">';
            notifications.forEach(notification => {
                // Assuming notification object has Title, Message, and Timestamp
                html += `
                <li class="list-group-item">
                    <div>
                        <b>${notification.title}</b>
                        <p>${notification.message}</p>
                        <small class="text-muted">${new Date(notification.timestamp).toLocaleString()}</small>
                    </div>
                </li>
                `;
            });
            html += '</ul>';
        }

        notificationsList.innerHTML = html;

    } catch (error) {
        console.error('Error loading notifications:', error);
        notificationsList.innerHTML = `<p>Error loading notifications: ${error.message}</p>`;
    }
}

async function loadEmployeeProfile() {
    const profileContent = document.getElementById('employee-profile-content');
    profileContent.innerHTML = '<p>Loading profile...</p>';

    try {
        const jwt = localStorage.getItem('jwt');
        // Assuming a GET endpoint for the current user's profile
        const response = await fetch(`${apiBase}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${jwt}`
            }
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to fetch profile: ${response.status} ${error}`);
        }

        const user = await response.json();

        let html = `
            <div>
                <p><b>Email:</b> ${user.email}</p>
                <p><b>Full Name:</b> ${user.fullName || 'Not provided'}</p>
                <p><b>Role:</b> ${user.role}</p>
                <p><b>Skills:</b> ${user.skills || 'Not provided'}</p>
                <p><b>Availability:</b> ${user.availability || 'Not provided'}</p>
                 <button class="btn btn-primary mt-3" id="edit-profile-btn" data-user-id="${user.id}">Edit Profile</button>
            </div>
        `;

        profileContent.innerHTML = html;

        // Add event listener for edit profile button
        document.getElementById('edit-profile-btn').onclick = () => showEditProfileModal(user.id);

    } catch (error) {
        console.error('Error loading profile:', error);
        profileContent.innerHTML = `<p>Error loading profile: ${error.message}</p>`;
    }
}

function showEditProfileModal(userId) {
     const existingModal = document.getElementById('editProfileModal');
     if (existingModal) existingModal.remove();

     // Fetch user details to pre-fill the form
     const jwt = localStorage.getItem('jwt');
      fetch(`${apiBase}/auth/${userId}`, { headers: { 'Authorization': `Bearer ${jwt}` } })
     .then(response => response.json())
     .then(user => {

         const modalHtml = `
         <div class="modal fade" id="editProfileModal" tabindex="-1" aria-labelledby="editProfileModalLabel" aria-hidden="true">
             <div class="modal-dialog">
                 <div class="modal-content">
                     <div class="modal-header">
                         <h5 class="modal-title" id="editProfileModalLabel">Edit Profile</h5>
                         <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                     </div>
                     <div class="modal-body">
                         <form id="edit-profile-form">
                             <input type="hidden" id="edit-profile-user-id" value="${user.id}">
                             <div class="mb-3">
                                 <label for="edit-profile-fullname" class="form-label">Full Name</label>
                                 <input type="text" class="form-control" id="edit-profile-fullname" value="${user.fullName || ''}">
                             </div>
                             <div class="mb-3">
                                 <label for="edit-profile-skills" class="form-label">Skills</label>
                                 <input type="text" class="form-control" id="edit-profile-skills" value="${user.skills || ''}">
                             </div>
                              <div class="mb-3">
                                 <label for="edit-profile-availability" class="form-label">Availability</label>
                                 <input type="text" class="form-control" id="edit-profile-availability" value="${user.availability || ''}">
                             </div>
                         </form>
                     </div>
                     <div class="modal-footer">
                         <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                         <button type="button" class="btn btn-primary" id="save-profile-btn">Save Profile</button>
                     </div>
                 </div>
             </div>
         </div>
         `;
         document.body.insertAdjacentHTML('beforeend', modalHtml);

         const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
         document.getElementById('save-profile-btn').onclick = () => handleSaveProfile();
         modal.show();

         document.getElementById('editProfileModal').addEventListener('hidden.bs.modal', function () {
             this.remove();
         });

     })
     .catch(error => {
         console.error('Error fetching user details for edit:', error);
         alert(`Error loading profile for editing: ${error.message}`);
     });

}

async function handleSaveProfile() {
    const userId = document.getElementById('edit-profile-user-id').value;
    const updatedProfileData = {
        fullName: document.getElementById('edit-profile-fullname').value,
        skills: document.getElementById('edit-profile-skills').value,
        availability: document.getElementById('edit-profile-availability').value,
        // Do not include email or role here, as they should not be editable by the user
    };

    try {
        const jwt = localStorage.getItem('jwt');
        // Assuming a PUT endpoint to update user profile details
        const res = await fetch(`${apiBase}/auth/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
            body: JSON.stringify(updatedProfileData)
        });

        if (res.ok) {
            alert('Profile updated successfully.');
            bootstrap.Modal.getInstance(document.getElementById('editProfileModal')).hide();
            loadEmployeeProfile(); // Reload profile section
        } else {
            const error = await res.text();
            throw new Error(`Failed to update profile: ${res.status} ${error}`);
        }

    } catch (error) {
        console.error('Error saving profile:', error);
        alert(`Error saving profile: ${error.message}`);
    }
}