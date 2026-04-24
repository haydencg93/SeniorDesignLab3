// Kaedens Profile Scripts

let _supabase;

function setContactStatus(message, state = 'idle') {
    const status = document.getElementById('contact-status');
    if (!status) {
        return;
    }

    status.textContent = message;
    if (state === 'idle') {
        delete status.dataset.state;
        return;
    }

    status.dataset.state = state;
}

// Creates a project card for portfolio display based on project data
function createProjectCard(project) {
    const article = document.createElement('article');
    article.className = 'project-card';

    
    const title = document.createElement('p');
    title.className = 'project-title';
    title.textContent = project.title;

    const copy = document.createElement('p');
    copy.className = 'project-copy';
    copy.textContent = project.description;

    const stack = document.createElement('p');
    stack.className = 'project-stack';
    stack.textContent = project.stack;

    article.append(title, copy, stack);

    // Add GitHub and Demo links if they exist
    if (project.github) {
        const githubLink = document.createElement('a');
        githubLink.className = 'project-link';
        githubLink.href = project.github;
        githubLink.target = '_blank';
        githubLink.rel = 'noopener';
        githubLink.textContent = 'View on GitHub';
        article.appendChild(githubLink);
    }

    if (project.demo) {
        const demoLink = document.createElement('a');
        demoLink.className = 'project-link project-link-secondary';
        demoLink.href = project.demo;
        demoLink.target = '_blank';
        demoLink.rel = 'noopener';
        demoLink.textContent = 'Live Demo';
        article.appendChild(demoLink);
    }

    return article;
}

// Normalizes project data to ensure we have an array of projects regardless of the original structure
function normalizeProjects(payload) {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (payload && Array.isArray(payload.projects)) {
        return payload.projects;
    }

    return [];
}

// Loads project data from the JSON file and populates the featured and all projects sections
async function loadProjects() {
    const featuredContainer = document.getElementById('featured-projects');
    const allProjectsContainer = document.getElementById('all-projects');

    if (!featuredContainer && !allProjectsContainer) {
        return;
    }

    try {
        const response = await fetch('static/projects/projects.json');
        if (!response.ok) {
            throw new Error('Could not load project data.');
        }

        const payload = await response.json();
        const projects = normalizeProjects(payload);

        if (!projects.length) {
            throw new Error('No projects were found in the project data file.');
        }

        if (featuredContainer) {
            const limit = Number(featuredContainer.dataset.projectLimit || projects.length);
            projects
                .filter((project) => project.featured !== false)
                .slice(0, limit)
                .forEach((project) => {
                    featuredContainer.appendChild(createProjectCard(project));
                });
        }

        if (allProjectsContainer) {
            projects.forEach((project) => {
                allProjectsContainer.appendChild(createProjectCard(project));
            });
        }
    } catch (err) {
        console.error('Project loading error:', err);

        [featuredContainer, allProjectsContainer].forEach((container) => {
            if (!container) return;

            const fallbackMessage = document.createElement('p');
            fallbackMessage.className = 'project-copy';
            fallbackMessage.textContent = 'Projects could not be loaded right now.';
            container.appendChild(fallbackMessage);
        });
    }
}

/**
 * Initialize Supabase using the shared CONFIG.json
 */
async function init() {
    await loadProjects();

    try {
        if (!window.supabase || typeof window.supabase.createClient !== 'function') {
            throw new Error('Supabase client library did not load.');
        }

        // Path assumes CONFIG.json is in static/scripts/ relative to the site root
        // From kaeden/static/scripts/, we go up two levels to find the shared assets
        const response = await fetch('../static/scripts/CONFIG.json');
        if (!response.ok) throw new Error("Could not load configuration.");
        
        const config = await response.json();
        if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
            throw new Error('Configuration is missing Supabase credentials.');
        }

        _supabase = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
        
        console.log("Supabase linked to Kaeden's Profile.");
        setupForms();
    } catch (err) {
        console.error("Initialization error:", err);
        setContactStatus('Messaging is unavailable right now. Please refresh and try again.', 'error');
    }
}

/**
 * Requirement #4: Contact Form Logic
 * Saves messages to the 'messages' table with recipient, content, and sender IP.
 */
function setupForms() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;

    const messageBox = document.getElementById('contact-message');
    const submitButton = contactForm.querySelector('button[type="submit"]');
    if (!messageBox || !submitButton) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const messageContent = messageBox.value.trim();

        if (!_supabase) {
            setContactStatus('Database connection is not ready yet.', 'error');
            return;
        }

        if (!messageContent) {
            setContactStatus('Please enter a message before sending.', 'error');
            messageBox.focus();
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
        setContactStatus('Sending message...', 'idle');

        let senderIp = "Unknown";
        try {
            // Fetch the user's public IP address for the sender_ip
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            if (ipResponse.ok) {
                const ipData = await ipResponse.json();
                senderIp = ipData.ip || senderIp;
            }
        } catch (ipErr) {
            console.warn("Could not fetch IP, proceeding as Unknown.");
        }

        try {
            const { error } = await _supabase
                .from('messages')
                .insert([
                    {
                        recipient_name: 'Kaeden',
                        message_content: messageContent,
                        sender_ip: senderIp
                    }
                ]);

            if (error) {
                throw error;
            }

            contactForm.reset();
            setContactStatus("Message sent successfully.", 'success');
        } catch (error) {
            console.error("Error saving message:", error);
            setContactStatus('Failed to send message. Check the browser console and Supabase policies.', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Send Message';
        }
    });
}

// Fire initialization on load
document.addEventListener('DOMContentLoaded', init);
