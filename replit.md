# Overview

**Version 2.0.16** - This is a web-based farming simulation game built with a full-stack architecture featuring a map-based navigation system. Players navigate between different game areas through an interactive map menu: Farm Field for crop management, Kitchen for food processing, Marketplace for trading, and Store Front for customer orders. The game now features a map-style navigation system with an "autumn in the Smokey mountains" theme as the main menu hub. The game includes multiple crop types (pumpkins and apples), real-time growth mechanics, progressive field expansion from 3x3 up to 10x10, and a Kitchen system for processing crops into valuable pies. Enhanced with fertilizer system for accelerated growth, multiple crop types with different pricing, autumn/October theming throughout, and Google AdSense integration for monetization. **NEW in v2.0**: Comprehensive level progression system with incremental XP requirements, multi-activity experience earning, and tool-based advancement after level 10. **FIXED in v2.0.1**: TestFlight player initialization now properly provides starting resources (25 coins, 3 pumpkin seeds, 3 apple seeds) with persistent PostgreSQL database storage. **ENHANCED in v2.0.2**: Fixed field expansion limits and improved mobile device compatibility with proper database storage integration. **CRITICAL FIXES in v2.0.3**: Implemented full database persistence for plots and ovens, ensuring iOS app data persists between sessions and field expansion works correctly from 3x3 to 10x10. **NEW in v2.0.4**: Added daily free coins system - players can collect 5 coins once every 24 hours with database-tracked timing and user-friendly UI integration requiring active button press for collection. **MAJOR UPDATE in v2.0.6**: Implemented comprehensive customer order fulfillment system with 6 unique customer characters, time-limited orders with priority levels, reward system, and interactive storefront UI - Store Front is now fully operational and accessible from the map. **ENHANCED XP SYSTEM**: Added comprehensive XP display component showing cumulative experience requirements, detailed progress tracking, and level advancement visualization throughout all game pages. **iOS UI FIXES in v2.0.6**: Fixed map screen text alignment issue where content was scrunched to the right on iOS devices by repositioning XP display and improving responsive design. **MAJOR ENHANCEMENT in v2.0.7**: Added comprehensive dual-tab storefront system with marketplace quantity purchasing and direct selling functionality - players can now purchase items in bulk with smart controls and sell produce directly at discounted rates (pumpkins 22 coins, apples 12 coins) for immediate income alongside customer order fulfillment. **LAYOUT FIXES in v2.0.8**: Fixed farm page spacing issue by integrating navigation header directly into game component, eliminating large gaps between header and field plots for improved user experience. **TESTFLIGHT FIXES in v2.0.9**: Enhanced daily coins button interactivity for iOS devices with improved touch handling, added TestFlight-specific timer reset functionality, and comprehensive debugging tools for better mobile user experience. **ENVIRONMENT SYNC in v2.0.11**: Identified and resolved TestFlight deployment issues - production and development environments use separate databases, implemented environment debug endpoint and comprehensive deployment strategy to ensure feature parity between environments. **TESTFLIGHT STABILITY in v2.0.12**: Fixed storefront infinite refresh loops with enhanced error handling and connection recovery, added emergency resource restoration system for TestFlight users experiencing initialization issues, comprehensive production debugging tools for iOS deployment troubleshooting. **CRITICAL RESOURCE FIXES in v2.0.13**: Implemented dual-tier resource restoration system with emergency reset endpoint for TestFlight users - smart initialization fix plus force reset option ensures all users can restore proper starting balance (25 coins, 3 pumpkin seeds, 3 apple seeds) regardless of current state, with improved mobile spacing for iPhone devices. **GAME RESET FEATURE in v2.0.14**: Added comprehensive Settings menu on home screen with complete game reset functionality - players can now reset their entire progress to new player starting configuration (level 1, 25 coins, 3 seeds each) with confirmation dialog showing detailed reset information, including clearing all plots and ovens. **SETTINGS FIXES in v2.0.15**: Fixed "Unable to reset" error by implementing missing database methods for clearing plots and ovens - Settings menu game reset functionality now works perfectly for both development and production environments, ensuring iOS users can successfully reset their game progress once deployed. **iOS DEPLOYMENT ENHANCEMENTS**: Added comprehensive cache-busting mechanisms, forced Capacitor sync, aggressive build cleaning, and deployment verification to resolve iOS app update issues where UI changes weren't appearing despite successful builds. **VERSION UPDATE in v2.0.16**: Bumped to build 21 with enhanced deployment pipeline including version logging and cache-busting for iOS app store deployment.

# User Preferences

Preferred communication style: Simple, everyday language.
Farmer's Bolt: User prefers to manually select which crop type to plant using a selection interface, while keeping automatic harvesting for mature crops.
Challenge System: User requested seasonal mini-challenges with progressive difficulty - implemented with 5 challenge types (harvest, plant, bake, earn, expand) and real-time progress tracking. Daily challenges are automatically generated and can only be completed once per day (no manual reset functionality).
Initial Resources: New players should start with 3 pumpkin seeds, 3 apple seeds, and 25 coins when they first download and launch the game.
Daily Rewards: Players can collect 5 free coins once every 24 hours. This resets daily and provides a reliable coin income for progression.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with custom CSS variables for theming, featuring an autumn color palette
- **State Management**: TanStack Query (React Query) for server state management with automatic caching and refetching
- **Routing**: Wouter for lightweight client-side routing with map-based navigation system
- **Navigation**: Interactive map menu serving as main hub for accessing Farm Field, Kitchen, Marketplace, and Store Front areas
- **Forms**: React Hook Form with Zod validation for type-safe form handling

## Backend Architecture
- **Runtime**: Node.js with Express.js for the REST API server
- **Language**: TypeScript with ES modules for modern JavaScript features
- **API Design**: RESTful endpoints for player data, plot management, and game actions
- **Request Handling**: Express middleware for JSON parsing, URL encoding, and request logging
- **Error Handling**: Centralized error handling middleware with structured error responses

## Data Storage Solutions
- **Database**: PostgreSQL configured through Drizzle ORM with proper player initialization
- **ORM**: Drizzle ORM with code-first schema definition and type generation
- **Schema Management**: Drizzle Kit for database migrations and schema synchronization
- **Production Storage**: DatabaseStorage implementation using PostgreSQL for persistent player data
- **Connection**: Neon Database serverless PostgreSQL for production deployments
- **Player Initialization**: New players start with 25 coins, 3 pumpkin seeds, 3 apple seeds at level 1

## Database Schema Design
- **Players Table**: Stores user progress (coins, seeds, pumpkins, pies, fertilizer, field size, kitchen slots, lastDailyCollection)
- **Plots Table**: Manages individual farm plots with state tracking (empty, seedling, growing, mature, fertilized)
- **Ovens Table**: Manages kitchen oven slots with baking state tracking (empty, baking, ready)
- **Relationships**: Plot and oven ownership linked to players through foreign keys
- **Timestamps**: Automatic tracking of planting time, baking start time, last update, and daily coin collection timing
- **Dynamic Expansion**: Field sizing from 3x3 to 10x10 and kitchen slots from 1 to 5 with exponential cost scaling
- **Daily Rewards**: Database-tracked 24-hour cooldown system for free coin collection

## Game Logic Architecture
- **Growth System**: Time-based progression where pumpkins mature over 60 minutes and apples mature over 15 minutes (fertilizer reduces time by 50%)
- **Processing System**: Kitchen with expandable oven slots for baking pumpkins into pies (30-minute bake time) and apples into pies (15-minute bake time)
- **Resource Management**: Multi-tier economy with pumpkin seeds (10 coins), apple seeds (5 coins), fertilizer (10 coins), pumpkins (25 coins), apples (15 coins), and pies (40 coins for pumpkin, 25 coins for apple)
- **Field Management**: Dynamic grid system starting at 3x3, expandable to 10x10 with exponential cost scaling
- **Kitchen Management**: Oven slots starting at 1, expandable to 5 with progressive cost increases (100, 200, 400, 800 coins)
- **Enhancement System**: Fertilizer application for 2x growth speed with visual indicators
- **Experience System**: Multi-activity XP progression (5 XP planting, 10 XP harvesting, 15 XP baking pies, 20 XP kitchen expansion, 25 XP field expansion)
- **Level Progression**: Incremental XP requirements (Level 2: 100 XP, Level 3: 120 XP, Level 4: 144 XP, each level requiring 20% more XP) with feature unlocks, plus tool-based progression after level 10
- **Progress Visualization**: Dynamic XP progress bars showing current level progress and requirements for next level
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

## Monetization and Analytics
- **Google AdSense**: Integrated with app ID ca-app-pub-8626828126160251~5550874760 and ad unit ID ca-app-pub-8626828126160251/3935359007
- **AdBanner Component**: Reusable ad component with header, sidebar, and footer configurations
- **Strategic Ad Placement**: Header ads after navigation, footer ads at content end

## iOS Distribution Configuration
- **Bundle ID**: com.huntergames.pumpkinpatch
- **Apple ID**: 6749664824
- **App Version**: 2.0.16
- **Build Number**: 21
- **App Store Connect API**: Key ID 7629KQWD3Z, Issuer ID 27cc409c-83b9-4d67-a87f-99fc3d7c6f07
- **Provisioning Profile**: PumpkinPatch2
- **CodeMagic Integration**: Configured for automated App Store deployment with AFTER_APPROVAL release type on Mac mini M2 instances
- **Copyright**: 2025 Hunter Games
- **Capacitor Configuration**: Fixed webDir path to 'dist/public', iOS scheme settings, and splash screen configuration
- **Build Process**: Enhanced with proper asset building, error handling, and verification steps
- **White Screen Fix**: Added comprehensive error handling in main.tsx and improved iOS compatibility settings
- **App Icon Configuration**: Hunter Games pumpkin icon properly configured for Apple App Store recognition
  - Web app favicon and apple-touch-icon references updated in HTML
  - iOS native AppIcon.appiconset configured with Hunter Games pumpkin logo
  - Multiple icon sizes supported (57x57, 60x60, 72x72, 76x76, 114x114, 120x120, 144x144, 152x152, 180x180, 1024x1024)
  - Icon source: attached_assets/Hunter GAmes (1)_1754541378351.png