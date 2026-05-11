# 🧺 Nandlal Laundry - Data Entry System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)

A comprehensive data entry and management system for laundry businesses with version control, correction tracking, and detailed reporting.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Live Demo](#live-demo)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [User Roles](#user-roles)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## ✨ Features

### Core Features
- ✅ **Data Entry Form** - 5-field entry (Date, Customer, Ironing, Saree Ironing, Dry Cleaning)
- ✅ **Customer Management** - Add, search, and soft-delete customers (admin only)
- ✅ **Version Control** - Immutable entries with full correction history
- ✅ **Correction System** - Create new versions of entries with change tracking
- ✅ **Duplicate Prevention** - Warns when entry exists for same customer/date

### Reporting & Analytics
- 📊 **Daily Summary Report** - View and export daily entries
- 📝 **Change History Report** - Track all corrections with before/after values
- 👥 **Customer-wise Report** - Filter entries by customer with date range
- 📅 **Date Range Report** - Flexible date range with customer filtering
- 📥 **CSV Export** - Export any report to CSV format
- 🖨️ **Print Functionality** - Print-optimized reports (A4 paper)

### Security & Access Control
- 🔐 **Authentication** - Secure login with Supabase Auth
- 👑 **Role-Based Access** - Admin and Operator roles
- 🛡️ **Row Level Security** - Database-level security policies
- 👤 **Admin-Only Actions** - Customer deletion, user management

### User Experience
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🔍 **Search & Filters** - Advanced filtering on entries page
- 📄 **Pagination** - 20/50/100 items per page with navigation
- ⚡ **Fast Performance** - Optimized queries with pagination
- 🎨 **Modern UI** - Clean, professional interface with Tailwind CSS

## 🛠️ Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Frontend** | Next.js | 16.2.6 |
| | React | 19.1.0 |
| | TypeScript | 5.8.3 |
| | Tailwind CSS | 3.4.17 |
| **Backend** | Supabase | Latest |
| | PostgreSQL | Latest |
| **Authentication** | Supabase Auth | - |
| **Hosting** | Vercel | - |
| **Icons** | Lucide React | 0.487.0 |
| **Date Handling** | date-fns | 4.1.0 |
| **Form Management** | React Hook Form | 7.55.0 |
| **Validation** | Zod | 3.24.2 |

## 🚀 Live Demo

**[View Live Demo](https://nlde.vercel.app)**

*Demo credentials available upon request*

## 📸 Screenshots

### Dashboard
![Dashboard](https://via.placeholder.com/800x400?text=Dashboard+Screenshot)

### Data Entry Form
![Data Entry](https://via.placeholder.com/800x400?text=Data+Entry+Screenshot)

### Entries List with Filters
![Entries List](https://via.placeholder.com/800x400?text=Entries+List+Screenshot)

### Reports Page
![Reports](https://via.placeholder.com/800x400?text=Reports+Screenshot)

## 📦 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (free tier works)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nlde.git
   cd nlde
