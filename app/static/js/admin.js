/**
 * Hospital Admin Dashboard JavaScript
 * Multi-tenant hospital management system
 */

class HospitalAdmin {
    constructor() {
        this.hospitalId = null;
        this.token = null;
        this.currentSection = 'dashboard';
        this.charts = {};
        this.init();
    }

    init() {
        this.loadAuth();
        this.setupEventListeners();
        this.loadDashboardData();
    }

    loadAuth() {
        // Get hospital ID from URL or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        this.hospitalId = urlParams.get('hospital_id') || localStorage.getItem('hospital_id');
        this.token = localStorage.getItem('admin_token');
        
        if (!this.hospitalId || !this.token) {
            this.redirectToLogin();
            return;
        }
        
        // Set hospital ID in localStorage
        localStorage.setItem('hospital_id', this.hospitalId);
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
            });
        });

        // Search and filters
        const searchInput = document.getElementById('appointment-search');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(this.searchAppointments.bind(this), 300));
        }

        const filterSelect = document.getElementById('appointment-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', this.filterAppointments.bind(this));
        }

        // Forms
        const hospitalForm = document.getElementById('hospital-settings-form');
        if (hospitalForm) {
            hospitalForm.addEventListener('submit', this.saveHospitalSettings.bind(this));
        }

        const chatForm = document.getElementById('chat-settings-form');
        if (chatForm) {
            chatForm.addEventListener('submit', this.saveChatSettings.bind(this));
        }

        const widgetForm = document.getElementById('widget-settings-form');
        if (widgetForm) {
            widgetForm.addEventListener('submit', this.saveWidgetSettings.bind(this));
        }

        // Department form
        const deptForm = document.getElementById('department-form');
        if (deptForm) {
            deptForm.addEventListener('submit', this.saveDepartment.bind(this));
        }

        // Doctor form
        const doctorForm = document.getElementById('doctor-form');
        if (doctorForm) {
            doctorForm.addEventListener('submit', this.saveDoctor.bind(this));
        }
    }

    showSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update sections
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${sectionName}-section`).classList.add('active');

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            appointments: 'Appointments',
            departments: 'Departments',
            doctors: 'Doctors',
            settings: 'Settings',
            widget: 'Widget Setup'
        };
        
        document.getElementById('page-title').textContent = titles[sectionName];
        this.currentSection = sectionName;

        // Load section-specific data
        this.loadSectionData(sectionName);
    }

    async loadSectionData(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'appointments':
                await this.loadAppointments();
                break;
            case 'departments':
                await this.loadDepartments();
                break;
            case 'doctors':
                await this.loadDoctors();
                break;
            case 'settings':
                await this.loadSettings();
                break;
            case 'widget':
                await this.loadWidgetConfig();
                break;
        }
    }

    async loadDashboardData() {
        try {
            // Load statistics
            const stats = await this.apiCall('GET', `/hospitals/${this.hospitalId}/stats`);
            this.updateStats(stats);

            // Load chart data
            const chartData = await this.apiCall('GET', `/hospitals/${this.hospitalId}/chart-data`);
            this.updateCharts(chartData);

            // Load recent activity
            const activity = await this.apiCall('GET', `/hospitals/${this.hospitalId}/recent-activity`);
            this.updateRecentActivity(activity);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Error loading dashboard data', 'error');
        }
    }

    updateStats(stats) {
        const statElements = {
            'total-appointments': stats.total_appointments || 0,
            'confirmed-appointments': stats.confirmed_today || 0,
            'total-doctors': stats.total_doctors || 0,
            'chat-sessions': stats.chat_sessions || 0
        };

        Object.entries(statElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                this.animateNumber(element, 0, value, 1000);
            }
        });
    }

    updateCharts(data) {
        const ctx = document.getElementById('appointmentsChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.appointments) {
            this.charts.appointments.destroy();
        }

        this.charts.appointments = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Appointments',
                    data: data.appointments || [12, 19, 3, 5, 2, 3, 8],
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    updateRecentActivity(activities) {
        const container = document.getElementById('recent-activity-list');
        if (!container) return;

        container.innerHTML = '';

        activities.forEach(activity => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `
                <div class="activity-icon">${activity.icon}</div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-time">${this.formatTime(activity.time)}</div>
                </div>
            `;
            container.appendChild(item);
        });
    }

    async loadAppointments() {
        try {
            const appointments = await this.apiCall('GET', `/hospitals/${this.hospitalId}/appointments`);
            this.renderAppointments(appointments);
        } catch (error) {
            console.error('Error loading appointments:', error);
            this.showNotification('Error loading appointments', 'error');
        }
    }

    renderAppointments(appointments) {
        const tbody = document.getElementById('appointments-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        appointments.forEach(appointment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${appointment.id}</td>
                <td>${appointment.name}</td>
                <td>${appointment.phone}</td>
                <td>${appointment.department_name}</td>
                <td>${appointment.doctor_name}</td>
                <td>${this.formatDateTime(appointment.date, appointment.time)}</td>
                <td><span class="status-badge ${appointment.status}">${appointment.status}</span></td>
                <td>
                    <button class="btn-icon" onclick="admin.viewAppointment('${appointment.id}')" title="View">
                        👁️
                    </button>
                    <button class="btn-icon" onclick="admin.editAppointment('${appointment.id}')" title="Edit">
                        ✏️
                    </button>
                    <button class="btn-icon" onclick="admin.deleteAppointment('${appointment.id}')" title="Delete">
                        🗑️
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadDepartments() {
        try {
            const departments = await this.apiCall('GET', `/hospitals/${this.hospitalId}/departments`);
            this.renderDepartments(departments);
        } catch (error) {
            console.error('Error loading departments:', error);
            this.showNotification('Error loading departments', 'error');
        }
    }

    renderDepartments(departments) {
        const container = document.getElementById('departments-grid');
        if (!container) return;

        container.innerHTML = '';

        departments.forEach(dept => {
            const card = document.createElement('div');
            card.className = 'department-card';
            card.innerHTML = `
                <div class="card-header">
                    <h3 class="card-title">${dept.name.en}</h3>
                    <div class="card-actions">
                        <button class="btn-icon" onclick="admin.editDepartment('${dept.id}')" title="Edit">
                            ✏️
                        </button>
                        <button class="btn-icon" onclick="admin.deleteDepartment('${dept.id}')" title="Delete">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="card-content">
                    <p><strong>Hindi:</strong> ${dept.name.hi || 'N/A'}</p>
                    <p><strong>Marathi:</strong> ${dept.name.mr || 'N/A'}</p>
                    <p><strong>Description:</strong> ${dept.description || 'No description available'}</p>
                </div>
            `;
            container.appendChild(card);
        });
    }

    async loadDoctors() {
        try {
            const doctors = await this.apiCall('GET', `/hospitals/${this.hospitalId}/doctors`);
            this.renderDoctors(doctors);
        } catch (error) {
            console.error('Error loading doctors:', error);
            this.showNotification('Error loading doctors', 'error');
        }
    }

    renderDoctors(doctors) {
        const container = document.getElementById('doctors-grid');
        if (!container) return;

        container.innerHTML = '';

        doctors.forEach(doctor => {
            const card = document.createElement('div');
            card.className = 'doctor-card';
            card.innerHTML = `
                <div class="card-header">
                    <h3 class="card-title">${doctor.name.en}</h3>
                    <div class="card-actions">
                        <button class="btn-icon" onclick="admin.editDoctor('${doctor.id}')" title="Edit">
                            ✏️
                        </button>
                        <button class="btn-icon" onclick="admin.deleteDoctor('${doctor.id}')" title="Delete">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="card-content">
                    <p><strong>Department:</strong> ${doctor.department_name}</p>
                    <p><strong>Education:</strong> ${doctor.education || 'N/A'}</p>
                    <p><strong>Experience:</strong> ${doctor.experience || 'N/A'}</p>
                    <p><strong>Fees:</strong> ${doctor.fees || 'N/A'}</p>
                </div>
            `;
            container.appendChild(card);
        });
    }

    async loadSettings() {
        try {
            const settings = await this.apiCall('GET', `/hospitals/${this.hospitalId}/settings`);
            this.populateSettings(settings);
        } catch (error) {
            console.error('Error loading settings:', error);
            this.showNotification('Error loading settings', 'error');
        }
    }

    populateSettings(settings) {
        // Populate hospital settings form
        if (settings.hospital) {
            document.getElementById('hospital-name').value = settings.hospital.name || '';
            document.getElementById('hospital-phone').value = settings.hospital.phone || '';
            document.getElementById('hospital-email').value = settings.hospital.email || '';
            document.getElementById('hospital-address').value = settings.hospital.address || '';
        }

        // Populate chat settings
        if (settings.chat) {
            document.getElementById('welcome-message').value = settings.chat.welcome_message || '';
            // Set language checkboxes
            settings.chat.languages?.forEach(lang => {
                const checkbox = document.querySelector(`input[value="${lang}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
    }

    async loadWidgetConfig() {
        try {
            const config = await this.apiCall('GET', `/hospitals/${this.hospitalId}/widget/config`);
            this.updateWidgetPreview(config);
            this.updateEmbedCode(config);
        } catch (error) {
            console.error('Error loading widget config:', error);
            this.showNotification('Error loading widget configuration', 'error');
        }
    }

    updateWidgetPreview(config) {
        const demo = document.getElementById('widget-demo');
        if (!demo) return;

        demo.innerHTML = `
            <div style="
                background: ${config.primary_color};
                color: white;
                padding: 20px;
                border-radius: 12px;
                text-align: center;
                font-family: Arial, sans-serif;
            ">
                <h4>${config.name}</h4>
                <p>Chat Assistant Widget</p>
                <button style="
                    background: white;
                    color: ${config.primary_color};
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                ">Start Chat</button>
            </div>
        `;
    }

    updateEmbedCode(config) {
        const textarea = document.getElementById('embed-code');
        if (!textarea) return;

        const code = `<!-- ${config.name} Chat Assistant Widget -->
<div id="hospital-chat-widget"></div>
<script>
(function() {
    var script = document.createElement('script');
    script.src = '${window.location.origin}/widget/${config.hospital_id}/embed.js';
    script.async = true;
    document.head.appendChild(script);
})();
</script>`;

        textarea.value = code;
    }

    // Modal functions
    openDepartmentModal() {
        document.getElementById('department-modal').classList.add('active');
    }

    closeDepartmentModal() {
        document.getElementById('department-modal').classList.remove('active');
        document.getElementById('department-form').reset();
    }

    openDoctorModal() {
        this.loadDepartmentOptions();
        document.getElementById('doctor-modal').classList.add('active');
    }

    closeDoctorModal() {
        document.getElementById('doctor-modal').classList.remove('active');
        document.getElementById('doctor-form').reset();
    }

    async loadDepartmentOptions() {
        try {
            const departments = await this.apiCall('GET', `/hospitals/${this.hospitalId}/departments`);
            const select = document.getElementById('doctor-department');
            select.innerHTML = '<option value="">Select Department</option>';
            
            departments.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept.id;
                option.textContent = dept.name.en;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading departments:', error);
        }
    }

    // Form submission handlers
    async saveDepartment(e) {
        e.preventDefault();
        
        const formData = {
            name: {
                en: document.getElementById('dept-name-en').value,
                hi: document.getElementById('dept-name-hi').value,
                mr: document.getElementById('dept-name-mr').value
            },
            description: document.getElementById('dept-description').value
        };

        try {
            await this.apiCall('POST', `/hospitals/${this.hospitalId}/departments`, formData);
            this.showNotification('Department created successfully', 'success');
            this.closeDepartmentModal();
            this.loadDepartments();
        } catch (error) {
            console.error('Error saving department:', error);
            this.showNotification('Error creating department', 'error');
        }
    }

    async saveDoctor(e) {
        e.preventDefault();
        
        const formData = {
            name: {
                en: document.getElementById('doctor-name-en').value,
                hi: document.getElementById('doctor-name-hi').value,
                mr: document.getElementById('doctor-name-mr').value
            },
            department_id: document.getElementById('doctor-department').value,
            education: document.getElementById('doctor-education').value,
            experience: document.getElementById('doctor-experience').value,
            fees: document.getElementById('doctor-fees').value
        };

        try {
            await this.apiCall('POST', `/hospitals/${this.hospitalId}/doctors`, formData);
            this.showNotification('Doctor created successfully', 'success');
            this.closeDoctorModal();
            this.loadDoctors();
        } catch (error) {
            console.error('Error saving doctor:', error);
            this.showNotification('Error creating doctor', 'error');
        }
    }

    async saveHospitalSettings(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('hospital-name').value,
            phone: document.getElementById('hospital-phone').value,
            email: document.getElementById('hospital-email').value,
            address: document.getElementById('hospital-address').value
        };

        try {
            await this.apiCall('PUT', `/hospitals/${this.hospitalId}/settings`, formData);
            this.showNotification('Hospital settings saved successfully', 'success');
        } catch (error) {
            console.error('Error saving hospital settings:', error);
            this.showNotification('Error saving settings', 'error');
        }
    }

    async saveChatSettings(e) {
        e.preventDefault();
        
        const languages = Array.from(document.querySelectorAll('#chat-settings-form input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        
        const formData = {
            welcome_message: document.getElementById('welcome-message').value,
            languages: languages
        };

        try {
            await this.apiCall('PUT', `/hospitals/${this.hospitalId}/chat-settings`, formData);
            this.showNotification('Chat settings saved successfully', 'success');
        } catch (error) {
            console.error('Error saving chat settings:', error);
            this.showNotification('Error saving chat settings', 'error');
        }
    }

    async saveWidgetSettings(e) {
        e.preventDefault();
        
        const formData = {
            position: document.getElementById('widget-position').value,
            size: document.getElementById('widget-size').value,
            primary_color: document.getElementById('widget-primary-color').value
        };

        try {
            await this.apiCall('PUT', `/hospitals/${this.hospitalId}/widget-settings`, formData);
            this.showNotification('Widget settings saved successfully', 'success');
            this.loadWidgetConfig();
        } catch (error) {
            console.error('Error saving widget settings:', error);
            this.showNotification('Error saving widget settings', 'error');
        }
    }

    // Utility functions
    async apiCall(method, endpoint, data = null) {
        const url = `/api/v1${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`API call failed: ${response.statusText}`);
        }

        return await response.json();
    }

    animateNumber(element, start, end, duration) {
        const startTime = performance.now();
        const difference = end - start;

        function updateNumber(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(start + (difference * progress));
            
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        }

        requestAnimationFrame(updateNumber);
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleString();
    }

    formatDateTime(date, time) {
        return `${date} at ${time}`;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            zIndex: '3000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });

        // Set background color based on type
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    redirectToLogin() {
        window.location.href = '/admin/login';
    }

    logout() {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('hospital_id');
        this.redirectToLogin();
    }

    // Action handlers
    viewAppointment(id) {
        console.log('View appointment:', id);
        // Implement view appointment functionality
    }

    editAppointment(id) {
        console.log('Edit appointment:', id);
        // Implement edit appointment functionality
    }

    deleteAppointment(id) {
        if (confirm('Are you sure you want to delete this appointment?')) {
            console.log('Delete appointment:', id);
            // Implement delete appointment functionality
        }
    }

    editDepartment(id) {
        console.log('Edit department:', id);
        // Implement edit department functionality
    }

    deleteDepartment(id) {
        if (confirm('Are you sure you want to delete this department?')) {
            console.log('Delete department:', id);
            // Implement delete department functionality
        }
    }

    editDoctor(id) {
        console.log('Edit doctor:', id);
        // Implement edit doctor functionality
    }

    deleteDoctor(id) {
        if (confirm('Are you sure you want to delete this doctor?')) {
            console.log('Delete doctor:', id);
            // Implement delete doctor functionality
        }
    }

    copyEmbedCode() {
        const textarea = document.getElementById('embed-code');
        textarea.select();
        document.execCommand('copy');
        this.showNotification('Embed code copied to clipboard!', 'success');
    }

    refreshData() {
        this.loadSectionData(this.currentSection);
        this.showNotification('Data refreshed', 'success');
    }
}

// Initialize admin dashboard
function initializeAdminDashboard() {
    window.admin = new HospitalAdmin();
}

// Global functions for HTML onclick handlers
function logout() {
    if (window.admin) {
        window.admin.logout();
    }
}

function refreshData() {
    if (window.admin) {
        window.admin.refreshData();
    }
}

function openDepartmentModal() {
    if (window.admin) {
        window.admin.openDepartmentModal();
    }
}

function closeDepartmentModal() {
    if (window.admin) {
        window.admin.closeDepartmentModal();
    }
}

function openDoctorModal() {
    if (window.admin) {
        window.admin.openDoctorModal();
    }
}

function closeDoctorModal() {
    if (window.admin) {
        window.admin.closeDoctorModal();
    }
}

function saveDepartment() {
    if (window.admin) {
        window.admin.saveDepartment(event);
    }
}

function saveDoctor() {
    if (window.admin) {
        window.admin.saveDoctor(event);
    }
}

function copyEmbedCode() {
    if (window.admin) {
        window.admin.copyEmbedCode();
    }
}
