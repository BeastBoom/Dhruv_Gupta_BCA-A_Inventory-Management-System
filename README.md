# Inventory Management System

A full-stack, multi-tenant Inventory Management System built with Node.js, Express, PostgreSQL and vanilla HTML/CSS/JS.  
Tracks Products, Categories, Customers, Orders, Vendors, Alerts & Product History with email verification and real-time stock alerts.

**Database May take 60 Seconds to load due to free instance**

![System Overview](https://github.com/BeastBoom/inventory-management-system/blob/main/images/System%20Overview.png?raw=true)  

---

## Project Report - [Link Here](https://github.com/BeastBoom/Dhruv_Gupta_BCA-A_Inventory-Management-System/blob/main/Project%20Report%20-%20Inventory%20Management%20System.pdf)

---

## Table of Contents

1. [Features](#features)  
2. [Tech Stack](#tech-stack)  
3. [Prerequisites](#prerequisites)  
4. [Installation & Setup](#installation--setup)  
5. [Database Schema](#database-schema)  
6. [Environment Variables](#environment-variables)  
7. [Running Locally](#running-locally)  
8. [API Endpoints](#api-endpoints)  
9. [Client-Side Structure](#client-side-structure)  
10. [Team](#team)  
11. [License & Credits](#license--credits)  
12. [Support](#support)  

---

## Features

### Core Functionality
- **Multi-Tenant Architecture**: Secure data isolation between users
- **Real-Time Inventory Tracking**: Live stock quantity updates

### User Authentication
- 🔐 Email-based signup with password strength validation (min 8 chars, special characters)
- 📧 Email verification flow with:
  - 6-digit code (1-hour expiry)
  - 3 resend attempts per 30 minutes
  - Session-based authentication using sessionStorage
  - Automatic account locking after 5 failed attempts

### Inventory Management
- 🧺 **Products & Categories**:
  - Full CRUD operations with cascading deletes
  - Barcode support (future-ready schema)
  - Batch tracking capabilities
- 📊 **Product History**:
  - Tracks 12 types of changes (name, price, quantity, category)
  - Automatic timestamping in IST (Asia/Kolkata)
  - Version history retention for 7 years

### Order Processing
- 🛒 **Order Management**:
  - Real-time stock validation during order creation
  - Automated refund processing on order modifications
  - Multi-item order support with dynamic pricing
  - Tax calculation hooks (placeholder implementation)

### Partner Management
- 👥 **Customers**:
  - Phone number validation (country-specific formats)
  - Email validation via MailboxLayer API
- 🏭 **Vendors**:
  - Automated reorder alerts
  - Lead time tracking for shipments

### Alert System
- 🔔 **Stock Alerts**:
  - Customizable low-stock thresholds
  - Automated vendor notifications via email
  - Alert acknowledgement system
  - Escalation rules for critical stock levels

### Advanced Features
- 📈 **Reporting**:
  - Stock movement reports
  - Sales trends analysis
  - Vendor performance metrics
- ⚙️ **System Administration**:
  - Audit logs for all critical operations
  - Database backup reminders
  - User activity monitoring

### UI/UX
- 🎨 **Tailwind-Inspired Design**:
  - Dark/light mode toggle (persisted in sessionStorage)
  - Responsive sidebar with dynamic collapse
  - Glassmorphism design patterns
- ✨ **Interactive Elements**:
  - Animated page transitions (CSS fade effects)
  - Context-aware modals for CRUD operations
  - Real-time data refresh indicators

---

## Tech Stack

### Backend
| Component          | Technology                          |
|---------------------|-------------------------------------|
| Runtime            | Node.js v18+                        |
| Framework          | Express.js                          |
| Database           | PostgreSQL v12+                     |
| ORM                | pg (PostgreSQL client)              |
| Authentication     | bcrypt, sessionStorage              |
| Email              | Nodemailer, MailboxLayer API        |
| Validation         | Regex, MailboxLayer                 |

### Frontend
| Component          | Technology                          |
|---------------------|-------------------------------------|
| Markup             | HTML5                               |
| Styling            | CSS                                 |
| Scripting          | Vanilla JavaScript ES6+             |
| State Management   | sessionStorage                      |
| Charts             | Chart.js                            |

### DevOps
| Service            | Purpose                             |
|---------------------|-------------------------------------|
| Render.com          | Backend Hosting                     |
| GitHub Pages        | Frontend Deployment                 |

---

## Prerequisites

### Hardware
- 1GB RAM minimum
- 100MB disk space

### Software
- Node.js v18+
- PostgreSQL v12+
- Modern web browser (Chrome 90+, Firefox 88+)

### Services
- [MailboxLayer API Key](https://apilayer.com/marketplace/email-verification-api)
- Gmail SMTP Credentials (or other email service)

---

## Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/BeastBoom/inventory-management-system.git
cd inventory-management-system
```

### 2. Install Dependencies
```bash
npm install pg express dotenv cors bcryptjs nodemailer node-fetch
```

### 3. Configure Environment
Create `.env` file:
```bash
.env
```
Edit `.env` with:
```ini
# PostgreSQL Configuration
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=securepassword
PG_DATABASE=inventory_db

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_VALIDATION_API_KEY=your_mailboxlayer_key
```

### 4. Database Initialization
The system automatically:
1. Tests database connection (5s timeout)
2. Creates tables in sequence (~200ms delay)
3. Sets up indexes and constraints
4. Verifies initial data consistency

Start the server to trigger initialization:
```bash
node index.js
```

---

## Database Schema

### Key Tables
- Users
- Categories
- Customer
- Products
- Orders
- Order_Items
- Vendors
- Product History
- Email Verification
- Vendor Products
- Reorder Alerts

### Performance Notes
- First connection attempt waits 5s before timeout
- Time Delays May take upto 60 seconds upon login
- Cold starts may experience 200-500ms delay during table creation
- All timestamp columns use `Asia/Kolkata` timezone

---

## Environment Variables

| Variable                  | Required | Default      | Description                          |
|---------------------------|----------|--------------|--------------------------------------|
| `PG_HOST`                 | Yes      | -            | PostgreSQL server host               |
| `PG_PORT`                 | No       | 5432         | PostgreSQL port                      |
| `PG_USER`                 | Yes      | -            | Database username                    |
| `PG_PASSWORD`             | Yes      | -            | Database password                    |
| `PG_DATABASE`             | Yes      | -            | Database name                        |
| `EMAIL_SERVICE`           | Yes      | -            | Nodemailer service provider          |
| `EMAIL_USER`              | Yes      | -            | SMTP authentication email           |
| `EMAIL_PASS`              | Yes      | -            | SMTP application password            |
| `EMAIL_VALIDATION_API_KEY`| No       | -            | MailboxLayer API key                 |
| `SESSION_SECRET`          | Yes      | -            | Session encryption secret            |
| `DEFAULT_TIMEZONE`        | No       | Asia/Kolkata | System timezone                      |

---

## Running Locally

### Backend Server
```bash
npm start
# Server listens on http://localhost:5432
```

### Frontend Setup
1. Open `index.html` in browser
2. Modify API endpoints in `static/*.js`:
```javascript
// Change all instances of:
'https://inventory-management-system-xtb4.onrender.com/api'
// To:
'http://localhost:5432/api'
```

### Testing Credentials
```json
{
  "admin": {"username": "admin@test.com", "password": "SecurePass123!"},
  "user": {"username": "user@test.com", "password": "AnotherSecure456!"}
}
```

---

## API Endpoints

### Authentication
| Method | Endpoint               | Description                          | Auth Required |
|--------|-------------------------|--------------------------------------|---------------|
| POST   | `/api/signup`           | User registration                   | No            |
| POST   | `/api/login`            | Session creation                    | No            |
| POST   | `/api/verify-code`      | Email verification                  | Yes           |
| POST   | `/api/resend-code`      | Resend verification code (≤3×/h)   | Yes           |

### Product Management
| Method | Endpoint                     | Description                      |
|--------|-------------------------------|----------------------------------|
| GET    | `/api/products`              | List all products               |
| POST   | `/api/products`              | Create new product              |
| GET    | `/api/products/:id/history`  | Get product change history      |
| PUT    | `/api/products/:id`          | Update product details          |
| DELETE | `/api/products/:id`          | Delete product                  |

### Order Processing
| Method | Endpoint               | Description                          |
|--------|-------------------------|--------------------------------------|
| POST   | `/api/orders`          | Create order with stock validation  |
| PUT    | `/api/orders/:id`      | Modify order (triggers refund)      |
| DELETE | `/api/orders/:id`      | Cancel order (restocks items)       |

---

## Client-Side Structure

```
frontend/
├── auth/
│   ├── login.html
│   ├── signup.html
│   └── reset-password.html
├── dashboard/
│   ├── index.html
│   ├── products/
│   │   ├── list.html
│   │   └── detail.html
│   └── orders/
│       ├── new.html
│       └── history.html
└── static/
    ├── js/
    │   ├── auth.js
    │   ├── products.js
    │   └── orders.js
    ├── css/
    │   ├── main.css
    │   └── dark-mode.css
    └── assets/
        ├── logo.svg
        └── favicon.ico
```

---

## Team

| Role                | Member           | Contribution Area                                  |
|---------------------|------------------|----------------------------------------------------|
| Backend | Frontend  | Dhruv Gupta      | API Architecture, DB Optimization, Responsiveness  |
| Frontend            | Kshitij Marwah   | User Interface/User Experience                     |
| Designing           | Mehul Srivastava | Designing                                          |

---

## License & Credits

**MIT License**  
© 2025 Inventory Management Team

Third-Party Credits:
- Email Validation by [MailboxLayer](https://apilayer.com)
- Icons from [FontAwesome](https://fontawesome.com)
- SMTP Services via [Nodemailer](https://nodemailer.com)

---

## Support

For technical issues:
- 📧 Email: stockez.in@gmail.com
- 🐛 GitHub Issues: [Repository Issues](https://github.com/BeastBoom/inventory-management-system/issues)
---
