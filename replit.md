# Overview

This is a web-based farming simulation game built with a full-stack architecture. Players can plant multiple crop types (pumpkins and apples), grow diverse crops, and manage resources like coins, seeds, and harvested produce on a dynamic grid-based farm field. The game features real-time growth mechanics where crops take 60 minutes to mature, progressive field expansion from 3x3 up to 10x10, and a Kitchen system for processing pumpkins into valuable pies. Enhanced with fertilizer system for accelerated growth, multiple crop types with different pricing, and autumn/October theming throughout.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with custom CSS variables for theming, featuring an autumn color palette
- **State Management**: TanStack Query (React Query) for server state management with automatic caching and refetching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling

## Backend Architecture
- **Runtime**: Node.js with Express.js for the REST API server
- **Language**: TypeScript with ES modules for modern JavaScript features
- **API Design**: RESTful endpoints for player data, plot management, and game actions
- **Request Handling**: Express middleware for JSON parsing, URL encoding, and request logging
- **Error Handling**: Centralized error handling middleware with structured error responses

## Data Storage Solutions
- **Database**: PostgreSQL configured through Drizzle ORM
- **ORM**: Drizzle ORM with code-first schema definition and type generation
- **Schema Management**: Drizzle Kit for database migrations and schema synchronization
- **Development Storage**: In-memory storage implementation for development/demo purposes
- **Connection**: Neon Database serverless PostgreSQL for production deployments

## Database Schema Design
- **Players Table**: Stores user progress (coins, seeds, pumpkins, pies, fertilizer, field size, kitchen slots)
- **Plots Table**: Manages individual farm plots with state tracking (empty, seedling, growing, mature, fertilized)
- **Ovens Table**: Manages kitchen oven slots with baking state tracking (empty, baking, ready)
- **Relationships**: Plot and oven ownership linked to players through foreign keys
- **Timestamps**: Automatic tracking of planting time, baking start time, and last update for growth calculations
- **Dynamic Expansion**: Field sizing from 3x3 to 10x10 and kitchen slots from 1 to 5 with exponential cost scaling

## Game Logic Architecture
- **Growth System**: Time-based progression where pumpkins mature over 60 minutes (30 minutes with fertilizer boost)
- **Processing System**: Kitchen with expandable oven slots for baking pumpkins into pies (30-minute bake time)
- **Resource Management**: Multi-tier economy with pumpkin seeds (10 coins), apple seeds (5 coins), fertilizer (10 coins), pumpkins (25 coins), apples (15 coins), and pies (40 coins)
- **Field Management**: Dynamic grid system starting at 3x3, expandable to 10x10 with exponential cost scaling
- **Kitchen Management**: Oven slots starting at 1, expandable to 5 with progressive cost increases (100, 200, 400, 800 coins)
- **Enhancement System**: Fertilizer application for 2x growth speed with visual indicators
- **State Validation**: Comprehensive Zod schemas for runtime type checking and API request validation

## Development Tools
- **Build System**: Vite with React plugin for fast development and optimized production builds
- **Type Checking**: TypeScript with strict mode for compile-time safety
- **Code Quality**: ESLint and Prettier configurations for consistent code style
- **Development Experience**: Hot module replacement and runtime error overlays

# External Dependencies

## Core Framework Dependencies
- **@vitejs/plugin-react**: React integration for Vite build system
- **express**: Node.js web framework for API server
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management and caching

## UI Component Libraries
- **@radix-ui/***: Comprehensive set of unstyled, accessible UI primitives
- **tailwindcss**: Utility-first CSS framework for styling
- **class-variance-authority**: Utility for creating type-safe component variants
- **lucide-react**: Icon library with consistent SVG icons

## Database and Validation
- **@neondatabase/serverless**: Serverless PostgreSQL driver for Neon Database
- **drizzle-zod**: Integration between Drizzle ORM and Zod for schema validation
- **zod**: Runtime type validation and schema definition

## Development and Build Tools
- **typescript**: Static type checking and enhanced developer experience
- **tsx**: TypeScript execution engine for Node.js development
- **esbuild**: Fast JavaScript bundler for production builds
- **wouter**: Minimalist routing library for React applications

## Styling and Design
- **clsx**: Utility for conditional CSS class concatenation
- **tailwind-merge**: Utility for merging Tailwind CSS classes
- **date-fns**: Date manipulation library for time-based game mechanics