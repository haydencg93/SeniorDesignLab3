// Kaedens Profile Scripts

let _supabase;

// Utility function to update the contact form status message and state (idle, success, error)
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
        const cacheBuster = `?t=${Date.now()}`;
        const response = await fetch(`static/projects/projects.json${cacheBuster}`);
        if (!response.ok) {
            throw new Error('Could not load project data.');
        }

        const payload = await response.json();
        const projects = normalizeProjects(payload);

        if (!projects.length) {
            throw new Error('No projects were found in the project data file.');
        }

        if (featuredContainer) {
            featuredContainer.innerHTML = '';
            const limit = Number(featuredContainer.dataset.projectLimit || projects.length);
            projects
                .filter((project) => project.featured !== false)
                .slice(0, limit)
                .forEach((project) => {
                    featuredContainer.appendChild(createProjectCard(project));
                });
        }

        if (allProjectsContainer) {
            allProjectsContainer.innerHTML = '';
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

        const response = await fetch('../static/scripts/CONFIG.json');
        if (!response.ok) {
            throw new Error('Could not load configuration.');
        }

        const config = await response.json();
        if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
            throw new Error('Configuration is missing Supabase credentials.');
        }

        _supabase = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

        console.log("Supabase linked to Kaeden's Profile.");
        setupForms();
    } catch (err) {
        console.error('Initialization error:', err);
        setContactStatus('Messaging is unavailable right now. Please refresh and try again.', 'error');
    }
}

/**
 * Contact form logic
 * Saves messages to the 'messages' table using the same field pattern as Hayden's form.
 */
function setupForms() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nameBox = document.getElementById('contact-name');
        const emailBox = document.getElementById('contact-email');
        const messageBox = document.getElementById('contact-message');
        const submitButton = contactForm.querySelector('button[type="submit"]');

        if (!_supabase) {
            setContactStatus('Database not ready. Please try again.', 'error');
            return;
        }

        if (!nameBox || !emailBox || !messageBox || !submitButton) {
            setContactStatus('Contact form is incomplete on this page.', 'error');
            return;
        }

        if (!nameBox.value.trim() || !emailBox.value.trim() || !messageBox.value.trim()) {
            setContactStatus('Please complete all contact fields before sending.', 'error');
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
        setContactStatus('Sending message...', 'idle');

        try {
            const { error } = await _supabase
                .from('messages')
                .insert([
                    {
                        recipient_name: 'Kaeden',
                        sender_name: nameBox.value.trim(),
                        sender_email: emailBox.value.trim(),
                        message_content: messageBox.value.trim()
                    }
                ]);

            if (error) {
                throw error;
            }

            contactForm.reset();
            setContactStatus('Message sent successfully.', 'success');
        } catch (error) {
            console.error('Error saving message:', error);
            setContactStatus('Failed to send message. Check Supabase table columns and RLS policies.', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Send Message';
        }
    });
}

function refreshProjectsOnPageShow() {
    window.addEventListener('pageshow', () => {
        loadProjects();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

refreshProjectsOnPageShow();
