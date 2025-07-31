/**
 * BACKEND API TO FRONTEND INTEGRATION SUPERSET
 * 
 * This file contains ALL backend APIs organized for easy frontend integration
 * Based on the actual database schema and existing backend routes
 * 
 * Server Base URL: http://localhost:3000
 * Database Schema: Event Management Platform - Complete Data Model
 */

// ===================================================================
// CONFIGURATION & UTILITIES
// ===================================================================

export const BACKEND_CONFIG = {
  BASE_URL: 'http://localhost:3000',
  API_PREFIX: '/api',
  AUTH_PREFIX: '/api/auth',
  TIMEOUT: 15000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

export const API_RESPONSE_FORMATS = {
  SUCCESS: {
    status: 'success',
    data: {},
    message: 'string'
  },
  ERROR: {
    status: 'error', 
    message: 'string',
    errors: []
  },
  PAGINATED: {
    status: 'success',
    results: 'number',
    totalPages: 'number',
    currentPage: 'number',
    data: []
  }
};

// ===================================================================
// 1. AUTHENTICATION & USER MANAGEMENT APIS
// ===================================================================

export const AUTH_APIS = {
  
  // Legacy Auth Routes (routes/user.js, routes/logout.js)
  LEGACY: {
    BASE_PATH: '/api/auth',
    ENDPOINTS: {
      
      REGISTER: {
        method: 'POST',
        path: '/api/auth/register',
        description: 'Register new user',
        body: {
          username: 'string',
          email: 'string',
          password: 'string'
        },
        response: {
          success: 'boolean',
          token: 'string',
          user: {
            id: 'string',
            username: 'string',
            email: 'string',
            avatar: 'string'
          }
        },
        frontend_usage: `
          const registerUser = async (userData) => {
            const response = await fetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(userData)
            });
            return response.json();
          };
        `
      },

      LOGIN: {
        method: 'POST',
        path: '/api/auth/login',
        description: 'Login existing user',
        body: {
          email: 'string',
          password: 'string'
        },
        response: {
          success: 'boolean',
          msg: 'string',
          token: 'string',
          user: {
            id: 'string',
            username: 'string',
            email: 'string'
          }
        },
        frontend_usage: `
          const loginUser = async (credentials) => {
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(credentials)
            });
            const data = await response.json();
            if (data.success) {
              localStorage.setItem('authToken', data.token);
              localStorage.setItem('user', JSON.stringify(data.user));
            }
            return data;
          };
        `
      },

      GET_USER_PROFILE: {
        method: 'GET',
        path: '/api/auth/',
        description: 'Get current user profile',
        requires_auth: true,
        headers: {
          'Authorization': 'Bearer <token>'
        },
        response: {
          success: 'boolean',
          user: {
            id: 'string',
            username: 'string',
            email: 'string',
            avatar: 'string'
          }
        },
        frontend_usage: `
          const getUserProfile = async () => {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/auth/', {
              headers: { 'Authorization': token }
            });
            return response.json();
          };
        `
      },

      LOGOUT: {
        method: 'POST',
        path: '/api/auth/logout',
        description: 'Logout user and blacklist token',
        requires_auth: true,
        headers: {
          'Authorization': 'Bearer <token>'
        },
        response: {
          success: 'boolean',
          msg: 'string'
        },
        frontend_usage: `
          const logoutUser = async () => {
            const token = localStorage.getItem('authToken');
            await fetch('/api/auth/logout', {
              method: 'POST',
              headers: { 'Authorization': \`Bearer \${token}\` }
            });
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
          };
        `
      },

      UPLOAD_IMAGE_S3: {
        method: 'POST',
        path: '/api/auth/upload',
        description: 'Upload image to S3 for face recognition',
        content_type: 'multipart/form-data',
        body: {
          image: 'File',
          fullname: 'string'
        },
        response: {
          success: 'boolean',
          fileUrl: 'string'
        },
        frontend_usage: `
          const uploadImage = async (imageFile, fullName) => {
            const formData = new FormData();
            formData.append('image', imageFile);
            formData.append('fullname', fullName);
            
            const response = await fetch('/api/auth/upload', {
              method: 'POST',
              body: formData
            });
            return response.json();
          };
        `
      }
    }
  },

  // Modern Auth Routes (features/auth/auth.routes.js)
  MODERN: {
    BASE_PATH: '/api/auth',
    ENDPOINTS: {
      REFRESH_TOKEN: {
        method: 'POST',
        path: '/api/auth/refresh',
        description: 'Refresh authentication token'
      },
      VERIFY_EMAIL: {
        method: 'POST',
        path: '/api/auth/verify-email',
        description: 'Verify user email address'
      },
      RESET_PASSWORD: {
        method: 'POST',
        path: '/api/auth/reset-password',
        description: 'Reset user password'
      },
      FORGOT_PASSWORD: {
        method: 'POST',
        path: '/api/auth/forgot-password',
        description: 'Request password reset'
      }
    }
  }
};

// ===================================================================
// 2. EVENTS MANAGEMENT APIS
// ===================================================================

export const EVENTS_APIS = {
  BASE_PATH: '/api/events',
  SCHEMA_REFERENCE: {
    eventId: 'string (pk)',
    name: 'string',
    description: 'string',
    location: 'string',
    date: 'date',
    startTime: 'string',
    endTime: 'string',
    totalTickets: 'number',
    ticketsSold: 'number (computed)',
    ticketPrice: 'number',
    status: 'draft|active|cancelled|completed',
    organiserId: 'string',
    coverImage: 'string'
  },
  ENDPOINTS: {

    GET_ALL_EVENTS: {
      method: 'GET',
      path: '/api/events',
      description: 'Get all events',
      requires_auth: true,
      response: {
        status: 'success',
        data: {
          events: 'array'
        }
      },
      frontend_usage: `
        const getAllEvents = async () => {
          const token = localStorage.getItem('authToken');
          const response = await fetch('/api/events', {
            headers: { 'Authorization': \`Bearer \${token}\` }
          });
          return response.json();
        };
      `
    },

    GET_EVENT_BY_ID: {
      method: 'GET',
      path: '/api/events/:id',
      description: 'Get specific event by ID',
      requires_auth: true,
      params: { id: 'string' },
      frontend_usage: `
        const getEventById = async (eventId) => {
          const token = localStorage.getItem('authToken');
          const response = await fetch(\`/api/events/\${eventId}\`, {
            headers: { 'Authorization': \`Bearer \${token}\` }
          });
          return response.json();
        };
      `
    },

    CREATE_EVENT: {
      method: 'POST',
      path: '/api/events',
      description: 'Create new event',
      requires_auth: true,
      requires_role: ['admin', 'organizer'],
      body: {
        name: 'string',
        description: 'string',
        location: 'string',
        date: 'date',
        startTime: 'string',
        endTime: 'string',
        totalTickets: 'number',
        ticketPrice: 'number',
        organiserId: 'string',
        coverImage: 'string'
      },
      frontend_usage: `
        const createEvent = async (eventData) => {
          const token = localStorage.getItem('authToken');
          const response = await fetch('/api/events', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': \`Bearer \${token}\`
            },
            body: JSON.stringify(eventData)
          });
          return response.json();
        };
      `
    },

    UPDATE_EVENT: {
      method: 'PATCH',
      path: '/api/events/:id',
      description: 'Update existing event',
      requires_auth: true,
      requires_role: ['admin', 'organizer'],
      params: { id: 'string' }
    },

    DELETE_EVENT: {
      method: 'DELETE',
      path: '/api/events/:id',
      description: 'Delete event',
      requires_auth: true,
      requires_role: ['admin'],
      params: { id: 'string' }
    },

    GET_EVENT_STATS: {
      method: 'GET',
      path: '/api/events/stats',
      description: 'Get event statistics',
      public: true,
      response: {
        status: 'success',
        data: {
          totalEvents: 'number',
          activeEvents: 'number',
          completedEvents: 'number',
          totalRevenue: 'number'
        }
      }
    }
  }
};

// ===================================================================
// 3. USER EVENT REGISTRATIONS APIS
// ===================================================================

export const REGISTRATIONS_APIS = {
  BASE_PATH: '/api/registrations',
  SCHEMA_REFERENCE: {
    registrationId: 'string (pk)',
    eventId: 'string',
    userId: 'string',
    registrationDate: 'date',
    status: 'pending|verified|rejected',
    checkInTime: 'date (nullable)',
    waitingStatus: 'queued|processing|complete',
    faceVerificationStatus: 'pending|success|failed',
    ticketAvailabilityStatus: 'pending|available|unavailable',
    verificationAttempts: 'number (default:0)',
    lastVerificationAttempt: 'date (nullable)',
    ticketIssued: 'boolean (default:false)',
    ticketIssuedDate: 'date (nullable)',
    adminBooked: 'boolean (default:false)',
    adminOverrideReason: 'string (nullable)'
  },
  ENDPOINTS: {

    GET_ALL_REGISTRATIONS: {
      method: 'GET',
      path: '/api/registrations',
      description: 'Get all user event registrations',
      response: {
        status: 'success',
        results: 'number',
        data: {
          registrations: 'array'
        }
      },
      frontend_usage: `
        const getAllRegistrations = async () => {
          const response = await fetch('/api/registrations');
          return response.json();
        };
      `
    },

    CREATE_REGISTRATION: {
      method: 'POST',
      path: '/api/registrations',
      description: 'Create new event registration',
      body: {
        userId: 'string',
        eventId: 'string',
        adminBooked: 'boolean',
        adminOverrideReason: 'string'
      },
      response: {
        status: 'success',
        message: 'Registration created successfully',
        data: {
          registration: 'object'
        }
      },
      frontend_usage: `
        const createRegistration = async (registrationData) => {
          const response = await fetch('/api/registrations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registrationData)
          });
          return response.json();
        };
      `
    },

    GET_REGISTRATION_BY_ID: {
      method: 'GET',
      path: '/api/registrations/:id',
      description: 'Get specific registration',
      params: { id: 'string' }
    },

    UPDATE_REGISTRATION: {
      method: 'PUT',
      path: '/api/registrations/:id',
      description: 'Update registration',
      params: { id: 'string' },
      body: {
        status: 'string',
        waitingStatus: 'string'
      }
    },

    DELETE_REGISTRATION: {
      method: 'DELETE',
      path: '/api/registrations/:id',
      description: 'Delete registration',
      params: { id: 'string' }
    },

    CHECK_IN_USER: {
      method: 'PUT',
      path: '/api/registrations/:id/checkin',
      description: 'Check in user for event',
      params: { id: 'string' },
      response: {
        status: 'success',
        message: 'User checked in successfully',
        data: {
          registration: 'object'
        }
      },
      frontend_usage: `
        const checkInUser = async (registrationId) => {
          const response = await fetch(\`/api/registrations/\${registrationId}/checkin\`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
          });
          return response.json();
        };
      `
    },

    START_FACE_VERIFICATION: {
      method: 'PUT',
      path: '/api/registrations/:id/face-verification/start',
      description: 'Start face verification process',
      params: { id: 'string' },
      body: {
        faceVerificationId: 'string'
      },
      frontend_usage: `
        const startFaceVerification = async (registrationId, faceVerificationId) => {
          const response = await fetch(\`/api/registrations/\${registrationId}/face-verification/start\`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ faceVerificationId })
          });
          return response.json();
        };
      `
    },

    COMPLETE_FACE_VERIFICATION: {
      method: 'PUT',
      path: '/api/registrations/:id/face-verification/complete',
      description: 'Complete face verification',
      params: { id: 'string' },
      body: {
        success: 'boolean',
        ticketAvailable: 'boolean'
      },
      frontend_usage: `
        const completeFaceVerification = async (registrationId, success, ticketAvailable) => {
          const response = await fetch(\`/api/registrations/\${registrationId}/face-verification/complete\`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success, ticketAvailable })
          });
          return response.json();
        };
      `
    },

    ISSUE_TICKET: {
      method: 'PUT',
      path: '/api/registrations/:id/issue-ticket',
      description: 'Issue ticket to user',
      params: { id: 'string' },
      response: {
        status: 'success',
        message: 'Ticket issued successfully',
        data: {
          registration: 'object'
        }
      }
    },

    ADMIN_OVERRIDE: {
      method: 'PUT',
      path: '/api/registrations/:id/admin-override',
      description: 'Admin override for registration',
      params: { id: 'string' },
      body: {
        overrideReason: 'string',
        issueTicket: 'boolean'
      },
      frontend_usage: `
        const adminOverride = async (registrationId, overrideReason, issueTicket) => {
          const response = await fetch(\`/api/registrations/\${registrationId}/admin-override\`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ overrideReason, issueTicket })
          });
          return response.json();
        };
      `
    },

    GET_REGISTRATIONS_BY_STATUS: {
      method: 'GET',
      path: '/api/registrations/status/:status',
      description: 'Get registrations by status',
      params: { status: 'pending|verified|rejected' },
      frontend_usage: `
        const getRegistrationsByStatus = async (status) => {
          const response = await fetch(\`/api/registrations/status/\${status}\`);
          return response.json();
        };
      `
    },

    GET_REGISTRATION_STATS: {
      method: 'GET',
      path: '/api/registrations/stats',
      description: 'Get registration statistics',
      response: {
        status: 'success',
        data: {
          statusStats: 'array',
          faceVerificationStats: 'array',
          ticketStats: 'object'
        }
      }
    },

    GET_REGISTRATIONS_BY_EVENT: {
      method: 'GET',
      path: '/api/registrations/event/:eventId',
      description: 'Get all registrations for an event',
      params: { eventId: 'string' }
    },

    GET_REGISTRATIONS_BY_USER: {
      method: 'GET',
      path: '/api/registrations/user/:userId',
      description: 'Get all registrations for a user',
      params: { userId: 'string' }
    }
  }
};

// ===================================================================
// 4. TICKETS MANAGEMENT APIS
// ===================================================================

export const TICKETS_APIS = {
  BASE_PATH: '/api/tickets',
  SCHEMA_REFERENCE: {
    ticketId: 'string (pk)',
    userId: 'string',
    eventId: 'string',
    registrationId: 'string',
    seatNumber: 'string',
    price: 'number',
    purchaseDate: 'date',
    checkInTime: 'date (nullable)',
    status: 'active|used|refunded|void',
    faceVerified: 'boolean',
    bookedByAdminUserId: 'string (nullable)'
  },
  ENDPOINTS: {

    GET_ALL_TICKETS: {
      method: 'GET',
      path: '/api/tickets',
      description: 'Get all tickets',
      requires_auth: true
    },

    GET_TICKET_BY_ID: {
      method: 'GET',
      path: '/api/tickets/:id',
      description: 'Get specific ticket',
      requires_auth: true,
      params: { id: 'string' }
    },

    CREATE_TICKET: {
      method: 'POST',
      path: '/api/tickets',
      description: 'Create new ticket',
      requires_auth: true,
      body: {
        userId: 'string',
        eventId: 'string',
        registrationId: 'string',
        seatNumber: 'string',
        price: 'number'
      }
    },

    UPDATE_TICKET: {
      method: 'PATCH',
      path: '/api/tickets/:id',
      description: 'Update ticket',
      requires_auth: true,
      params: { id: 'string' }
    },

    VERIFY_TICKET: {
      method: 'POST',
      path: '/api/tickets/verify',
      description: 'Verify ticket validity',
      requires_auth: true,
      body: {
        ticketId: 'string',
        eventId: 'string'
      },
      frontend_usage: `
        const verifyTicket = async (ticketId, eventId) => {
          const token = localStorage.getItem('authToken');
          const response = await fetch('/api/tickets/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': \`Bearer \${token}\`
            },
            body: JSON.stringify({ ticketId, eventId })
          });
          return response.json();
        };
      `
    }
  }
};

// ===================================================================
// 5. ORGANIZERS MANAGEMENT APIS
// ===================================================================

export const ORGANIZERS_APIS = {
  BASE_PATH: '/api/organizers',
  SCHEMA_REFERENCE: {
    organiserId: 'string (pk)',
    name: 'string',
    email: 'string (unique)',
    phone: 'string',
    address: 'string',
    website: 'string (nullable)',
    description: 'string',
    contactPerson: 'string',
    status: 'active|inactive',
    joinDate: 'date',
    totalRevenue: 'number (default:0)',
    totalEvents: 'number (default:0)',
    activeEvents: 'number (default:0)'
  },
  ENDPOINTS: {

    GET_ALL_ORGANIZERS: {
      method: 'GET',
      path: '/api/organizers',
      description: 'Get all organizers',
      requires_auth: true,
      frontend_usage: `
        const getAllOrganizers = async () => {
          const token = localStorage.getItem('authToken');
          const response = await fetch('/api/organizers', {
            headers: { 'Authorization': \`Bearer \${token}\` }
          });
          return response.json();
        };
      `
    },

    GET_ORGANIZER_BY_ID: {
      method: 'GET',
      path: '/api/organizers/:id',
      description: 'Get specific organizer',
      requires_auth: true,
      params: { id: 'string' }
    },

    CREATE_ORGANIZER: {
      method: 'POST',
      path: '/api/organizers',
      description: 'Create new organizer',
      requires_auth: true,
      body: {
        name: 'string',
        email: 'string',
        phone: 'string',
        address: 'string',
        website: 'string',
        description: 'string',
        contactPerson: 'string'
      }
    },

    UPDATE_ORGANIZER: {
      method: 'PATCH',
      path: '/api/organizers/:id',
      description: 'Update organizer',
      requires_auth: true,
      params: { id: 'string' }
    },

    DELETE_ORGANIZER: {
      method: 'DELETE',
      path: '/api/organizers/:id',
      description: 'Delete organizer',
      requires_auth: true,
      params: { id: 'string' }
    }
  }
};

// ===================================================================
// 6. FEEDBACK MANAGEMENT APIS
// ===================================================================

export const FEEDBACK_APIS = {
  BASE_PATH: '/api/feedback',
  SCHEMA_REFERENCE: {
    feedbackId: 'string (pk)',
    userId: 'string',
    eventId: 'string',
    feedbackEntries: 'array',
    createdAt: 'date',
    updatedAt: 'date'
  },
  ENDPOINTS: {

    GET_ALL_FEEDBACK: {
      method: 'GET',
      path: '/api/feedback',
      description: 'Get all feedback',
      requires_auth: true
    },

    GET_FEEDBACK_BY_ID: {
      method: 'GET',
      path: '/api/feedback/:id',
      description: 'Get specific feedback',
      requires_auth: true,
      params: { id: 'string' }
    },

    CREATE_FEEDBACK: {
      method: 'POST',
      path: '/api/feedback',
      description: 'Create new feedback',
      requires_auth: true,
      body: {
        userId: 'string',
        eventId: 'string',
        feedbackEntries: [{
          rating: 'number (1-5)',
          category: 'event|logistics|organizer|other',
          subject: 'string',
          message: 'string'
        }]
      },
      frontend_usage: `
        const createFeedback = async (feedbackData) => {
          const token = localStorage.getItem('authToken');
          const response = await fetch('/api/feedback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': \`Bearer \${token}\`
            },
            body: JSON.stringify(feedbackData)
          });
          return response.json();
        };
      `
    },

    UPDATE_FEEDBACK: {
      method: 'PATCH',
      path: '/api/feedback/:id',
      description: 'Update feedback',
      requires_auth: true,
      params: { id: 'string' }
    },

    DELETE_FEEDBACK: {
      method: 'DELETE',
      path: '/api/feedback/:id',
      description: 'Delete feedback',
      requires_auth: true,
      params: { id: 'string' }
    }
  }
};

// ===================================================================
// 7. ADMIN MANAGEMENT APIS
// ===================================================================

export const ADMIN_APIS = {
  BASE_PATH: '/api/admin',
  SCHEMA_REFERENCE: {
    userId: 'string (pk)',
    email: 'string (unique)',
    password: 'string',
    role: 'superadmin|eventadmin|support',
    permissions: 'string[]',
    status: 'active|inactive',
    statusReason: 'string',
    lastActivity: 'date',
    lastLogin: 'date',
    activityLog: 'array'
  },
  ENDPOINTS: {

    CREATE_EMPLOYEE: {
      method: 'POST',
      path: '/api/admin/employees',
      description: 'Create new employee/admin',
      requires_auth: true,
      requires_role: ['admin'],
      body: {
        email: 'string',
        password: 'string',
        role: 'superadmin|eventadmin|support',
        permissions: 'array'
      },
      frontend_usage: `
        const createEmployee = async (employeeData) => {
          const token = localStorage.getItem('authToken');
          const response = await fetch('/api/admin/employees', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': \`Bearer \${token}\`
            },
            body: JSON.stringify(employeeData)
          });
          return response.json();
        };
      `
    },

    DELETE_EMPLOYEE: {
      method: 'DELETE',
      path: '/api/admin/employees/:id',
      description: 'Delete employee/admin',
      requires_auth: true,
      requires_role: ['admin'],
      params: { id: 'string' }
    },

    UPDATE_EMPLOYEE_PERMISSIONS: {
      method: 'PATCH',
      path: '/api/admin/employees/permissions',
      description: 'Update employee permissions',
      requires_auth: true,
      requires_role: ['admin'],
      body: {
        employeeId: 'string',
        permissions: 'array'
      }
    },

    GET_ACTIVITY_LOG: {
      method: 'GET',
      path: '/api/admin/activity',
      description: 'Get admin activity log',
      requires_auth: true,
      requires_role: ['admin'],
      response: {
        status: 'success',
        data: {
          activityLog: 'array'
        }
      }
    }
  }
};

// ===================================================================
// 8. FACE RECOGNITION APIS
// ===================================================================

export const FACE_RECOGNITION_APIS = {
  BASE_PATH: '/api/face-images',
  SCHEMA_REFERENCE: {
    rekognitionId: 'string (pk)',
    fullName: 'string',
    imageUrl: 'string',
    encodingData: 'string',
    confidence: 'number',
    createdAt: 'date',
    updatedAt: 'date'
  },
  ENDPOINTS: {

    GET_ALL_FACE_IMAGES: {
      method: 'GET',
      path: '/api/face-images',
      description: 'Get all face images',
      requires_auth: true
    },

    GET_FACE_IMAGE_BY_ID: {
      method: 'GET',
      path: '/api/face-images/:rekognitionId',
      description: 'Get face image by rekognition ID',
      requires_auth: true,
      params: { rekognitionId: 'string' }
    },

    GET_FACE_IMAGE_BY_NAME: {
      method: 'GET',
      path: '/api/face-images/name/:fullName',
      description: 'Get face image by full name',
      requires_auth: true,
      params: { fullName: 'string' }
    },

    CREATE_FACE_IMAGE: {
      method: 'POST',
      path: '/api/face-images',
      description: 'Create new face image record',
      requires_auth: true,
      body: {
        rekognitionId: 'string',
        fullName: 'string',
        imageUrl: 'string',
        encodingData: 'string',
        confidence: 'number'
      }
    },

    UPDATE_FACE_IMAGE: {
      method: 'PATCH',
      path: '/api/face-images/:rekognitionId',
      description: 'Update face image record',
      requires_auth: true,
      params: { rekognitionId: 'string' }
    },

    DELETE_FACE_IMAGE: {
      method: 'DELETE',
      path: '/api/face-images/:rekognitionId',
      description: 'Delete face image record',
      requires_auth: true,
      params: { rekognitionId: 'string' }
    }
  }
};

// ===================================================================
// 9. USERS MANAGEMENT APIS
// ===================================================================

export const USERS_APIS = {
  BASE_PATH: '/api/users',
  SCHEMA_REFERENCE: {
    userId: 'string (pk)',
    FullName: 'string',
    email: 'string (unique)',
    password: 'string',
    phone: 'string',
    faceId: 'string',
    verificationStatus: 'pending|verified|rejected',
    status: 'active|inactive|banned',
    createdAt: 'date',
    updatedAt: 'date'
  },
  ENDPOINTS: {

    GET_ALL_USERS: {
      method: 'GET',
      path: '/api/users',
      description: 'Get all users',
      requires_auth: true,
      frontend_usage: `
        const getAllUsers = async () => {
          const token = localStorage.getItem('authToken');
          const response = await fetch('/api/users', {
            headers: { 'Authorization': \`Bearer \${token}\` }
          });
          return response.json();
        };
      `
    },

    GET_USER_BY_ID: {
      method: 'GET',
      path: '/api/users/:id',
      description: 'Get specific user',
      requires_auth: true,
      params: { id: 'string' }
    },

    CREATE_USER: {
      method: 'POST',
      path: '/api/users',
      description: 'Create new user',
      requires_auth: true,
      body: {
        FullName: 'string',
        email: 'string',
        password: 'string',
        phone: 'string',
        faceId: 'string'
      }
    },

    UPDATE_USER: {
      method: 'PATCH',
      path: '/api/users/:id',
      description: 'Update user',
      requires_auth: true,
      params: { id: 'string' }
    },

    DELETE_USER: {
      method: 'DELETE',
      path: '/api/users/:id',
      description: 'Delete user',
      requires_auth: true,
      params: { id: 'string' }
    },

    GET_USER_BY_FACE_ID: {
      method: 'GET',
      path: '/api/users/face/:faceId',
      description: 'Get user by face ID',
      requires_auth: true,
      params: { faceId: 'string' }
    },

    VERIFY_USER: {
      method: 'PATCH',
      path: '/api/users/:id/verify',
      description: 'Verify user',
      requires_auth: true,
      params: { id: 'string' }
    },

    SEARCH_USERS: {
      method: 'GET',
      path: '/api/users/search',
      description: 'Search users',
      requires_auth: true,
      query: {
        q: 'string',
        limit: 'number',
        offset: 'number'
      }
    }
  }
};

// ===================================================================
// 10. COMPREHENSIVE API INTEGRATION HELPER
// ===================================================================

export const API_INTEGRATION_HELPER = {

  // Generic API caller with authentication
  apiCall: async (method, path, data = null, options = {}) => {
    const url = `${BACKEND_CONFIG.BASE_URL}${path}`;
    const config = {
      method,
      headers: {
        ...BACKEND_CONFIG.HEADERS,
        ...options.headers
      }
    };

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add body for non-GET requests
    if (data && method !== 'GET') {
      if (data instanceof FormData) {
        delete config.headers['Content-Type']; // Let browser set it
        config.body = data;
      } else {
        config.body = JSON.stringify(data);
      }
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  },

  // Convenience methods
  get: (path, options = {}) => API_INTEGRATION_HELPER.apiCall('GET', path, null, options),
  post: (path, data, options = {}) => API_INTEGRATION_HELPER.apiCall('POST', path, data, options),
  put: (path, data, options = {}) => API_INTEGRATION_HELPER.apiCall('PUT', path, data, options),
  patch: (path, data, options = {}) => API_INTEGRATION_HELPER.apiCall('PATCH', path, data, options),
  delete: (path, options = {}) => API_INTEGRATION_HELPER.apiCall('DELETE', path, null, options),

  // Authentication helpers
  login: async (credentials) => {
    const response = await API_INTEGRATION_HELPER.post('/api/auth/login', credentials);
    if (response.success && response.token) {
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    return response;
  },

  logout: async () => {
    try {
      await API_INTEGRATION_HELPER.post('/api/auth/logout');
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

// ===================================================================
// 11. REACT INTEGRATION EXAMPLES
// ===================================================================

export const REACT_INTEGRATION_EXAMPLES = `
// Custom hook for API calls
import { useState, useEffect } from 'react';
import { API_INTEGRATION_HELPER } from './backend_api_to_frontend.js';

export const useApi = (endpoint, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await API_INTEGRATION_HELPER.get(endpoint);
        setData(response);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  return { data, loading, error };
};

// Hook for registrations management
export const useRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);

  const createRegistration = async (data) => {
    const response = await API_INTEGRATION_HELPER.post('/api/registrations', data);
    if (response.status === 'success') {
      setRegistrations(prev => [...prev, response.data.registration]);
    }
    return response;
  };

  const checkInUser = async (registrationId) => {
    const response = await API_INTEGRATION_HELPER.put(\`/api/registrations/\${registrationId}/checkin\`);
    if (response.status === 'success') {
      setRegistrations(prev => 
        prev.map(reg => 
          reg._id === registrationId 
            ? { ...reg, status: 'verified', checkInTime: new Date() }
            : reg
        )
      );
    }
    return response;
  };

  const startFaceVerification = async (registrationId, faceVerificationId) => {
    return await API_INTEGRATION_HELPER.put(
      \`/api/registrations/\${registrationId}/face-verification/start\`,
      { faceVerificationId }
    );
  };

  return {
    registrations,
    setRegistrations,
    createRegistration,
    checkInUser,
    startFaceVerification
  };
};

// Hook for events management
export const useEvents = () => {
  const { data: events, loading, error } = useApi('/api/events');

  const createEvent = async (eventData) => {
    return await API_INTEGRATION_HELPER.post('/api/events', eventData);
  };

  const updateEvent = async (eventId, updateData) => {
    return await API_INTEGRATION_HELPER.patch(\`/api/events/\${eventId}\`, updateData);
  };

  return {
    events: events?.data?.events || [],
    loading,
    error,
    createEvent,
    updateEvent
  };
};

// Usage in components:
const EventsList = () => {
  const { events, loading, error } = useEvents();
  
  if (loading) return <div>Loading events...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {events.map(event => (
        <div key={event.eventId}>
          <h3>{event.name}</h3>
          <p>{event.description}</p>
          <p>Date: {event.date}</p>
          <p>Location: {event.location}</p>
        </div>
      ))}
    </div>
  );
};

const RegistrationManager = () => {
  const { createRegistration, checkInUser } = useRegistrations();
  
  const handleCreateRegistration = async () => {
    try {
      await createRegistration({
        userId: 'user123',
        eventId: 'event456',
        adminBooked: false
      });
      alert('Registration created successfully!');
    } catch (error) {
      alert('Failed to create registration: ' + error.message);
    }
  };

  const handleCheckIn = async (registrationId) => {
    try {
      await checkInUser(registrationId);
      alert('User checked in successfully!');
    } catch (error) {
      alert('Check-in failed: ' + error.message);
    }
  };

  return (
    <div>
      <button onClick={handleCreateRegistration}>Create Registration</button>
      <button onClick={() => handleCheckIn('reg123')}>Check In User</button>
    </div>
  );
};
`;

// ===================================================================
// 12. COMPLETE API SUPERSET EXPORT
// ===================================================================

export default {
  BACKEND_CONFIG,
  API_RESPONSE_FORMATS,
  AUTH_APIS,
  EVENTS_APIS,
  REGISTRATIONS_APIS,
  TICKETS_APIS,
  ORGANIZERS_APIS,
  FEEDBACK_APIS,
  ADMIN_APIS,
  FACE_RECOGNITION_APIS,
  USERS_APIS,
  API_INTEGRATION_HELPER,
  REACT_INTEGRATION_EXAMPLES
};
