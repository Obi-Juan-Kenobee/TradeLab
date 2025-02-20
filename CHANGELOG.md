# Changelog

All notable changes to the TradeLab project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Tabbed interface for different market types (stocks, futures, options, cryptocurrency)
- Market-specific form fields for each trading instrument
- Form validation for required fields
- Reset button functionality for clearing form inputs
- Improved UI with smooth tab transitions and animations
- Better form organization with proper input types and validation
- Futures contract expiration month selection modal
- Automatic futures symbol construction with proper format (e.g., MESH2025)
- Support for common futures symbols (ES, NQ, MES, MNQ, CL, GC, SI, ZB, ZN, 6E)
- New Average Trade P&L chart showing daily average performance
- New Performance by Month of Year chart with pagination
  - Shows P&L and percentage contribution per month
  - 6 months per page with navigation controls
  - Color-coded bars for positive/negative performance
- Added detailed date comparison logging in analytics for better debugging
- Added trade date range information in analytics page load
- Enhanced time period filtering in analytics:
  - Added year selector (2024/2025)
  - New time period options (Current Year, Last 7/30/90 Days)
  - Custom date range picker for specific time periods
  - Improved UI with modern filter controls

### Changed
- Restructured trade entry form to use tabs for different market types
- Updated form styling for better user experience
- Improved button layout with addition of reset functionality
- Enhanced cumulative PnL chart with dynamic coloring:
  - Red segments for losses and green segments for profits
  - Continuous line with smooth color transitions
  - Matching fill colors above and below zero line
- Updated analytics page styling with consistent colors for profit/loss indicators
- Enhanced chart styling with consistent currency formatting
- Improved risk/reward ratio calculation to handle edge cases
- Updated excursion metrics calculation for better accuracy
- Updated calendar link in navigation to point to `calendar-dashboard.html`
- Standardized direction values in edit trade form to use lowercase "long"/"short"
- Improved debugging logs in analytics to better track date filtering process
- Refactored analytics time filtering system for better performance and reliability
- Simplified analytics UI updates to reduce redundant calls

### Fixed
- Duplicate ID issues in form fields
- Form validation handling for different market types
- Cumulative PnL and ROI display not updating with trade data
- Position MAE and Price MAE bars not displaying correctly in analytics
- Reference error in price performance chart calculation
- Fixed date shifting issues
- Fixed analytics time period filtering errors:
  - Resolved constant variable assignment issue
  - Fixed invalid time range handling
  - Improved error handling for empty trade arrays

## [1.0.0] - 2024-02-15

### Added
- Initial release of TradeLab
- Basic trade tracking functionality
- Analytics dashboard with charts and metrics
- Trade history with filtering capabilities
- Calendar view for trade visualization
- Import/Export functionality
- Market insights integration with TradingView
- Mobile-responsive design
- Dark/Light theme support
