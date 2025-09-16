// ===============================
// DOM Elements
// ===============================
const elements = {
  mobileMenuIcon: document.querySelector('.mobile-menu-icon'),
  mobileMenu: document.querySelector('.mobile-menu'),
  navLinks: document.querySelectorAll('.nav-links li a'),
  uploadArea: document.getElementById('uploadArea'),
  roomUpload: document.getElementById('room-upload'),
  previewContainer: document.getElementById('previewContainer'),
  imagePreview: document.getElementById('imagePreview'),
  clearBtn: document.getElementById('clearBtn'),
  generateBtn: document.getElementById('generateBtn'),
  roomPrompt: document.getElementById('roomPrompt'),
  furnitureSuggestions: document.getElementById('furnitureSuggestions'),
  contactForm: document.getElementById('contactForm'),
  // Support either id="googleSignIn" or id="googleSignInButton"
  googleSignInBtn: document.getElementById('googleSignIn') || document.getElementById('googleSignInButton'),
  signupModal: document.getElementById('signupModal'),
  closeModalBtn: document.getElementById('closeSignupModal'),
  // Profile UI
  profileWrapper: document.getElementById('profileWrapper'),
  profileCircle: document.getElementById('profileCircle'),
  profileDropdown: document.getElementById('profileDropdown'),
  profileEmail: document.getElementById('profileEmail'),
  logoutBtn: document.getElementById('logoutBtn'),
};
// app.js

document.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.getElementById("generateBtn");
  const promptInput = document.getElementById("roomPrompt");
  const resultContainer = document.getElementById("resultContainer");
  const resultImage = document.getElementById("resultImage");

  generateBtn.addEventListener("click", async () => {
    const prompt = promptInput.value.trim();

    if (!prompt) {
      alert("⚠️ Please enter a description for your dream room!");
      return;
    }

    // Show loading state
    generateBtn.textContent = "Generating...";
    generateBtn.disabled = true;

    try {
      const response = await fetch("http://localhost:5000/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate image");
      }

      const data = await response.json();

      if (data.imageUrl) {
        resultImage.src = data.imageUrl;
        resultContainer.style.display = "block";
      } else {
        alert("❌ No image returned from AI.");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      alert("❌ Something went wrong. Please try again.");
    } finally {
      generateBtn.textContent = "Generate AI Design";
      generateBtn.disabled = false;
    }
  });
});


// ===============================
// State
// ===============================
const state = {
  isLoggedIn: false,
  googleUser: null,
};

// ===============================
// Init
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadGoogleIdentityServices();
  restoreSession(); // ✅ keep user logged in after refresh
});

// ===============================
// Event Listeners
// ===============================
function setupEventListeners() {
  // Mobile menu toggle
  if (elements.mobileMenuIcon) {
    elements.mobileMenuIcon.addEventListener('click', toggleMobileMenu);
  }

  elements.navLinks.forEach(link =>
    link.addEventListener('click', closeMobileMenu)
  );

  document.addEventListener('click', (e) => {
    if (
      elements.mobileMenu &&
      !elements.mobileMenu.contains(e.target) &&
      e.target !== elements.mobileMenuIcon &&
      !elements.mobileMenuIcon.contains(e.target)
    ) {
      closeMobileMenu();
    }
  });
  

  // Upload
  if (elements.uploadArea) {
    elements.uploadArea.addEventListener('click', () => elements.roomUpload.click());
    setupDragAndDrop();
  }

  if (elements.roomUpload) {
    elements.roomUpload.addEventListener('change', handleFileUpload);
  }

  if (elements.clearBtn) {
    elements.clearBtn.addEventListener('click', clearUploadedImage);
  }

  // Generate AI button
  if (elements.generateBtn) {
    elements.generateBtn.addEventListener('click', handleGenerateClick);
  }

  // Contact form
  if (elements.contactForm) {
    elements.contactForm.addEventListener('submit', handleContactSubmit);
  }

  // Modal
  if (elements.closeModalBtn) {
    elements.closeModalBtn.addEventListener('click', closeSignupModal);
  }

  window.addEventListener('click', (e) => {
    if (e.target === elements.signupModal) {
      closeSignupModal();
    }
  });

  // Profile dropdown toggle
  if (elements.profileCircle) {
    elements.profileCircle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleProfileDropdown();
    });
  }

  // Close profile dropdown on outside click
  document.addEventListener('click', (e) => {
    if (
      elements.profileWrapper &&
      !elements.profileWrapper.contains(e.target) &&
      elements.profileDropdown &&
      elements.profileDropdown.style.display === 'block'
    ) {
      elements.profileDropdown.style.display = 'none';
    }
  });

  // Logout
  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener('click', handleLogout);
  }
}

// ===============================
// Mobile Menu
// ===============================
function toggleMobileMenu() {
  elements.mobileMenu.classList.toggle('active');
  const icon = this.querySelector('i');
  if (icon) {
    icon.classList.toggle('fa-times');
    icon.classList.toggle('fa-bars');
  }
}

function closeMobileMenu() {
  if (!elements.mobileMenu) return;
  elements.mobileMenu.classList.remove('active');
  const icon = elements.mobileMenuIcon && elements.mobileMenuIcon.querySelector('i');
  if (icon) {
    icon.classList.remove('fa-times');
    icon.classList.add('fa-bars');
  }
}

// ===============================
// Upload
// ===============================
function setupDragAndDrop() {
  elements.uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.uploadArea.classList.add('dragover');
  });

  elements.uploadArea.addEventListener('dragleave', () => {
    elements.uploadArea.classList.remove('dragover');
  });

  elements.uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.uploadArea.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      elements.roomUpload.files = e.dataTransfer.files;
      handleFileUpload();
    }
  });
}

function handleFileUpload() {
  const file = elements.roomUpload.files[0];
  if (!file) return;

  if (file.type.match('image.*')) {
    const reader = new FileReader();
    reader.onload = function (e) {
      elements.imagePreview.src = e.target.result;
      elements.uploadArea.style.display = 'none';
      elements.previewContainer.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else {
    alert('Please upload an image file.');
  }
}

function clearUploadedImage(e) {
  e && e.preventDefault();
  elements.roomUpload.value = '';
  elements.previewContainer.style.display = 'none';
  elements.uploadArea.style.display = 'block';
}

// ===============================
// AI Generate
// ===============================
function handleGenerateClick() {
  if (!state.isLoggedIn) {
    showSignupModal();
    return;
  }

  const file = elements.roomUpload.files && elements.roomUpload.files[0];
  const prompt = elements.roomPrompt && elements.roomPrompt.value;

  if (!file) return alert('Please upload a room photo!');
  if (!prompt || !prompt.trim()) return alert('Please describe your dream room!');

  showLoadingState();
  generateAIDesign(file, prompt);
}

function showLoadingState() {
  elements.generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
  elements.generateBtn.disabled = true;
}

function generateAIDesign(file, prompt) {
  // Mock demo
  setTimeout(() => {
    resetGenerateButton();
    alert('🎉 Your AI design is ready!');
  }, 2000);
}

function resetGenerateButton() {
  elements.generateBtn.innerHTML = 'Generate AI Design';
  elements.generateBtn.disabled = false;
}

// ===============================
// Contact
// ===============================
function handleContactSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('name')?.value || '';
  const email = document.getElementById('email')?.value || '';
  const subject = document.getElementById('subject')?.value || '';
  const message = document.getElementById('message')?.value || '';
  console.log({ name, email, subject, message });
  alert('Thanks! We will get back to you soon.');
  e.target.reset();
}

// ===============================
// Modal
// ===============================
function showSignupModal() {
  if (elements.signupModal) elements.signupModal.style.display = 'flex';
}

function closeSignupModal() {
  if (elements.signupModal) elements.signupModal.style.display = 'none';
}

// ===============================
// Google Sign-in Loader
// ===============================
function loadGoogleIdentityServices() {
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);

  // Optional: render button if you want to programmatically create it
  script.onload = () => {
    if (window.google && elements.googleSignInBtn) {
      // If you are NOT using <div id="g_id_onload" data-callback="handleGoogleSignIn">,
      // you can uncomment the two lines below and set your CLIENT_ID
      // google.accounts.id.initialize({ client_id: "YOUR_CLIENT_ID", callback: handleGoogleSignIn });
      // google.accounts.id.renderButton(elements.googleSignInBtn, { theme: "outline", size: "large" });
    }
  };
}

// ===============================
// Google callback (MUST be global)
// Hooked via: data-callback="handleGoogleSignIn" on #g_id_onload
// ===============================
window.handleGoogleSignIn = function (response) {
  const payload = parseJwt(response.credential);

  // Save locally
  const user = {
    id: payload.sub,
    name: payload.name || '',
    email: payload.email || '',
    picture: payload.picture || '',
  };

  // Persist + update UI
  localStorage.setItem('user', JSON.stringify(user));
  state.googleUser = user;
  state.isLoggedIn = true;

  applyLoggedInUI(user);
};

// ===============================
// Restore session on refresh
// ===============================
function restoreSession() {
  const raw = localStorage.getItem('user');
  if (!raw) return;
  try {
    const user = JSON.parse(raw);
    if (user && user.email) {
      state.googleUser = user;
      state.isLoggedIn = true;
      applyLoggedInUI(user);
    }
  } catch (e) {
    // bad JSON, clear it
    localStorage.removeItem('user');
  }
}

// ===============================
// Apply logged-in UI
// ===============================
function applyLoggedInUI(user) {
  // Hide signup modal & Google button
  closeSignupModal();
  if (elements.googleSignInBtn) {
    elements.googleSignInBtn.style.display = 'none';
  }

  // Show profile in navbar
  if (elements.profileWrapper) {
    elements.profileWrapper.style.display = 'flex';
  }
  if (elements.profileCircle) {
    const initial = (user.name && user.name[0]) || (user.email && user.email[0]) || 'U';
    elements.profileCircle.textContent = initial.toUpperCase();
  }
  if (elements.profileEmail) {
    elements.profileEmail.textContent = user.email || '';
  }
}

// ===============================
// Logout
// ===============================
function handleLogout() {
  // Clear storage & state
  localStorage.removeItem('user');
  state.googleUser = null;
  state.isLoggedIn = false;

  // Hide profile + dropdown
  if (elements.profileDropdown) elements.profileDropdown.style.display = 'none';
  if (elements.profileWrapper) elements.profileWrapper.style.display = 'none';

  // Show Google sign-in button again (inside modal or page)
  if (elements.googleSignInBtn) {
    elements.googleSignInBtn.style.display = 'block';
  }

  // Optionally show modal to prompt sign-in again
  showSignupModal();
}

// ===============================
// Profile Dropdown
// ===============================
function toggleProfileDropdown() {
  if (!elements.profileDropdown) return;
  elements.profileDropdown.style.display =
    elements.profileDropdown.style.display === 'block' ? 'none' : 'block';
}

// ===============================
// JWT helper
// ===============================
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return {};
  }
}
document.getElementById("generateBtn").addEventListener("click", async () => {
  const prompt = document.getElementById("roomPrompt").value.trim();
  if (!prompt) {
    alert("Please describe your dream room first!");
    return;
  }

  const resultContainer = document.getElementById("resultContainer");
  const resultImage = document.getElementById("resultImage");
  resultContainer.style.display = "block";
  resultImage.src = "";
  resultContainer.querySelector("h3").innerText = "Generating...";

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();

    // Show generated image
    resultImage.src = data.imageUrl;
    resultContainer.querySelector("h3").innerText = "Your AI Design:";
  } catch (err) {
    console.error(err);
    resultContainer.querySelector("h3").innerText = "Error generating image.";
  }
});
async function generateImage() {
  const prompt = document.getElementById("prompt").value;

  const response = await fetch("http://localhost:5000/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  const data = await response.json();
  document.getElementById("result").src = data.imageUrl;
}
document.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.getElementById("generateBtn");
  const promptInput = document.getElementById("roomPrompt");
  const resultImage = document.getElementById("resultImage");
  const resultContainer = document.getElementById("resultContainer");

  

  generateBtn.addEventListener("click", async () => {
    const prompt = promptInput.value.trim();

    if (!prompt) {
      alert("⚠️ Please enter a description for your dream room!");
      return;
    }

    generateBtn.textContent = "Generating...";
    generateBtn.disabled = true;

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (data.imageUrl) {
        resultImage.src = data.imageUrl;
        resultContainer.style.display = "block";
      } else {
        alert("❌ No image returned from AI.");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      alert("❌ Something went wrong. Please try again.");
    } finally {
      generateBtn.textContent = "Generate AI Design";
      generateBtn.disabled = false;
    }
  });
});
// =========================
// STYLE SELECTION LOGIC
// =========================
const templates = document.querySelectorAll(".template");
let selectedStyle = null;

templates.forEach(template => {
  template.addEventListener("click", () => {
    const style = template.getAttribute("data-style");

    // Remove selection from all
    templates.forEach(t => {
      t.classList.remove("selected");
      const nameEl = t.querySelector(".style-name");
      if (nameEl) nameEl.textContent = "";
    });

    // Apply selection to clicked one
    template.classList.add("selected");
    const nameEl = template.querySelector(".style-name");
    if (nameEl) nameEl.textContent = style;

    selectedStyle = style;

    console.log("Selected style:", selectedStyle);
  });
});

// =========================
// CONTACT FORM + EMAILJS
// =========================
 function sendMail(event) {
  // stop form from refreshing page
  event.preventDefault();

  // collect values from form
  const params = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    subject: document.getElementById("subject").value,
    message: document.getElementById("message").value,
  };

  // ✅ replace with your actual EmailJS values
  const serviceID = "service_16vdc3s";     // e.g. service_ab12cde
  const templateID = "template_pajzlda";   // e.g. template_xy34z

  // send email
  emailjs.send(serviceID, templateID, params)
    .then(res => {
      console.log("✅ Email sent:", res);
      alert("Message sent successfully!");
      document.getElementById("contactForm").reset();
    })
    .catch(err => {
      console.error("❌ Email failed:", err);
      alert("Message failed to send. Try again later.");
    });
}
// Add this to your existing JavaScript code

// Add style names to your templates (update with your actual style names)
const styleNames = [
    "Modern Minimalist",
    "Cozy Bohemian", 
    "Industrial Chic",
    "Scandinavian",
    "Coastal Retreat"
];

// Apply style names to your template elements
document.querySelectorAll('.template').forEach((template, index) => {
    if (index < styleNames.length) {
        template.setAttribute('data-style', styleNames[index]);
        template.querySelector('.style-name').textContent = styleNames[index];
    }
});

// Add click event listeners to templates
document.querySelectorAll('.template').forEach(template => {
    template.addEventListener('click', () => {
        const styleName = template.getAttribute('data-style');
        const roomPrompt = document.getElementById('roomPrompt');
        
        // Set the message about the selected style
        roomPrompt.value = `You selected the ${styleName} style for your room`;
        
        // Move focus to the prompt textarea and place cursor at the end
        roomPrompt.focus();
        roomPrompt.setSelectionRange(roomPrompt.value.length, roomPrompt.value.length);
        
        // Optional: Add visual feedback for selected template
        document.querySelectorAll('.template').forEach(t => {
            t.style.border = '2px solid transparent';
            t.style.transform = 'scale(1)';
            t.style.transition = 'all 0.3s ease';
        });
        
        template.style.border = '2px solid #4e54c8';
        template.style.transform = 'scale(1.03)';
        
        // You can also store the selected style for later use
        localStorage.setItem('selectedStyle', styleName);
        
        // Optional: Show a brief confirmation message
        const confirmation = document.createElement('div');
        confirmation.textContent = `✓ ${styleName} style selected`;
        confirmation.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #4e54c8;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            font-size: 14px;
        `;
        document.body.appendChild(confirmation);
        
        // Remove confirmation after 2 seconds
        setTimeout(() => {
            document.body.removeChild(confirmation);
        }, 2000);
        
        // Optional: Scroll to the prompt area if it's not visible
        roomPrompt.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
});